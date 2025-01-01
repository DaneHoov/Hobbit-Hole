const express = require("express");
const bcrypt = require("bcryptjs");

const { requireAuth } = require("../../utils/auth");
const { Spot, User } = require("../../db/models");
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
    ],
    include: [
      {
        model: SpotImage,
        attributes: ["id", "url", "preview"],
      },
      {
        model: User,
        as: "Owner",
        attributes: ["id", "firstName", "lastName"],
      },
    ],
  });

  if (!spot) {
    return res.status(404).json({ message: "Spot couldn't be found" });
  }
});

//Add image to spot based on Spot id
router.post("/:id/images", requireAuth, async (req, res) => {
  const spotId = req.params.id;
  const { url, preview } = req.body;

  //spot exists and belongs to current user
  const spot = await Spot.findOne({
    where: { id: spotId, userId: req.user.id },
  });

  if (!spot) {
    return res.status(404).json({ message: "Spot couldn't be found" });
  }

  const image = await Image.create({
    spotId,
    url,
    preview,
  });

  return res.status(201).json({
    id: image.id,
    url: image.url,
    preview: image.preview,
  });
});

//Edit a spot
router.put("/api/session/spots/:id", requireAuth, async (req, res) => {
  const spotId = req.params.id;
  const { address, city, state, country, lat, lng, name, description, price } =
    req.body;

  const errors = {};
  if (!address) errors.address = "Street address is required";
  if (!city) errors.city = "City is required";
  if (!state) errors.state = "State is required";
  if (!country) errors.country = "Country is required";
  if (lat === undefined || lat < -90 || lat > 90)
    errors.lat = "Latitude must be within -90 and 90";
  if (lng === undefined || lng < -180 || lng > 180)
    errors.lng = "Longitude must be within -180 and 180";
  if (!name || name.length > 50)
    errors.name = "Name must be less than 50 characters";
  if (!description) errors.description = "Description is required";
  if (price === undefined || price <= 0)
    errors.price = "Price per day must be a positive number";

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ message: "Bad Request", errors });
  }

  //spot exists and belongs to the current user
  const spot = await Spot.findOne({
    where: { id: spotId, userId: req.user.id },
  });

  if (!spot) {
    return res.status(404).json({ message: "Spot couldn't be found" });
  }

  await spot.update({
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

  return res.status(200).json(spot);
});

//Delete spot
router.delete("/:id", requireAuth, async (req, res) => {
  const spotId = req.params.id;

  const spot = await Spot.findOne({
    where: { id: spotId, userId: req.user.id },
  });

  if (!spot) {
    return res.status(404).json({ message: "Spot couldn't be found" });
  }

  await spot.destroy();

  return res.status(200).json({ message: "Successfully deleted" });
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

//Create review for spot based on spot id
router.post("/:id/reviews", requireAuth, async (req, res) => {
  const spotId = req.params.id;
  const { review, stars } = req.body;
  const userId = req.user.id;

  const spot = await Spot.findByPk(spotId);
  if (!spot) {
    return res.status(404).json({ message: "Spot couldn't be found" });
  }

  const existingReview = await Review.findOne({ where: { spotId, userId } });
  if (existingReview) {
    return res
      .status(500)
      .json({ message: "User already has a review for this spot" });
  }

  if (!review) {
    return res.status(400).json({
      message: "Bad Request",
      errors: { review: "Review text is required" },
    });
  }
  if (!stars || stars < 1 || stars > 5) {
    return res.status(400).json({
      message: "Bad Request",
      errors: { stars: "Stars must be an integer from 1 to 5" },
    });
  }

  const newReview = await Review.create({
    userId,
    spotId,
    review,
    stars,
  });

  return res.status(201).json(newReview);
});

//Get all bookings for a spot based on spot id
router.get("/:id/bookings", authenticate, async (req, res) => {
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
  "/api/session/spots/:id/bookings",
  authenticate,
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

//Delete spot image
router.delete(
  "/api/session/spots/:id/images/:imageId",
  authenticate,
  async (req, res) => {
    const userId = req.user.id; // Assuming user ID is available after authentication
    const spotId = req.params.id;
    const imageId = req.params.imageId;

    const spot = await Spot.findByPk(spotId);

    if (!spot) {
      return res.status(404).json({
        message: "Spot couldn't be found",
      });
    }

    if (spot.ownerId !== userId) {
      return res.status(403).json({
        message: "You don't have permission to delete this image",
      });
    }

    const spotImage = await SpotImage.findOne({
      where: {
        id: imageId,
        spotId: spotId,
      },
    });

    if (!spotImage) {
      return res.status(404).json({
        message: "Spot Image couldn't be found",
      });
    }

    await spotImage.destroy();

    res.status(200).json({
      message: "Successfully deleted",
    });
  }
);

module.exports = router;
