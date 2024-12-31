const express = require("express");
const { Op } = require("sequelize");
const bcrypt = require("bcryptjs");

const { setTokenCookie, restoreUser, requireAuth } = require("../../utils/auth");
const { User, Spot } = require("../../db/models");
const { check } = require("express-validator");
const { handleValidationErrors } = require("../../utils/validation");
const router = express.Router();

const validateReview = [
    check("review")
    .exists({checkFalsy: true})
    .withMessage("Review text is required"),
    check("stars")
    .isInt({min: 1, max: 5})
    .withMessage("Stars must be an integer from 1 to 5")
]
