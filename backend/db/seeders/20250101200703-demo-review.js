'use strict';

const { options } = require("../../routes/api/reviews");
const { sequelize } = require("../models");
const Review = require('../models/review');
const bcrypt = require("bcryptjs");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await Review.bulkCreate([
      {
        review: "My dissapointment is immeasurable, and my day is ruined.",
        stars: 1
      }
    ])
  },

  async down (queryInterface, Sequelize) {
    options.tableName = 'Reviews';
    const Op = sequelize.Op;
    return queryInterface.bulkDelete(
      options,
      {
        stars: { [Op.in]: [1] },
      },
    )
  }
};
