'use strict';

const { options } = require("../../routes/api/reviews");
const { Review } = require("../models");
const bcrypt = require("bcryptjs");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await Review.bulkCreate([
      {
        userId: 1,
        spotId: 1,
        review: "My dissapointment is immeasurable, and my day is ruined.",
        stars: 1
      },
      {
        userId: 2,
        spotId: 2,
        review: 'Host cuddled me every night. 10/10 would book again.',
        stars: 5
      }
    ])
  },

  async down (queryInterface, Sequelize) {
    options.tableName = 'Reviews';
    const Op = Sequelize.Op;
    return queryInterface.bulkDelete(
      options,
      {
        stars: { [Op.in]: [1, 5] },
      },
    )
  }
};
