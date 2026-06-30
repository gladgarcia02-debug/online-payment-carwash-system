import { findActiveServices, findActiveServiceByCode } from '../models/serviceModel.js';
import { findActivePricingByService } from '../models/pricingModel.js';
import { ApiError } from '../utils/ApiError.js';

export const listServicesWithPricing = async () => {
  const services = await findActiveServices();
  return Promise.all(
    services.map(async (service) => ({
      ...service,
      pricingOptions: await findActivePricingByService(service.id),
    }))
  );
};

export const getServiceWithPricing = async (serviceCode) => {
  const service = await findActiveServiceByCode(serviceCode);
  if (!service) throw ApiError.notFound('Service not found.');
  const pricingOptions = await findActivePricingByService(service.id);
  return { ...service, pricingOptions };
};
