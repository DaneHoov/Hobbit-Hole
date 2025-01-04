const express = require("express");
const bcrypt = require("bcryptjs");

const { requireAuth } = require("../../utils/auth");
const { Spot, User, SpotImage } = require("../../db/models");
const router = express.Router();
const { check } = require("express-validator");
const { handleValidationErrors } = require("../../utils/validation");

const validateSpot = [
  check("address")
    .exists({ checkFalsy: true })
    .withMessage("Street address is required"),
  check("city").exists({ checkFalsy: true }).withMessage("City is required"),
  check("state").exists({ checkFalsy: true }).withMessage("State is required"),
  check("country")
    .exists({ checkFalsy: true })
    .withMessage("Country is required"),
  check("lat")
    .exists({ checkFalsy: true })
    .isFloat({ min: -90, max: 90 })
    .withMessage("Latitude must be within -90 and 90"),
  check("lng")
    .exists({ checkFalsy: true })
    .isFloat({ min: -180, max: 180 })
    .withMessage("Longitude must be within -180 and 180"),
  check("name")
    .exists({ checkFalsy: true })
    .isLength({ min: 1, max: 49 })
    .withMessage("Name must be less than 50 characters"),
  check("description")
    .exists({ checkFalsy: true })
    .withMessage("Description is required"),
  check("price")
    .isInt({ min: 1 })
    .withMessage("Price per day must be a positive number"),
  handleValidationErrors,
];

//Create a spot
router.post("/", requireAuth, validateSpot, async (req, res) => {
  const { address, city, state, country, lat, lng, name, description, price } =
    req.body;
  const spot = await Spot.create({
    ownerId: req.user.id,
    address,
    city,
    state,
    country,
    lat,
    lng,
    name,
    description,
    price,
  });

  const safeSpot = {
    id: spot.id,
    ownerId: spot.ownerId,
    address: spot.address,
    city: spot.city,
    state: spot.state,
    country: spot.country,
    lat: spot.lat,
    lng: spot.lng,
    name: spot.name,
    description: spot.description,
    price: spot.price,
  };

  return res.json({
    spot: safeSpot,
  });
});

//Get all spots
router.get("/", async (req, res) => {
  const spots = await Spot.findAll();
  res.json(spots);
});

//Get details of a Spot from an id
router.get("/:id", async (req, res) => {
  const spotId = req.params.id;

  const spot = await Spot.findOne({
    where: { id: spotId },
    attributes: [
      "id",
      "ownerId",
      "address",
      "city",
      "state",
      "country",
      "lat",
      "lng",
      "name",
      "description",
      "price",
      "createdAt",
      "updatedAt",
      "avgRating",
      "numReviews"
    ],
    include: [
      {
        model: SpotImage,
        attributes: ["id", "url", "previewImage"],
      },
      {
        model: User,
        attributes: ["id", "firstName", "lastName"],
      },
    ],
  });

  if (!spot) {
    return res.status(404).json({ message: "Spot couldn't be found" });
  }
});

//Get reviews by spot id
router.get("/:id/reviews", async (req, res) => {
  const spotId = req.params.id;

  const spot = await Spot.findByPk(spotId);
  if (!spot) {
    return res.status(404).json({ message: "Spot couldn't be found" });
  }

  const reviews = await Review.findAll({
    where: { spotId },
    include: [
      {
        model: User,
        attributes: ["id", "firstName", "lastName"],
      },
      {
        model: ReviewImage,
        attributes: ["id", "url"],
      },
    ],
  });

  return res.status(200).json({ Reviews: reviews });
});

//Get all bookings for a spot based on spot id
router.get("/:id/bookings", requireAuth, async (req, res) => {
  const userId = req.user.id;
  const spotId = req.params.id;

  const spot = await Spot.findByPk(spotId);

  if (!spot) {
    return res.status(404).json({
      message: "Spot couldn't be found",
    });
  }

  const isOwner = spot.ownerId === userId;

  const bookings = await Booking.findAll({
    where: { spotId },
    include: isOwner
      ? {
          model: User,
          attributes: ["id", "firstName", "lastName"],
        }
      : [],
  });

  // Format response based on whether the user is the spot owner or not
  const formattedBookings = bookings.map((booking) => ({
    id: booking.id,
    spotId: booking.spotId,
    startDate: booking.startDate,
    endDate: booking.endDate,
    ...(isOwner && {
      User: {
        id: booking.User.id,
        firstName: booking.User.firstName,
        lastName: booking.User.lastName,
      },
    }),
  }));

  res.status(200).json({
    Bookings: formattedBookings,
  });
});

