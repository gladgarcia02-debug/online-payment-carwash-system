import crypto from 'node:crypto';
import { findActiveServiceByCode } from '../models/serviceModel.js';
import { findActivePricingOption } from '../models/pricingModel.js';
import { insertTransaction, findTransactionById, findTransactionDetailById, markTransactionPaid } from '../models/transactionModel.js';
import { insertSuccessfulPayment } from '../models/paymentModel.js';
import { insertActivationToken, findLatestTokenByTransaction } from '../models/activationTokenModel.js';
import { getAvailableMachine } from './machineService.js';
import { withTransaction } from '../config/database.js';
import { ApiError } from '../utils/ApiError.js';
import { config } from '../config/env.js';

export const createTransaction = async ({ machineCode, serviceCode, durationMinutes }) => {
  const machine = await getAvailableMachine(machineCode);

  const service = await findActiveServiceByCode(serviceCode);
  if (!service) throw ApiError.notFound('Service not found.');

  const pricing = await findActivePricingOption(service.id, durationMinutes);
  if (!pricing) throw ApiError.badRequest('That duration is not available for this service.');

  const transaction = await insertTransaction({
    machineId:       machine.id,
    serviceId:       service.id,
    durationMinutes: pricing.duration_minutes,
    amount:          pricing.price,
    currency:        pricing.currency,
  });

  return { transaction, machine, service };
};

export const getTransactionView = async (id) => {
  const transaction = await findTransactionDetailById(id);
  if (!transaction) throw ApiError.notFound('Transaction not found.');
  const token = await findLatestTokenByTransaction(id);
  return { transaction, token };
};

const SIMULATED_DELAY_MS = 600;

export const payTransaction = async (transactionId) => {
  const transaction = await findTransactionById(transactionId);
  if (!transaction) throw ApiError.notFound('Transaction not found.');
  if (transaction.status !== 'pending') {
    throw ApiError.conflict('This order has already been processed.');
  }

  await new Promise((resolve) => setTimeout(resolve, SIMULATED_DELAY_MS));

  return withTransaction(async (client) => {
    const paid = await markTransactionPaid(transactionId, client);
    if (!paid) throw ApiError.conflict('This order has already been processed.');

    const payment = await insertSuccessfulPayment({
      transactionId,
      method:            'gcash',
      amount:            transaction.amount,
      providerReference: `SIM-${crypto.randomBytes(6).toString('hex')}`,
    }, client);

    const expiresAt = new Date(Date.now() + config.tokenTtlMinutes * 60 * 1000);
    const token = await insertActivationToken({
      transactionId,
      machineId: transaction.machine_id,
      token:     crypto.randomBytes(24).toString('hex'),
      expiresAt,
    }, client);

    return { transaction: paid, payment, token };
  });
};
