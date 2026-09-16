// config/migrator.js
const path = require('path');
const { Umzug, SequelizeStorage } = require('umzug');
const { sequelize } = require('./db');

const migrator = new Umzug({
  migrations: {
    glob: ['../migrations/*.js', { cwd: __dirname }],
    resolve: ({ name, path: filepath }) => {
      const migration = require(filepath);
      return {
        name,
        up: async () =>
          migration.up({
            context: sequelize.getQueryInterface(),
            Sequelize: sequelize.constructor,
          }),
        down: async () =>
          migration.down({
            context: sequelize.getQueryInterface(),
            Sequelize: sequelize.constructor,
          }),
      };
    },
  },
  context: sequelize.getQueryInterface(),
  storage: new SequelizeStorage({
    sequelize,
    tableName: 'sequelize_meta',
    modelName: 'SequelizeMeta',
  }),
  logger: console,
});

module.exports = migrator;
