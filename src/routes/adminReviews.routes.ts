import express from 'express';
import { validate, validateAdminToken } from '../middlewares/common';
import adminReviewsController from '../controllers/adminReviews.controller';
import {
  adminListReviewsSchema,
  adminGetReviewSchema,
  adminDeleteReviewSchema,
} from '../validation/admin.validation';

const router = express.Router();

// POST /api/admin/reviews/list    — List all reviews (paginated + filters + platform stats)
router.post('/list',   validateAdminToken, validate(adminListReviewsSchema),  adminReviewsController.listReviews);

// POST /api/admin/reviews/detail  — Single review full detail
router.post('/detail', validateAdminToken, validate(adminGetReviewSchema),    adminReviewsController.getReview);

// POST /api/admin/reviews/delete  — Delete a review
router.post('/delete', validateAdminToken, validate(adminDeleteReviewSchema), adminReviewsController.deleteReview);

export default router;
