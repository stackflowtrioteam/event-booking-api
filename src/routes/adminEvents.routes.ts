import express from 'express';
import { validate, validateAdminToken } from '../middlewares/common';
import adminEventsController from '../controllers/adminEvents.controller';
import {
  adminListEventsSchema,
  adminGetEventSchema,
  adminUpdateEventStatusSchema,
  adminDeleteEventSchema,
} from '../validation/admin.validation';

const router = express.Router();

// POST /api/admin/events/list    — List all events (paginated + filters)
router.post('/list',   validateAdminToken, validate(adminListEventsSchema),         adminEventsController.listEvents);

// POST /api/admin/events/detail  — Single event with all quotations
router.post('/detail', validateAdminToken, validate(adminGetEventSchema),            adminEventsController.getEvent);

// POST /api/admin/events/status  — Update event status
router.post('/status', validateAdminToken, validate(adminUpdateEventStatusSchema),   adminEventsController.updateEventStatus);

// POST /api/admin/events/delete  — Delete event + cascade quotations/bookings
router.post('/delete', validateAdminToken, validate(adminDeleteEventSchema),         adminEventsController.deleteEvent);

export default router;
