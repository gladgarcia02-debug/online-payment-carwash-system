import { Router } from 'express';
import { strictLimiter } from '../middleware/rateLimiter.js';
import {
  renderBay,
  renderServiceOptions,
  createCheckout,
  renderCheckout,
  payCheckout,
  renderDone,
} from '../controllers/customerController.js';

const router = Router();

router.get('/scan/:code',              renderBay);
router.get('/scan/:code/:serviceCode', renderServiceOptions);

router.post('/checkout',              strictLimiter, createCheckout);
router.get('/checkout/:id',           renderCheckout);
router.post('/checkout/:id/pay',      strictLimiter, payCheckout);
router.get('/checkout/:id/done',      renderDone);

export default router;
