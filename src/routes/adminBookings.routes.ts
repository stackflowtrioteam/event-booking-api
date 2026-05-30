import express from 'express';
import { validate, validateAdminToken } from '../middlewares/common';
import adminBookingsController from '../controllers/adminBookings.controller';
import {
  adminListBookingsSchema,
  adminGetBookingSchema,
  adminUpdateBookingStatusSchema,
  adminDeleteBookingSchema,
} from '../validation/admin.validation';

const router = express.Router();

// POST /api/admin/bookings/list    — List all bookings (paginated + filters + stats)
router.post('/list',   validateAdminToken, validate(adminListBookingsSchema),         adminBookingsController.listBookings);

// POST /api/admin/bookings/detail  — Single booking full detail
router.post('/detail', validateAdminToken, validate(adminGetBookingSchema),            adminBookingsController.getBooking);

// POST /api/admin/bookings/status  — Override booking status
router.post('/status', validateAdminToken, validate(adminUpdateBookingStatusSchema),   adminBookingsController.updateStatus);

// POST /api/admin/bookings/delete  — Delete a booking
router.post('/delete', validateAdminToken, validate(adminDeleteBookingSchema),         adminBookingsController.deleteBooking);

export default router;
