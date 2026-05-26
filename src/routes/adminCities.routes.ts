import express from "express";
import { validate, validateAdminToken } from "../middlewares/common";
import { addCitySchema, deleteCitySchema, listCitySchema } from "../validation/cities";
import citiesController from "../controllers/adminCities.controller";

const router = express.Router();

router.post("/addCity", validateAdminToken, validate(addCitySchema), citiesController.addCity);
router.post("/list", validateAdminToken, validate(listCitySchema), citiesController.listCities);
router.post("/delete", validateAdminToken, validate(deleteCitySchema), citiesController.deleteCity);

export default router;
