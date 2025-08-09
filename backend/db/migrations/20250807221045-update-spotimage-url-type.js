'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const schema = process.env.SCHEMA;
    const table = schema ? { tableName: 'SpotImages', schema } : 'SpotImages';

    return queryInterface.changeColumn(table, 'url', {
      type: Sequelize.TEXT,
      allowNull: false,
    });
  },

  down: async (queryInterface, Sequelize) => {
    const schema = process.env.SCHEMA;
    const table = schema ? { tableName: 'SpotImages', schema } : 'SpotImages';

    return queryInterface.changeColumn(table, 'url', {
      type: Sequelize.STRING,
      allowNull: false,
    });
  }
};