
import express from "express";
import authController from "../controllers/auth.controller";
import { validate } from "../middlewares/common";
import { registerSchema } from "../validation/auth.validation";

const router = express.Router();

router.post("/register", validate(registerSchema), authController.register);
router.post("/login", authController.login);

export default router;