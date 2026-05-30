/**
 * Review Routes
 *
 * Customer routes → prefix: /api/web/customer/reviews
 * Vendor routes   → prefix: /api/web/vendor/reviews
 */

import express from 'express';
import { validateToken, validate } from '../middlewares/common';
import reviewController from '../controllers/review.controller';
import { createReviewSchema, updateReviewSchema } from '../validation/review.validation';

// ─── Customer Router ──────────────────────────────────────────────────────────
export const customerReviewRouter = express.Router();

// POST /api/web/customer/reviews          — Submit a review for a completed booking
customerReviewRouter.post(
  '/',
  validateToken,
  validate(createReviewSchema),
  reviewController.createReview
);

// GET /api/web/customer/reviews           — List all reviews given by the customer
customerReviewRouter.get('/', validateToken, reviewController.listCustomerReviews);

// PUT /api/web/customer/reviews/:id       — Edit own review
customerReviewRouter.put(
  '/:id',
  validateToken,
  validate(updateReviewSchema),
  reviewController.updateReview
);

// DELETE /api/web/customer/reviews/:id    — Delete own review
customerReviewRouter.delete('/:id', validateToken, reviewController.deleteReview);

// ─── Vendor Router ────────────────────────────────────────────────────────────
export const vendorReviewRouter = express.Router();

// GET /api/web/vendor/reviews             — List reviews received (+ overall rating & distribution)
vendorReviewRouter.get('/', validateToken, reviewController.listVendorReviews);
