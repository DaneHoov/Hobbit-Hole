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
          url: 'https://static.wikia.nocookie.net/middle-earth-film-saga/images/b/b5/Helm%27s_Deep.jpg/revision/latest?cb=20210716160627',
          preview: true,
          spotId: 1
        },
        {
          url: 'https://upload.wikimedia.org/wikipedia/en/thumb/f/fe/Helmsdeep-siege.jpg/280px-Helmsdeep-siege.jpg',
          preview: true,
          spotId: 1
        },
        {
          url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f2/Baggins_residence_%27Bag_End%27_with_party_sign.jpg/1200px-Baggins_residence_%27Bag_End%27_with_party_sign.jpg',
          preview: true,
          spotId: 2
        },
        {
          url: 'https://i.redd.it/we-went-inside-hobbitons-two-new-hobbit-holes-which-opened-v0-f9u9vhhnmzfc1.jpg?width=6000&format=pjpg&auto=webp&s=d7ea2737138845cd34d40a34506a4f4bb936decc',
          preview: true,
          spotId: 2
        },
        {
          url: 'https://i.redd.it/68nnm70z5yyb1.jpg',
          preview: true,
          spotId: 3
        },
        {
          url: 'https://static.wikia.nocookie.net/pjmidearthfilms/images/5/53/Barad_Dur.webp/revision/latest/scale-to-width-down/3840?cb=20230503200050',
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
