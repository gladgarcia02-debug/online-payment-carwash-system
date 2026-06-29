// Wrap async handlers so rejected promises reach the error middleware
// without a try/catch in every controller (DRY).
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
