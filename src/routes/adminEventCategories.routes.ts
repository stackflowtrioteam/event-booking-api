
import express from "express";
import { validate, validateAdminToken } from "../middlewares/common";
import { addEventCategorySchema, deleteEventCategorySchema, listEventCategorySchema } from "../validation/eventCategories";
import eventCategoriesController from "../controllers/adminEventCategories.controller";

const router = express.Router();

router.post("/addEventCategory", validateAdminToken, validate(addEventCategorySchema), eventCategoriesController.addEventCategory);
router.post("/list", validateAdminToken, validate(listEventCategorySchema), eventCategoriesController.listEventCategories);
router.post("/delete", validateAdminToken, validate(deleteEventCategorySchema), eventCategoriesController.deleteEventCategory);

export default router;