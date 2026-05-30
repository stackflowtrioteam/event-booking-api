/**
 * Customer Event Controller
 *
 * Handles CRUD operations for customer-created event requirements.
 *
 * Routes (prefix: /api/web/customer/events):
 *   POST   /           → createEvent   (create new event with optional reference images)
 *   GET    /           → listMyEvents  (list all events for the authenticated customer)
 *   GET    /:id        → getEventById  (get single event detail)
 *   PUT    /:id        → updateEvent   (edit event + optionally add/remove reference images)
 *   DELETE /:id        → deleteEvent   (delete event + remove images from disk)
 */

import { Response } from 'express';
import path from 'path';
import fs from 'fs';
import Event from '../models/event.model';

const BASE_URL = (
  process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`
).replace(/\/$/, '');

/**
 * Deletes a physical image file from disk given its full URL.
 * Silently ignores if the file does not exist.
 */
function deletePhysicalFile(imageUrl: string): void {
  try {
    const relativePath = imageUrl.replace(BASE_URL, '');
    const absolutePath = path.join(process.cwd(), relativePath);
    if (fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath);
    }
  } catch (err) {
    console.warn(`Failed to delete file: ${imageUrl}`, err);
  }
}

const customerEventController = {
  // ─── CREATE EVENT ────────────────────────────────────────────────────────────
  /**
   * POST /api/web/customer/events
   * Body (multipart/form-data):
   *   title, eventType, date, time, numberOfGuests, city, state
   *   vendorRequirements (JSON string array)
   *   referenceImages[]  (optional file uploads)
   */
  createEvent: async (req: any, res: Response) => {
    try {
      const customerId = req.user?.id;
      if (!customerId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      // vendorRequirements arrives as a JSON string when sent via multipart/form-data
      let vendorRequirements = req.body.vendorRequirements;
      if (typeof vendorRequirements === 'string') {
        try {
          vendorRequirements = JSON.parse(vendorRequirements);
        } catch {
          return res
            .status(400)
            .json({ message: 'vendorRequirements must be a valid JSON array' });
        }
      }

      // Build reference image URLs from uploaded files
      const referenceImages: string[] = [];
      if (req.files && (req.files as Express.Multer.File[]).length > 0) {
        (req.files as Express.Multer.File[]).forEach((file) => {
          referenceImages.push(`${BASE_URL}/uploads/events/${file.filename}`);
        });
      }

      const event = await Event.create({
        customerId,
        title: req.body.title,
        eventType: req.body.eventType,
        date: req.body.date,
        time: req.body.time,
        numberOfGuests: Number(req.body.numberOfGuests),
        city: req.body.city,
        state: req.body.state,
        vendorRequirements,
        referenceImages,
        status: 'open',
      });

      return res.status(201).json({
        message: 'Event created successfully',
        event,
      });
    } catch (error) {
      console.error('createEvent error:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  },

  // ─── LIST MY EVENTS ───────────────────────────────────────────────────────────
  /**
   * GET /api/web/customer/events
   * Returns all events belonging to the authenticated customer.
   * Supports optional query params: status, page, limit
   */
  listMyEvents: async (req: any, res: Response) => {
    try {
      const customerId = req.user?.id;
      if (!customerId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const { status, page = 1, limit = 10 } = req.query;
      const pageNum = Math.max(1, parseInt(page as string, 10));
      const limitNum = Math.min(50, Math.max(1, parseInt(limit as string, 10)));
      const skip = (pageNum - 1) * limitNum;

      const filter: any = { customerId };
      if (status) filter.status = status;

      const [events, total] = await Promise.all([
        Event.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limitNum),
        Event.countDocuments(filter),
      ]);

      return res.json({
        events,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum),
        },
      });
    } catch (error) {
      console.error('listMyEvents error:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  },

  // ─── GET SINGLE EVENT ─────────────────────────────────────────────────────────
  /**
   * GET /api/web/customer/events/:id
   * Returns a single event — only if it belongs to the authenticated customer.
   */
  getEventById: async (req: any, res: Response) => {
    try {
      const customerId = req.user?.id;
      if (!customerId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const event = await Event.findOne({ _id: req.params.id, customerId });
      if (!event) {
        return res.status(404).json({ message: 'Event not found' });
      }

      return res.json({ event });
    } catch (error) {
      console.error('getEventById error:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  },

  // ─── UPDATE EVENT ─────────────────────────────────────────────────────────────
  /**
   * PUT /api/web/customer/events/:id
   * Body (multipart/form-data):
   *   Any subset of: title, eventType, date, time, numberOfGuests, city, state,
   *                  vendorRequirements (JSON string), status
   *   referenceImages[]  (optional — new files to append)
   *   removeImages[]     (optional JSON array of image URLs to delete)
   */
  updateEvent: async (req: any, res: Response) => {
    try {
      const customerId = req.user?.id;
      if (!customerId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const event = await Event.findOne({ _id: req.params.id, customerId });
      if (!event) {
        return res.status(404).json({ message: 'Event not found' });
      }

      // Parse vendorRequirements if sent as JSON string
      let vendorRequirements = req.body.vendorRequirements;
      if (typeof vendorRequirements === 'string') {
        try {
          vendorRequirements = JSON.parse(vendorRequirements);
        } catch {
          return res
            .status(400)
            .json({ message: 'vendorRequirements must be a valid JSON array' });
        }
      }

      // Handle image removals
      let removeImages: string[] = req.body.removeImages || [];
      if (typeof removeImages === 'string') {
        try {
          removeImages = JSON.parse(removeImages);
        } catch {
          removeImages = [];
        }
      }

      let currentImages: string[] = [...event.referenceImages];

      // Delete images that should be removed, both from disk and from array
      if (removeImages.length > 0) {
        for (const imgUrl of removeImages) {
          deletePhysicalFile(imgUrl);
        }
        currentImages = currentImages.filter((img) => !removeImages.includes(img));
      }

      // Append any newly uploaded images
      if (req.files && (req.files as Express.Multer.File[]).length > 0) {
        (req.files as Express.Multer.File[]).forEach((file) => {
          currentImages.push(`${BASE_URL}/uploads/events/${file.filename}`);
        });
      }

      // Build the update object
      const updateData: any = { referenceImages: currentImages };
      if (req.body.title !== undefined) updateData.title = req.body.title;
      if (req.body.eventType !== undefined) updateData.eventType = req.body.eventType;
      if (req.body.date !== undefined) updateData.date = req.body.date;
      if (req.body.time !== undefined) updateData.time = req.body.time;
      if (req.body.numberOfGuests !== undefined)
        updateData.numberOfGuests = Number(req.body.numberOfGuests);
      if (req.body.city !== undefined) updateData.city = req.body.city;
      if (req.body.state !== undefined) updateData.state = req.body.state;
      if (vendorRequirements !== undefined) updateData.vendorRequirements = vendorRequirements;
      if (req.body.status !== undefined) updateData.status = req.body.status;

      const updatedEvent = await Event.findByIdAndUpdate(
        req.params.id,
        { $set: updateData },
        { new: true, runValidators: true }
      );

      return res.json({
        message: 'Event updated successfully',
        event: updatedEvent,
      });
    } catch (error) {
      console.error('updateEvent error:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  },

  // ─── DELETE EVENT ─────────────────────────────────────────────────────────────
  /**
   * DELETE /api/web/customer/events/:id
   * Deletes the event and removes all associated reference images from disk.
   * Only the owner (customer) can delete their event.
   */
  deleteEvent: async (req: any, res: Response) => {
    try {
      const customerId = req.user?.id;
      if (!customerId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const event = await Event.findOne({ _id: req.params.id, customerId });
      if (!event) {
        return res.status(404).json({ message: 'Event not found' });
      }

      // Delete all reference images from disk
      for (const imgUrl of event.referenceImages) {
        deletePhysicalFile(imgUrl);
      }

      await Event.findByIdAndDelete(req.params.id);

      return res.json({ message: 'Event deleted successfully' });
    } catch (error) {
      console.error('deleteEvent error:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  },
};

export default customerEventController;
