require('dotenv').config();
const app = require('./app');
const { getDatabase } = require('./database/connection');
const { initDatabase } = require('./database/init');
const { seedDatabase } = require('./database/seed');

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    // Initialize SQLite DB and tables
    const db = getDatabase();
    await initDatabase(db);
    console.log('Database initialized successfully.');

    // Seed initial demo data
    await seedDatabase(db);

    const server = app.listen(PORT, () => {
      console.log(`====================================================`);
      console.log(`FitNest Gym Server running on http://localhost:${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/`);
      console.log(`Lockers:      http://localhost:${PORT}/lockers`);
      console.log(`Members:      http://localhost:${PORT}/members`);
      console.log(`Allotments:   http://localhost:${PORT}/allotments`);
      console.log(`JOIN Details: http://localhost:${PORT}/allotments/details`);
      console.log(`====================================================`);
    });

    const shutdown = async () => {
      console.log('\nGracefully shutting down FitNest Gym Server...');
      server.close(async () => {
        const { close } = require('./database/connection');
        await close();
        console.log('Database connection closed.');
        process.exit(0);
      });
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

