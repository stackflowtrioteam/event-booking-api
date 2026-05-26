import express from "express";
import webController from "../controllers/web.controller";

const router = express.Router();

router.get("/eventCategories", webController.listEventCategories);
router.get("/cities", webController.listCities);

export default router;
