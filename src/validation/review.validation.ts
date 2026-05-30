import Joi from 'joi';

/**
 * Validation schema for customer creating a review.
 */
export const createReviewSchema = Joi.object({
  bookingId: Joi.string().hex().length(24).required().messages({
    'string.hex': 'bookingId must be a valid MongoDB ObjectId',
    'string.length': 'bookingId must be a valid MongoDB ObjectId',
    'any.required': 'bookingId is required',
  }),
  rating: Joi.number().integer().min(1).max(5).required().messages({
    'number.base': 'rating must be a number',
    'number.integer': 'rating must be a whole number',
    'number.min': 'rating must be at least 1',
    'number.max': 'rating must be at most 5',
    'any.required': 'rating is required',
  }),
  reviewText: Joi.string().max(2000).optional().allow('').messages({
    'string.max': 'reviewText must not exceed 2000 characters',
  }),
});

/**
 * Validation schema for customer editing their review.
 */
export const updateReviewSchema = Joi.object({
  rating: Joi.number().integer().min(1).max(5).optional().messages({
    'number.base': 'rating must be a number',
    'number.integer': 'rating must be a whole number',
    'number.min': 'rating must be at least 1',
    'number.max': 'rating must be at most 5',
  }),
  reviewText: Joi.string().max(2000).optional().allow('').messages({
    'string.max': 'reviewText must not exceed 2000 characters',
  }),
}).min(1).messages({
  'object.min': 'At least one field (rating or reviewText) must be provided',
});

/**
 * Validation schema for vendor updating booking status.
 */
export const updateBookingStatusSchema = Joi.object({
  status: Joi.string()
    .valid('confirmed', 'completed', 'cancelled')
    .required()
    .messages({
      'any.only': 'status must be one of: confirmed, completed, cancelled',
      'any.required': 'status is required',
    }),
});
