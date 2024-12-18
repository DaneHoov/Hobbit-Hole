const express = require("express");
const bcrypt = require("bcryptjs");

const { setTokenCookie, requireAuth } = require("../../utils/auth");
const { Spot, User } = require("../../db/models");
const router = express.Router();
const { check } = require("express-validator");
const { handleValidationErrors } = require("../../utils/validation");

const validateSpot = [
  check("address")
    .exists({ checkFalsy: true })
    .withMessage("Street address is required"),
  check("city")
    .exists({ checkFalsy: true })
    .withMessage("City is required"),
  check("state")
    .exists({ checkFalsy: true })
    .withMessage("State is required"),
  check("country")
    .exists({ checkFalsy: true })
    .withMessage("Country is required"),
  check("lat")
    .exists({ checkFalsy: true}),
  check("lng")
    .exists({checkFalsy: true}),
  check("name")
    .exists({checkFalsy: true})
    .isLength({min: 1, max: 49})
    .withMessage("Name must be less than 50 characters"),
  check("description")
    .exists({ checkFalsy: true })
    .withMessage("Description is required"),
  check("price")
    .isCurrency({allow_negatives: false})
    .withMessage("Price per day must be a positive number"),
  handleValidationErrors,
]

//Create a spot
router.post('/spots', validateSpot, async (req, res) => {
    const {address, city, state, country, lat, lng, name, description, price} = req.body;
    const spot = await Spot.create({address, city, state, country, lat, lng, name, description, price});

    const safeSpot = {
        id: spot.id,
        address: spot.address,
        city: spot.city,
        state: spot.state,
        country: spot.country,
        lat: spot.lat,
        lng: spot.lng,
        name: spot.name,
        description: spot.description,
        price: spot.price
    }

    await setTokenCookie(res, safeUser);

    return res.json({
        spot: safeSpot
      });
})


module.exports = router
