/**
 * Joi validation schemas for Customer Event APIs
 */

import Joi from 'joi';

// ─── Vendor Requirement sub-schema ───────────────────────────────────────────
const vendorRequirementSchema = Joi.object({
  vendorCategory: Joi.string().required().messages({
    'any.required': 'Vendor category is required',
    'string.empty': 'Vendor category cannot be empty',
  }),
  budgetRange: Joi.string().required().messages({
    'any.required': 'Budget range is required',
    'string.empty': 'Budget range cannot be empty',
  }),
  description: Joi.string().allow('').optional(),
});

// ─── Create Event ─────────────────────────────────────────────────────────────
export const createEventSchema = Joi.object({
  title: Joi.string().required().messages({
    'any.required': 'Event title is required',
    'string.empty': 'Event title cannot be empty',
  }),
  eventType: Joi.string().required().messages({
    'any.required': 'Event type is required',
  }),
  date: Joi.date().iso().required().messages({
    'any.required': 'Event date is required',
    'date.format': 'Event date must be a valid ISO date (YYYY-MM-DD)',
  }),
  time: Joi.string()
    .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .required()
    .messages({
      'any.required': 'Event time is required',
      'string.pattern.base': 'Event time must be in HH:MM (24-hour) format',
    }),
  numberOfGuests: Joi.number().integer().min(1).required().messages({
    'any.required': 'Number of guests is required',
    'number.min': 'Number of guests must be at least 1',
  }),
  city: Joi.string().required().messages({
    'any.required': 'Event city is required',
  }),
  state: Joi.string().allow('').optional(),
  vendorRequirements: Joi.array()
    .items(vendorRequirementSchema)
    .min(1)
    .required()
    .messages({
      'any.required': 'At least one vendor requirement is required',
      'array.min': 'At least one vendor requirement is required',
    }),
});

// ─── Update Event ─────────────────────────────────────────────────────────────
// All fields optional on update
export const updateEventSchema = Joi.object({
  title: Joi.string().optional(),
  eventType: Joi.string().optional(),
  date: Joi.date().iso().optional(),
  time: Joi.string()
    .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .optional()
    .messages({
      'string.pattern.base': 'Event time must be in HH:MM (24-hour) format',
    }),
  numberOfGuests: Joi.number().integer().min(1).optional(),
  city: Joi.string().optional(),
  state: Joi.string().allow('').optional(),
  vendorRequirements: Joi.array().items(vendorRequirementSchema).min(1).optional(),
  status: Joi.string()
    .valid('open', 'quotation_received', 'booked', 'cancelled')
    .optional(),
  removeImages: Joi.array().items(Joi.string()).optional(), // URLs of images to remove
}).min(1); // at least one field must be provided
