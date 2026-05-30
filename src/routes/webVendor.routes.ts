import express, { Request, Response, NextFunction } from "express";
import { validate, validateToken } from "../middlewares/common";
import { addPortfolioSchema } from "../validation/vendor.validation";
import { portfolioUpload } from "../middlewares/upload";
import webVendorController from "../controllers/webVendor.controller";
import vendorLeadsController from "../controllers/vendorLeads.controller";
import vendorDashboardController from "../controllers/vendorDashboard.controller";

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

// GET /api/web/vendor/dashboard — Aggregated vendor dashboard stats
router.get("/dashboard", validateToken, vendorDashboardController.getDashboard);

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

// ─── Leads Routes ─────────────────────────────────────────────────────────────
// POST /api/web/vendor/leads          — Paginated list of matched open events
router.post("/leads", validateToken, vendorLeadsController.listLeads);

// GET /api/web/vendor/leads/:id      — Full detail of a single matched event
router.get("/leads/:id", validateToken, vendorLeadsController.getLeadById);

export default router;

