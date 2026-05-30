import Joi from 'joi';

const objectId = Joi.string().length(24).hex();

// ─── Admin Events ─────────────────────────────────────────────────────────────

export const adminListEventsSchema = Joi.object({
  page: Joi.number().min(1).required(),
  perPage: Joi.number().min(1).required(),
  status: Joi.string().valid('open', 'quotation_received', 'booked', 'cancelled').optional(),
  search: Joi.string().optional().allow(''),
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().optional(),
  user_id: Joi.string().required(),
});

export const adminGetEventSchema = Joi.object({
  id: objectId.required(),
  user_id: Joi.string().required(),
});

export const adminUpdateEventStatusSchema = Joi.object({
  id: objectId.required(),
  status: Joi.string().valid('open', 'quotation_received', 'booked', 'cancelled').required(),
  user_id: Joi.string().required(),
});

export const adminDeleteEventSchema = Joi.object({
  id: objectId.required(),
  user_id: Joi.string().required(),
});

// ─── Admin Quotations ─────────────────────────────────────────────────────────

export const adminListQuotationsSchema = Joi.object({
  page: Joi.number().min(1).required(),
  perPage: Joi.number().min(1).required(),
  status: Joi.string().valid('pending', 'accepted', 'rejected').optional(),
  vendorId: objectId.optional(),
  eventId: objectId.optional(),
  search: Joi.string().optional().allow(''),
  user_id: Joi.string().required(),
});

export const adminGetQuotationSchema = Joi.object({
  id: objectId.required(),
  user_id: Joi.string().required(),
});

export const adminDeleteQuotationSchema = Joi.object({
  id: objectId.required(),
  user_id: Joi.string().required(),
});

// ─── Admin Bookings ───────────────────────────────────────────────────────────

export const adminListBookingsSchema = Joi.object({
  page: Joi.number().min(1).required(),
  perPage: Joi.number().min(1).required(),
  status: Joi.string().valid('upcoming', 'confirmed', 'completed', 'cancelled').optional(),
  vendorId: objectId.optional(),
  customerId: objectId.optional(),
  search: Joi.string().optional().allow(''),
  user_id: Joi.string().required(),
});

export const adminGetBookingSchema = Joi.object({
  id: objectId.required(),
  user_id: Joi.string().required(),
});

export const adminUpdateBookingStatusSchema = Joi.object({
  id: objectId.required(),
  status: Joi.string().valid('upcoming', 'confirmed', 'completed', 'cancelled').required(),
  user_id: Joi.string().required(),
});

export const adminDeleteBookingSchema = Joi.object({
  id: objectId.required(),
  user_id: Joi.string().required(),
});

// ─── Admin Reviews ────────────────────────────────────────────────────────────

export const adminListReviewsSchema = Joi.object({
  page: Joi.number().min(1).required(),
  perPage: Joi.number().min(1).required(),
  vendorId: objectId.optional(),
  customerId: objectId.optional(),
  rating: Joi.number().integer().min(1).max(5).optional(),
  search: Joi.string().optional().allow(''),
  user_id: Joi.string().required(),
});

export const adminGetReviewSchema = Joi.object({
  id: objectId.required(),
  user_id: Joi.string().required(),
});

export const adminDeleteReviewSchema = Joi.object({
  id: objectId.required(),
  user_id: Joi.string().required(),
});
