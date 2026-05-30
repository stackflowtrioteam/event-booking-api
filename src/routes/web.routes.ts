import express from "express";
import webController from "../controllers/web.controller";
import reviewController from "../controllers/review.controller";

const router = express.Router();

router.get("/eventCategories", webController.listEventCategories);
router.get("/cities", webController.listCities);

// Public: GET /api/web/vendors/:vendorId/reviews — anyone can view a vendor's reviews
router.get("/vendors/:vendorId/reviews", reviewController.getPublicVendorReviews);

export default router;
