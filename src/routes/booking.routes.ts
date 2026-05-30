/**
 * Booking Routes
 *
 * Customer routes → prefix: /api/web/customer/bookings
 * Vendor routes   → prefix: /api/web/vendor/bookings
 */

import express from 'express';
import { validateToken, validate } from '../middlewares/common';
import bookingController from '../controllers/booking.controller';
import { updateBookingStatusSchema } from '../validation/review.validation';

// ─── Customer Router ──────────────────────────────────────────────────────────
export const customerBookingRouter = express.Router();

// GET /api/web/customer/bookings        — List all bookings for customer
customerBookingRouter.get('/', validateToken, bookingController.listCustomerBookings);

// GET /api/web/customer/bookings/:id    — Single booking detail
customerBookingRouter.get('/:id', validateToken, bookingController.getBookingById);

// ─── Vendor Router ────────────────────────────────────────────────────────────
export const vendorBookingRouter = express.Router();

// GET /api/web/vendor/bookings          — List all bookings for vendor (+ earnings stats)
vendorBookingRouter.get('/', validateToken, bookingController.listVendorBookings);

// GET /api/web/vendor/bookings/:id      — Single booking detail
vendorBookingRouter.get('/:id', validateToken, bookingController.getBookingById);

// PATCH /api/web/vendor/bookings/:id/status — Change booking status (vendor only)
vendorBookingRouter.patch(
  '/:id/status',
  validateToken,
  validate(updateBookingStatusSchema),
  bookingController.updateBookingStatus
);
