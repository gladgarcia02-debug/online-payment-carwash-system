import { asyncHandler } from '../utils/asyncHandler.js';
import { verifyConnection } from '../config/database.js';

// Controllers stay thin: read the request, call a service/helper, shape the response.
export const getHealth = asyncHandler(async (req, res) => {
  const dbTime = await verifyConnection();
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    db: { connected: true, time: dbTime },
  });
});
