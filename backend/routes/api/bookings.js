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

//Get all of current users bookings
router.get("/current", requireAuth, async (req, res) => {
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
      ownerId: booking.userId,
      startDate: booking.startDate,
      endDate: booking.endDate,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
    })),
  });


  //Edit booking
router.put("/:id", requireAuth, async (req, res) => {
  const ownerId = req.user.id;
  const bookingId = req.params.id;
  const { startDate, endDate } = req.body;

  const booking = await Booking.findByPk(bookingId);

  if (!booking) {
    return res.status(404).json({
      message: "Booking couldn't be found",
    });
  }

  if (booking.userId !== ownerId) {
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
    ownerId: booking.userId,
    startDate: booking.startDate,
    endDate: booking.endDate,
    createdAt: booking.createdAt,
    updatedAt: booking.updatedAt,
  });
});

//Delete a booking
router.delete("/:id", requireAuth, async (req, res) => {
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

  if (booking.userId !== ownerId && booking.Spot.ownerId !== ownerId) {
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

});