//Create booking from a spot based on spot id
router.post(
  "/spots/:id/bookings",
  requireAuth,
  async (req, res) => {
    const userId = req.user.id;
    const spotId = req.params.id;
    const { startDate, endDate } = req.body;

    const spot = await Spot.findByPk(spotId);

    if (!spot) {
      return res.status(404).json({
        message: "Spot couldn't be found",
      });
    }

    if (spot.ownerId === userId) {
      return res.status(403).json({
        message: "You cannot book your own spot",
      });
    }

    const currentDate = new Date();
    if (new Date(startDate) < currentDate) {
      return res.status(400).json({
        message: "Bad Request",
        errors: {
          startDate: "startDate cannot be in the past",
        },
      });
    }

    if (new Date(endDate) <= new Date(startDate)) {
      return res.status(400).json({
        message: "Bad Request",
        errors: {
          endDate: "endDate cannot be on or before startDate",
        },
      });
    }

    const conflictingBooking = await Booking.findOne({
      where: {
        spotId,
        startDate: { [Op.lt]: endDate },
        endDate: { [Op.gt]: startDate },
      },
    });

    if (conflictingBooking) {
      return res.status(403).json({
        message: "Sorry, this spot is already booked for the specified dates",
        errors: {
          startDate: "Start date conflicts with an existing booking",
          endDate: "End date conflicts with an existing booking",
        },
      });
    }

    const newBooking = await Booking.create({
      spotId,
      userId,
      startDate,
      endDate,
    });

    res.status(201).json({
      id: newBooking.id,
      spotId: newBooking.spotId,
      userId: newBooking.userId,
      startDate: newBooking.startDate,
      endDate: newBooking.endDate,
      createdAt: newBooking.createdAt,
      updatedAt: newBooking.updatedAt,
    });
  }
);

//add query filters to get all spots
router.get("/api/spots", async (req, res) => {
  const {
    page = 1,
    size = 20,
    minLat,
    maxLat,
    minLng,
    maxLng,
    minPrice,
    maxPrice,
  } = req.query;

  //validate query params
  const errors = {};
  if (page < 1) errors.page = "Page must be greater than or equal to 1";
  if (size < 1 || size > 20) errors.size = "Size must be between 1 and 20";
  if (minLat && isNaN(minLat)) errors.minLat = "Minimum latitude is invalid";
  if (maxLat && isNaN(maxLat)) errors.maxLat = "Maximum latitude is invalid";
  if (minLng && isNaN(minLng)) errors.minLng = "Minimum longitude is invalid";
  if (maxLng && isNaN(maxLng)) errors.maxLng = "Maximum longitude is invalid";
  if (minPrice && isNaN(minPrice))
    errors.minPrice = "Minimum price must be greater than or equal to 0";
  if (maxPrice && isNaN(maxPrice))
    errors.maxPrice = "Maximum price must be greater than or equal to 0";

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ message: "Bad Request", errors });
  }

  //apply filters to db query
  const filters = {};

  if (minLat) filters.lat = { [Op.gte]: parseFloat(minLat) };
  if (maxLat) filters.lat = { [Op.lte]: parseFloat(maxLat) };
  if (minLng) filters.lng = { [Op.gte]: parseFloat(minLng) };
  if (maxLng) filters.lng = { [Op.lte]: parseFloat(maxLng) };
  if (minPrice) filters.price = { [Op.gte]: parseFloat(minPrice) };
  if (maxPrice) filters.price = { [Op.lte]: parseFloat(maxPrice) };

  const spots = await Spot.findAll({
    where: filters,
    limit: size,
    offset: (page - 1) * size,
    attributes: [
      "id",
      "ownerId",
      "address",
      "city",
      "state",
      "country",
      "lat",
      "lng",
      "name",
      "description",
      "price",
      "avgRating",
      "previewImage",
      "createdAt",
      "updatedAt",
    ],
  });

  const totalSpots = await Spot.count({ where: filters });
  const totalPages = Math.ceil(totalSpots / size);

  res.status(200).json({
    Spots: spots,
    page: page,
    size: size,
    totalPages: totalPages,
    totalSpots: totalSpots,
  });
});

module.exports = router;
