'use strict';

const { Booking } = require("../models");
const bcrypt = require("bcryptjs");

let options = {};
if (process.env.NODE_ENV === "production") {
  options.schema = process.env.SCHEMA; // define your schema in options object
}


module.exports = {
  async up (queryInterface, Sequelize) {
    await Booking.bulkCreate(
      [
        {
          spotId: 1,
          userId: 1,
          startDate: '02/14/2025',
          endDate: '02/15/2025'
        },
        {
          spotId: 2,
          userId: 2,
          startDate: '04/20/2025',
          endDate: '10/31/2025'
        }
      ]
    )
  },

  async down (queryInterface, Sequelize) {
    options.tableName = 'Bookings';
    const Op = Sequelize.Op;
    return queryInterface.bulkDelete(
      options,
      {
        spotId: { [Op.in]: [1, 2] },
      },
    )
  }
};
