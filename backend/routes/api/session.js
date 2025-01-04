const express = require("express");
const { Op } = require("sequelize");
const bcrypt = require("bcryptjs");

const {
  setTokenCookie,
  restoreUser,
  requireAuth,
} = require("../../utils/auth");
const { User, Spot } = require("../../db/models");
const { check } = require("express-validator");
const { handleValidationErrors } = require("../../utils/validation");
const router = express.Router();

// Log out
router.delete("/", (_req, res) => {
  res.clearCookie("token");
  return res.json({ message: "success" });
});

// Restore session user
router.get("/", (req, res) => {
  const { user } = req;
  if (user) {
    const safeUser = {
      id: user.id,
      email: user.email,
      username: user.username,
    };
    return res.json({
      user: safeUser,
    });
  } else return res.json({ user: null });
});

const validateLogin = [
  check("credential")
    .exists({ checkFalsy: true })
    .notEmpty()
    .withMessage("Please provide a valid email or username."),
  check("password")
    .exists({ checkFalsy: true })
    .withMessage("Please provide a password."),
  handleValidationErrors,
];

// Log in
router.post("/", validateLogin, async (req, res, next) => {
  const { credential, password } = req.body;

  const user = await User.unscoped().findOne({
    where: {
      [Op.or]: {
        username: credential,
        email: credential,
      },
    },
  });

  if (!user || !bcrypt.compareSync(password, user.hashedPassword.toString())) {
    const err = new Error("Login failed");
    err.status = 401;
    err.title = "Login failed";
    err.errors = { credential: "The provided credentials were invalid." };
    return next(err);
  }

  const safeUser = {
    id: user.id,
    email: user.email,
    username: user.username,
  };

  await setTokenCookie(res, safeUser);

  return res.json({
    user: safeUser,
  });
});

//Get Current User
router.get("/", (req, res) => {
  if (req.user) {
    return res.json(user);
  }
});

//Get all spots by current user
router.get("/spots/current", requireAuth, async (req, res) => {
  const ownerId = req.user.id;

  const spots = await Spot.findAll({
    where: { ownerId: ownerId },
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
      "previewImage",
    ],
  });
  return res.status(200).json({ Spots: spots });
});

//get all reviews of current user
router.get("/reviews/current", requireAuth, async (req, res) => {
  const ownerId = req.user.id;

  const reviews = await Review.findAll({
    where: { ownerId },
    include: [
      {
        model: User,
        attributes: ["id", "firstName", "lastName"],
      },
      {
        model: Spot,
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
          "price",
          "previewImage"
        ],
      },
      {
        model: ReviewImage,
        attributes: [
          "id",
          "url",
        ],
      },
    ],
  });

  return res.status(200).json({ Reviews: reviews });
});

//Create review for spot based on spot id
router.post("/spots/:id/reviews", requireAuth, async (req, res) => {
  const spotId = req.params.id;
  const { review, stars } = req.body;
  const ownerId = req.user.id;

  const spot = await Spot.findByPk(spotId);
  if (!spot) {
    return res.status(404).json({ message: "Spot couldn't be found" });
  }

  const existingReview = await Review.findOne({ where: { spotId, ownerId } });
  if (existingReview) {
    return res
      .status(403)
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
    ownerId,
    spotId,
    review,
    stars,
  });

  return res.status(201).json(newReview);
});

//Edit review
router.put("/reviews/:id", requireAuth, async (req, res) => {
  const { review, stars } = req.body;
  const reviewId = req.params.id;

  if (!review || !stars) {
    return res.status(400).json({
      message: "Bad Request",
      errors: {
        review: "Review text is required",
        stars: "Stars must be an integer from 1 to 5",
      },
    });
  }

  if (typeof stars !== "number" || stars < 1 || stars > 5) {
    return res.status(400).json({
      message: "Bad Request",
      errors: {
        stars: "Stars must be an integer from 1 to 5",
      },
    });
  }

  const reviewToUpdate = await Review.findByPk(reviewId);

  if (!reviewToUpdate) {
    return res.status(404).json({
      message: "Review couldn't be found",
    });
  }

  reviewToUpdate.review = review;
  reviewToUpdate.stars = stars;
  await reviewToUpdate.save();

  res.status(200).json({
    id: reviewToUpdate.id,
    ownerId: reviewToUpdate.ownerId,
    spotId: reviewToUpdate.spotId,
    review: reviewToUpdate.review,
    stars: reviewToUpdate.stars,
    createdAt: reviewToUpdate.createdAt,
    updatedAt: reviewToUpdate.updatedAt,
  });
});

//Delete a review
router.delete(
  "/reviews/:id",
  requireAuth,
  async (req, res) => {
    const reviewId = req.params.id;

    const reviewToDelete = await Review.findByPk(reviewId);

    if (!reviewToDelete) {
      return res.status(404).json({
        message: "Review couldn't be found",
      });
    }

    await reviewToDelete.destroy();

    res.status(200).json({
      message: "Successfully deleted",
    });
  }
);

