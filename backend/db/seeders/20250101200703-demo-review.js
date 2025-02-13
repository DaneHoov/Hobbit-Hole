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
        review: "The wall seems strong, until you look at the culvert and realize that some previously unknown explosive technology could blast a hole right through it. 1/5 would not recommend.",
        stars: 1
      },
      {
        userId: 3,
        spotId: 1,
        review: "The perfect place to defend yourself from a force of 10,000 Uruks. we will DEFINITELY be staying again!",
        stars: 5
      },
      {
        userId: 2,
        spotId: 2,
        review: "I was really expecting it to be a hole in a ground, but it was really very pleasant!",
        stars: 4
      },
      {
        userId: 1,
        spotId: 2,
        review: "LOVED the second breakfast nook!",
        stars: 5
      },
      {
        userId: 3,
        spotId: 3,
        review: "Giant flaming eye on top of building kept me up all night. Also, the very air you breathe is a poisonous fume. 1/5 would not recommend.",
        stars: 1
      },
      {
        userId: 2,
        spotId: 3,
        review: 'MY PRECIOUSSSSSSS',
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
