/**
 * Customer Event Routes
 * Base path: /api/web/customer/events
 *
 * POST   /          → Create a new event (with optional reference image uploads)
 * GET    /          → List all events for the authenticated customer
 * GET    /:id       → Get a single event by ID
 * PUT    /:id       → Update an event (with optional image add/remove)
 * DELETE /:id       → Delete an event (and its reference images from disk)
 */

import express, { Request, Response, NextFunction } from 'express';
import { validateToken, validate } from '../middlewares/common';
import { eventImagesUpload } from '../middlewares/upload';
import { createEventSchema, updateEventSchema } from '../validation/customerEvent.validation';
import customerEventController from '../controllers/customerEvent.controller';

const router = express.Router();

// ─── Parse JSON string fields from multipart/form-data ────────────────────────
/**
 * When data is sent as multipart/form-data, JSON fields (e.g. vendorRequirements)
 * arrive as plain strings. This middleware parses them into real JS values so
 * that the Joi validation middleware sees the correct types.
 */
const parseFormJson = (req: Request, _res: Response, next: NextFunction) => {
  const fields = ['vendorRequirements', 'removeImages'] as const;
  for (const field of fields) {
    const value = (req.body as any)[field];
    if (typeof value === 'string') {
      try {
        (req.body as any)[field] = JSON.parse(value);
      } catch {
        // leave as-is; Joi will surface the validation error
      }
    }
  }
  next();
};

// ─── Multer error wrapper ─────────────────────────────────────────────────────
const handleEventUpload = (req: Request, res: Response, next: NextFunction) => {
  eventImagesUpload(req, res, (err: any) => {
    if (err) {
      return res.status(400).json({ message: err.message || 'File upload error' });
    }
    next();
  });
};

// POST /api/web/customer/events
router.post(
  '/',
  validateToken,
  handleEventUpload,
  parseFormJson,
  validate(createEventSchema),
  customerEventController.createEvent
);

// GET /api/web/customer/events?status=open&page=1&limit=10
router.get('/', validateToken, customerEventController.listMyEvents);

// GET /api/web/customer/events/:id
router.get('/:id', validateToken, customerEventController.getEventById);

// PUT /api/web/customer/events/:id
router.put(
  '/:id',
  validateToken,
  handleEventUpload,
  parseFormJson,
  validate(updateEventSchema),
  customerEventController.updateEvent
);

// DELETE /api/web/customer/events/:id
router.delete('/:id', validateToken, customerEventController.deleteEvent);

export default router;
