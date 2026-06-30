import { findMachineByCode } from '../models/machineModel.js';
import { ApiError } from '../utils/ApiError.js';

const UNAVAILABLE_MESSAGES = {
  running:     'This bay is currently in use. Please try again shortly.',
  finished:    'This bay is just finishing up. Please try again shortly.',
  offline:     'This bay is offline right now.',
  maintenance: 'This bay is under maintenance.',
};

export const getAvailableMachine = async (code) => {
  const machine = await findMachineByCode(code);
  if (!machine) throw ApiError.notFound('Bay not found.');
  if (machine.status !== 'idle') {
    throw ApiError.conflict(UNAVAILABLE_MESSAGES[machine.status] ?? 'This bay is not available right now.');
  }
  return machine;
};
