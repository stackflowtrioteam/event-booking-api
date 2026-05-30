import Joi from 'joi';

/**
 * Validation schema for vendor sending a quotation on a lead.
 */
export const sendQuotationSchema = Joi.object({
  eventId: Joi.string().hex().length(24).required().messages({
    'string.hex': 'eventId must be a valid MongoDB ObjectId',
    'string.length': 'eventId must be a valid MongoDB ObjectId',
    'any.required': 'eventId is required',
  }),
  quotedPrice: Joi.number().min(0).required().messages({
    'number.base': 'quotedPrice must be a number',
    'number.min': 'quotedPrice must be 0 or greater',
    'any.required': 'quotedPrice is required',
  }),
  servicesOffered: Joi.string().min(3).max(500).required().messages({
    'string.min': 'servicesOffered must be at least 3 characters',
    'string.max': 'servicesOffered must not exceed 500 characters',
    'any.required': 'servicesOffered is required',
  }),
  description: Joi.string().max(2000).optional().allow(''),
  validUntil: Joi.date().iso().min('now').optional().messages({
    'date.min': 'validUntil must be a future date',
  }),
});

/**
 * Validation schema for customer updating quotation status (accept / reject).
 */
export const updateQuotationStatusSchema = Joi.object({
  status: Joi.string().valid('accepted', 'rejected').required().messages({
    'any.only': 'status must be either "accepted" or "rejected"',
    'any.required': 'status is required',
  }),
});
