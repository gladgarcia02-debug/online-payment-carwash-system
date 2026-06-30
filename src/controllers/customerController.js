import { asyncHandler } from '../utils/asyncHandler.js';
import { getAvailableMachine } from '../services/machineService.js';
import { listServicesWithPricing, getServiceWithPricing } from '../services/catalogService.js';
import { createTransaction, getTransactionView, payTransaction } from '../services/transactionService.js';
import { generateQrDataUrl } from '../utils/qrcode.js';
import { ApiError } from '../utils/ApiError.js';

export const renderBay = asyncHandler(async (req, res) => {
  const machine  = await getAvailableMachine(req.params.code);
  const services = await listServicesWithPricing();
  res.render('scan-bay', { title: `${machine.name} — Choose a service`, machine, services });
});

export const renderServiceOptions = asyncHandler(async (req, res) => {
  const machine = await getAvailableMachine(req.params.code);
  const service = await getServiceWithPricing(req.params.serviceCode);
  res.render('scan-service', { title: `${service.name} — ${machine.name}`, machine, service });
});

export const createCheckout = asyncHandler(async (req, res) => {
  const { machineCode, serviceCode, durationMinutes } = req.body;
  const { transaction } = await createTransaction({
    machineCode,
    serviceCode,
    durationMinutes: Number(durationMinutes),
  });
  res.redirect(`/checkout/${transaction.id}`);
});

export const renderCheckout = asyncHandler(async (req, res) => {
  const { transaction, token } = await getTransactionView(req.params.id);
  if (transaction.status === 'paid' && token) {
    return res.redirect(`/checkout/${transaction.id}/done`);
  }
  if (transaction.status !== 'pending') {
    throw ApiError.conflict('This order is no longer available.');
  }
  res.render('checkout', { title: 'Confirm & Pay', transaction });
});

export const payCheckout = asyncHandler(async (req, res) => {
  await payTransaction(req.params.id);
  res.redirect(`/checkout/${req.params.id}/done`);
});

export const renderDone = asyncHandler(async (req, res) => {
  const { transaction, token } = await getTransactionView(req.params.id);
  if (!token) throw ApiError.conflict('No activation token has been issued for this order yet.');
  const qrCodeDataUrl = await generateQrDataUrl(token.token);
  res.render('activation', { title: 'Your activation code', transaction, token, qrCodeDataUrl });
});
