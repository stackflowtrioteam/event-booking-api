// src/validation/event.validation.ts

import Joi from "joi";

const vendorRequirementSchema = Joi.object({
  vendorType: Joi.string().required(),
  budget: Joi.number().required(),
  description: Joi.string().allow(""),
  referenceImages: Joi.array().items(Joi.string().uri()).optional(),
});

const createEventSchema = Joi.object({
  eventName: Joi.string().required(),
  eventType: Joi.string().required(),
  date: Joi.date().required(),
  time: Joi.string().required(),
  guests: Joi.number().required(),
  city: Joi.string().required(),
  state: Joi.string().required(),
  vendorRequirements: Joi.array()
    .items(vendorRequirementSchema)
    .min(1)
    .required(),

});

export { createEventSchema };