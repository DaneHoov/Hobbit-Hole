'use strict';

const { Spot } = require("../models");
const bcrypt = require("bcryptjs");

let options = {};
if (process.env.NODE_ENV === "production") {
  options.schema = process.env.SCHEMA; // define your schema in options object
}


module.exports = {
  async up (queryInterface, Sequelize) {
    await Spot.bulkCreate(
      [
        {
          ownerId: 1,
          address: "123 Should Exist Street",
          city: "San Frangoodtogo",
          state: "California",
          country: "United States of Valid Data",
          lat: 37.7645358,
          lng: -122.4730327,
          name: "The Good Spot",
          description: "Place where valid data can stay",
          price: 123,
          avgRating: 4.5,
          numReviews: 99,
          previewImage: 'image url',
          SpotImages: []
        },
        {
          ownerId: 2,
          address: "666 Satan's alley",
          city: "Newark",
          state: "New Jersey",
          country: "United States of Your Mom",
          lat: 69.4206969,
          lng: -119.4736727,
          name: "The Devil's Buttcrack",
          description: "Place where I LOVE to stay",
          price: 666,
          avgRating: 4,
          numReviews: 420,
          previewImage: 'image url',
          SpotImages: []
        },
        {
          ownerId: 3,
          address: "6 Feet Under",
          city: "New York",
          state: "New York",
          country: "United States of Healthcare CEO's",
          lat: 37.7645358,
          lng: -122.4730327,
          name: "Brian Thompson's Grave",
          description: "Luigi says 'hi'",
          price: 1,
          avgRating: 5,
          numReviews: 69,
          previewImage: 'image url',
          SpotImages: []
        },
      ]
    )
  },

  async down (queryInterface, Sequelize) {
    options.tableName = 'Spots';
    const Op = Sequelize.Op;
    return queryInterface.bulkDelete(
      options,
      {
        name: { [Op.in]: ["The Good Spot", "The Devil's Buttcrack", "Brian Thompson's Grave"] },
      },
    )
  }
};
