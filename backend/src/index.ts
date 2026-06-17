import app from './app';
import logger from './utils/logger';

const PORT = parseInt(process.env.PORT || '4000', 10);

const server = app.listen(PORT, () => {
  logger.info(`DeFi Marketplace backend running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`Health check: http://localhost:${PORT}/api/health`);
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

export default server;
