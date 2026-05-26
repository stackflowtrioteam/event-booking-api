import Joi from "joi";

const addCitySchema = Joi.object({
    name: Joi.string().required(),
    user_id: Joi.string().required(),
});

const deleteCitySchema = Joi.object({
    id: Joi.string().required(),
    user_id: Joi.string().required(),
});

const listCitySchema = Joi.object({
    page: Joi.number().required(),
    perPage: Joi.number().required(),
    user_id: Joi.string().required(),
});

export { addCitySchema, deleteCitySchema, listCitySchema };
