import express from "express";
import { validate, validateAdminToken } from "../middlewares/common";
import {
    adminListVendorsSchema,
    adminKycActionSchema,
    adminToggleVendorSchema,
    adminDeleteVendorSchema,
    adminViewPortfolioSchema,
} from "../validation/vendor.validation";
import adminVendorsController from "../controllers/adminVendors.controller";

const router = express.Router();

// All routes require admin token header
router.post("/list",      validateAdminToken, validate(adminListVendorsSchema),    adminVendorsController.listVendors);
router.post("/kyc",       validateAdminToken, validate(adminKycActionSchema),       adminVendorsController.updateKycStatus);
router.post("/toggle",    validateAdminToken, validate(adminToggleVendorSchema),    adminVendorsController.toggleVendorStatus);
router.post("/delete",    validateAdminToken, validate(adminDeleteVendorSchema),    adminVendorsController.deleteVendor);
router.post("/portfolio", validateAdminToken, validate(adminViewPortfolioSchema),   adminVendorsController.viewVendorPortfolio);

export default router;
