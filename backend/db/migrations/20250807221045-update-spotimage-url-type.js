'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.changeColumn('SpotImages', 'url', {
      type: Sequelize.TEXT,
      allowNull: false
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.changeColumn('SpotImages', 'url', {
      type: Sequelize.STRING,
      allowNull: false
    });
  }
};