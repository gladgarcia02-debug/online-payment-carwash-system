import app from './app.js';
import { config } from './config/env.js';
import { verifyConnection, pool } from './config/database.js';
import { logger } from './utils/logger.js';

const start = async () => {
  try {
    const dbTime = await verifyConnection();
    logger.info(`Database connected (server time: ${dbTime})`);
  } catch (err) {
    logger.error('Failed to connect to the database on boot:', err.message);
    process.exit(1);
  }

  const server = app.listen(config.port, () => {
    logger.info(`Server running at ${config.baseUrl} [${config.env}]`);
  });

  // Graceful shutdown so in-flight requests + the DB pool close cleanly.
  const shutdown = (signal) => {
    logger.warn(`${signal} received — shutting down gracefully...`);
    server.close(async () => {
      await pool.end();
      logger.info('Closed HTTP server and DB pool. Bye!');
      process.exit(0);
    });
  };
  ['SIGINT', 'SIGTERM'].forEach((sig) => process.on(sig, () => shutdown(sig)));
};

start();
