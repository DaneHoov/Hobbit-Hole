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
  const userId = req.user.id;

  const spots = await Spot.findAll({
    where: { ownerId: userId },
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
router.get("/reviews", requireAuth, async (req, res) => {
  const userId = req.user.id;

  const reviews = await Review.findAll({
    where: { userId },
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
          ["previewImage", "previewImage"],
        ],
      },
      {
        model: ReviewImage,
        attributes: ["id", "url"],
      },
    ],
  });

  return res.status(200).json({ Reviews: reviews });
});

//Get all of current users bookings
router.get("/bookings", authenticate, async (req, res) => {
  const userId = req.user.id;

  const bookings = await Booking.findAll({
    where: { userId },
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
      userId: booking.userId,
      startDate: booking.startDate,
      endDate: booking.endDate,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
    })),
  });
});

//Edit booking
router.put("/bookings/:id", authenticate, async (req, res) => {
  const userId = req.user.id;
  const bookingId = req.params.id;
  const { startDate, endDate } = req.body;

  const booking = await Booking.findByPk(bookingId);

  if (!booking) {
    return res.status(404).json({
      message: "Booking couldn't be found",
    });
  }

  if (booking.userId !== userId) {
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
    userId: booking.userId,
    startDate: booking.startDate,
    endDate: booking.endDate,
    createdAt: booking.createdAt,
    updatedAt: booking.updatedAt,
  });
});

//Delete a booking
router.delete("/api/session/bookings/:id", authenticate, async (req, res) => {
  const userId = req.user.id;
  const bookingId = req.params.id;

  const booking = await Booking.findByPk(bookingId, {
    include: [{ model: Spot, attributes: ["ownerId"] }],
  });

  if (!booking) {
    return res.status(404).json({
      message: "Booking couldn't be found",
    });
  }

  if (booking.userId !== userId && booking.Spot.ownerId !== userId) {
    return res.status(403).json({
      message: "You don't have permission to delete this booking",
    });
  }

  const currentDate = new Date();
  if (new Date(booking.startDate) < currentDate) {
    return res.status(403).json({
      message: "Bookings that have been started can't be deleted",
    });
  }

  await booking.destroy();

  res.status(200).json({
    message: "Successfully deleted",
  });
});

module.exports = router;
