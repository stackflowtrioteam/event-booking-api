import Joi from "joi";

const registerSchema = Joi.object({
  name: Joi.string().required(),

  email: Joi.string().email().required(),

  password: Joi.string().min(6).required(),

  phoneNumber: Joi.string().required(),

  userType: Joi.string().valid("customer", "vendor").required(),

  businessName: Joi.when("userType", {
    is: "vendor",
    then: Joi.string().required(),
    otherwise: Joi.forbidden(),
  }),

  eventCategory: Joi.when("userType", {
    is: "vendor",
    then: Joi.string().required(),
    otherwise: Joi.forbidden(),
  }),

  state: Joi.when("userType", {
    is: "vendor",
    then: Joi.string().required(),
    otherwise: Joi.forbidden(),
  }),

  city: Joi.when("userType", {
    is: "vendor",
    then: Joi.string().required(),
    otherwise: Joi.forbidden(),
  }),
});

export { registerSchema };