//Add image to spot based on Spot id
router.post("/spots/:id/images", requireAuth, async (req, res) => {
  const spotId = req.params.id;
  const { url, preview } = req.body;

  const spot = await Spot.findOne({
    where: { id: spotId, ownerId: req.user.id },
  });

  if (!spot) {
    return res.status(404).json({ message: "Spot couldn't be found" });
  }

  // Count existing images for the review
  const imageCount = await ReviewImage.count({ where: { reviewId: id } });

  // Check if the maximum number of images (10) is reached
  if (imageCount >= 10) {
    return res.status(403).json({
      message: 'Maximum number of images for this resource was reached'
    });
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
router.put("/spots/:id", requireAuth, async (req, res) => {
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
    where: { id: spotId, ownerId: req.user.id },
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
router.delete("/spots/:id", requireAuth, async (req, res) => {
  const spotId = req.params.id;

  const spot = await Spot.findOne({
    where: { id: spotId, ownerId: req.user.id },
  });

  if (!spot) {
    return res.status(404).json({ message: "Spot couldn't be found" });
  }

  await spot.destroy();

  return res.status(200).json({ message: "Successfully deleted" });
});

//Get all of current users bookings
router.get("/users/:id/bookings", requireAuth, async (req, res) => {
  const ownerId = req.user.id;

  const bookings = await Booking.findAll({
    where: { ownerId },
    include: {
      model: Spot,
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
        "price",
        "previewImage",
      ],
    },
  });

  res.status(200).json({
    Bookings: bookings.map((booking) => ({
      id: booking.id,
      spotId: booking.spotId,
      Spot: booking.Spot,
      ownerId: booking.ownerId,
      startDate: booking.startDate,
      endDate: booking.endDate,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
    })),
  });
});

//Edit booking
router.put("/bookings/:id", requireAuth, async (req, res) => {
  const ownerId = req.user.id;
  const bookingId = req.params.id;
  const { startDate, endDate } = req.body;

  const booking = await Booking.findByPk(bookingId);

  if (!booking) {
    return res.status(404).json({
      message: "Booking couldn't be found",
    });
  }

  if (booking.ownerId !== ownerId) {
    return res.status(403).json({
      message: "You cannot edit someone else's booking",
    });
  }

  const currentDate = new Date();
  if (new Date(booking.endDate) < currentDate) {
    return res.status(403).json({
      message: "Past bookings can't be modified",
    });
  }

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
      spotId: booking.spotId,
      startDate: { [Op.lt]: endDate },
      endDate: { [Op.gt]: startDate },
      id: { [Op.ne]: bookingId },
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

  booking.startDate = startDate;
  booking.endDate = endDate;
  await booking.save();

  res.status(200).json({
    id: booking.id,
    spotId: booking.spotId,
    ownerId: booking.ownerId,
    startDate: booking.startDate,
    endDate: booking.endDate,
    createdAt: booking.createdAt,
    updatedAt: booking.updatedAt,
  });
});

//Delete a booking
router.delete("/bookings/:id", requireAuth, async (req, res) => {
  const ownerId = req.user.id;
  const bookingId = req.params.id;

  const booking = await Booking.findByPk(bookingId, {
    include: [{ model: Spot, attributes: ["ownerId"] }],
  });

  if (!booking) {
    return res.status(404).json({
      message: "Booking couldn't be found",
    });
  }

  if (booking.ownerId !== ownerId && booking.Spot.ownerId !== ownerId) {
    return res.status(403).json({
      message: "You don't have permission to delete this booking",
    });
  }

  const currentDate = new Date();
  if (new Date(booking.startDate) < currentDate) {
    return res.status(400).json({
      message: "Bookings that have been started can't be deleted",
    });
  }

  await booking.destroy();

  res.status(200).json({
    message: "Successfully deleted",
  });
});

//Delete spot image
router.delete(
  "/spots/:id/images/:imageId",
  requireAuth,
  async (req, res) => {
    const ownerId = req.user.id; // Assuming user ID is available after authentication
    const spotId = req.params.id;
    const imageId = req.params.imageId;

    const spot = await Spot.findByPk(spotId);

    if (!spot) {
      return res.status(404).json({
        message: "Spot couldn't be found",
      });
    }

    if (spot.ownerId !== ownerId) {
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

//Delete review image
router.delete(
  "/reviews/:reviewId/images/:imageId",
  requireAuth,
  async (req, res) => {
    const ownerId = req.user.id;
    const reviewId = req.params.reviewId;
    const imageId = req.params.imageId;

    const review = await Review.findByPk(reviewId);

    if (!review) {
      return res.status(404).json({
        message: "Review couldn't be found",
      });
    }

    if (review.ownerId !== ownerId) {
      return res.status(403).json({
        message: "You don't have permission to delete this image",
      });
    }

    const reviewImage = await ReviewImage.findOne({
      where: {
        id: imageId,
        reviewId: reviewId,
      },
    });

    if (!reviewImage) {
      return res.status(404).json({
        message: "Review Image couldn't be found",
      });
    }

    await reviewImage.destroy();

    res.status(200).json({
      message: "Successfully deleted",
    });
  }
);


module.exports = router;
