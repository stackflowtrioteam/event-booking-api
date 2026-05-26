import Joi from "joi";

const addEventCategorySchema = Joi.object({
    name: Joi.string().required(),
    user_id: Joi.string().required(),
});

const deleteEventCategorySchema = Joi.object({
    id: Joi.string().required(),
    user_id: Joi.string().required(),
});

const listEventCategorySchema = Joi.object({
    page: Joi.number().required(),
    perPage: Joi.number().required(),
    user_id: Joi.string().required(),
});

export { addEventCategorySchema, deleteEventCategorySchema, listEventCategorySchema };