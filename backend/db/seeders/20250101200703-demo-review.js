'use strict';

let options = {};
if (process.env.NODE_ENV === "production") {
  options.schema = process.env.SCHEMA; // define your schema in options object
}
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
