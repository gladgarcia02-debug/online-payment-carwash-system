import { Router } from 'express';
import healthRoutes from './healthRoutes.js';

const router = Router();

router.use('/health', healthRoutes);

// Feature routers mount here as they are built. Note: ESP32 will eventually
// consume the same /api endpoints, so design them transport-agnostic.
//   router.use('/api/services',     serviceRoutes);
//   router.use('/api/transactions', transactionRoutes);
//   router.use('/api/machines',     machineRoutes);
//   router.use('/admin',            adminRoutes);

router.get('/', (req, res) => {
  res.render('index', { title: 'Smart Carwash' });
});

export default router;
