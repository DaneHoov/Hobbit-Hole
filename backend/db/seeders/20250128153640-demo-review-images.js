'use strict';

const { ReviewImage } = require("../models");
const bcrypt = require("bcryptjs");

let options = {};
if (process.env.NODE_ENV === "production") {
  options.schema = process.env.SCHEMA; // define your schema in options object
}

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await ReviewImage.bulkCreate(
      [
        {
          url: 'https://angrystaffofficer.com/wp-content/uploads/2019/10/coetttbs_023.jpg?w=600',
          reviewId: 1
        },
        {
          url: 'https://i0.wp.com/www.hellokelinda.com/wp-content/uploads/2020/04/bag-end-sitting-room.jpg?resize=800%2C350&ssl=1',
          reviewId: 2
        },
        {
          url: 'https://tolkiengateway.net/w/images/thumb/6/6a/Alan_Lee_-_The_building_of_Barad-dur.jpg/300px-Alan_Lee_-_The_building_of_Barad-dur.jpg',
          reviewId: 3
        }
      ]
    )
  },

  async down (queryInterface, Sequelize) {
    options.tableName = 'ReviewImages';
    const Op = Sequelize.Op;
    return queryInterface.bulkDelete(
      options,
      {
        reviewId: { [Op.in]: [1, 2, 3] },
      },
    )
  }
};
