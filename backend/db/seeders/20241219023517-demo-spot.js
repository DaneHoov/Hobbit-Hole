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
          address: "715 Helm's Deep Ln",
          city: "Gondor",
          state: "The Westfold",
          country: "Middle Earth",
          lat: 37.7645358,
          lng: -122.4730327,
          name: "Helms Deep",
          description: "The last bastion of hope",
          price: 250,
          avgRating: 4.5,
          numReviews: 99,
          previewImage: 'https://upload.wikimedia.org/wikipedia/en/thumb/f/fe/Helmsdeep-siege.jpg/280px-Helmsdeep-siege.jpg',
          SpotImages: ['https://static.wikia.nocookie.net/middle-earth-film-saga/images/b/b5/Helm%27s_Deep.jpg/revision/latest?cb=20210716160627', 'https://upload.wikimedia.org/wikipedia/en/thumb/f/fe/Helmsdeep-siege.jpg/280px-Helmsdeep-siege.jpg']
        },
        {
          ownerId: 2,
          address: "125 Bagshot Row",
          city: "The Shire",
          state: "Eriador",
          country: "Middle Earth",
          lat: 69.4206969,
          lng: -119.4736727,
          name: "Bag End",
          description: "NO ADMITTANCE EXCEPT ON PARTY BUSINESS",
          price: 111,
          avgRating: 5,
          numReviews: 420,
          previewImage: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f2/Baggins_residence_%27Bag_End%27_with_party_sign.jpg/1200px-Baggins_residence_%27Bag_End%27_with_party_sign.jpg',
          SpotImages: ['https://upload.wikimedia.org/wikipedia/commons/thumb/f/f2/Baggins_residence_%27Bag_End%27_with_party_sign.jpg/1200px-Baggins_residence_%27Bag_End%27_with_party_sign.jpg', 'https://i.redd.it/we-went-inside-hobbitons-two-new-hobbit-holes-which-opened-v0-f9u9vhhnmzfc1.jpg?width=6000&format=pjpg&auto=webp&s=d7ea2737138845cd34d40a34506a4f4bb936decc']
        },
        {
          ownerId: 3,
          address: "666 Hellfire Blvd",
          city: "Mordor",
          state: "The Land of Shadow",
          country: "Middle Earth",
          lat: 37.7645358,
          lng: -122.4730327,
          name: "Barad-Dur",
          description: "The Dark Tower",
          price: 999.99,
          avgRating: 1.5,
          numReviews: 650,
          previewImage: 'https://i.redd.it/68nnm70z5yyb1.jpg',
          SpotImages: ['https://i.redd.it/68nnm70z5yyb1.jpg', 'https://static.wikia.nocookie.net/pjmidearthfilms/images/5/53/Barad_Dur.webp/revision/latest/scale-to-width-down/3840?cb=20230503200050']
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
        name: { [Op.in]: ["Helms Deep", "Bag End", "Barad-Dur"] },
      },
    )
  }
};
