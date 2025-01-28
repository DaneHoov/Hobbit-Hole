'use strict';

const { SpotImage } = require('../models')
const bcrypt = require("bcryptjs");

let options = {};
if (process.env.NODE_ENV === "production") {
  options.schema = process.env.SCHEMA; // define your schema in options object
}

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await SpotImage.bulkCreate(
      [
        {
          url: 'image1-url.jpg',
          preview: true,
          spotId: 1
        },
        {
          url: 'image2-url.jpg',
          preview: true,
          spotId: 1
        },
        {
          url: 'image3-url.jpg',
          preview: true,
          spotId: 2
        },
        {
          url: 'image4-url.jpg',
          preview: true,
          spotId: 2
        },
        {
          url: 'image5-url.jpg',
          preview: true,
          spotId: 3
        },
        {
          url: 'image6-url.jpg',
          preview: true,
          spotId: 3
        }
      ]
    )
  },

  async down (queryInterface, Sequelize) {
    options.tableName = 'SpotImages';
    const Op = Sequelize.Op;
    return queryInterface.bulkDelete(
      options,
      {
        spotId: { [Op.in]: [1, 2, 3] },
      },
    )
  }
};
