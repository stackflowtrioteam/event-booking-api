import express, { Request, Response, NextFunction } from "express";
import { validate, validateToken } from "../middlewares/common";
import { addPortfolioSchema } from "../validation/vendor.validation";
import { portfolioUpload } from "../middlewares/upload";
import webVendorController from "../controllers/webVendor.controller";

const router = express.Router();

// Multer error handler wrapper — catches multer errors and returns a clean JSON response
const handleUpload = (req: Request, res: Response, next: NextFunction) => {
    portfolioUpload(req, res, (err: any) => {
        if (err) {
            return res.status(400).json({ message: err.message || "File upload error" });
        }
        next();
    });
};

// POST /api/web/vendor/portfolio  — Add / update portfolio (with optional image uploads)
router.post(
    "/portfolio",
    validateToken,
    handleUpload,
    validate(addPortfolioSchema),
    webVendorController.addOrUpdatePortfolio
);

// GET /api/web/vendor/portfolio  — View own portfolio
router.get("/portfolio", validateToken, webVendorController.getMyPortfolio);

// DELETE /api/web/vendor/portfolio/image  — Remove a specific portfolio image
router.delete("/portfolio/image", validateToken, webVendorController.removePortfolioImage);

export default router;

