module.exports = {
  up: async (params) => {
    const queryInterface = params?.context || params;
    const dialect = queryInterface?.sequelize?.getDialect?.() || 'postgres';
    if (dialect !== 'postgres') {
      return;
    }

    await queryInterface.sequelize.query(`
      ALTER TABLE IF EXISTS public.sequelize_meta ENABLE ROW LEVEL SECURITY;
    `);
  },

  down: async (params) => {
    const queryInterface = params?.context || params;
    const dialect = queryInterface?.sequelize?.getDialect?.() || 'postgres';
    if (dialect !== 'postgres') {
      return;
    }

    await queryInterface.sequelize.query(`
      ALTER TABLE IF EXISTS public.sequelize_meta DISABLE ROW LEVEL SECURITY;
    `);
  },
};
