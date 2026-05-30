/**
 * Admin Events Controller
 *
 * Routes (prefix: /api/admin/events):
 *   POST /list     → listEvents      — paginated list with filters
 *   POST /detail   → getEvent        — single event with all quotations
 *   POST /delete   → deleteEvent     — permanently delete an event
 *   POST /status   → updateEventStatus — change event status
 */

import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Event from '../models/event.model';
import Quotation from '../models/quotation.model';
import Booking from '../models/booking.model';

const adminEventsController = {

  /**
   * POST /api/admin/events/list
   * Paginated list of all customer events with optional filters.
   * Body: { page, perPage, status?, search?, startDate?, endDate? }
   */
  listEvents: async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.body.page) || 1;
      const perPage = parseInt(req.body.perPage) || 10;
      const { status, search, startDate, endDate } = req.body;

      const pageNumber = Math.max(1, page);
      const limitNumber = Math.max(1, perPage);
      const skip = (pageNumber - 1) * limitNumber;

      const filter: any = {};

      if (status && ['open', 'quotation_received', 'booked', 'cancelled'].includes(status)) {
        filter.status = status;
      }
      if (startDate || endDate) {
        filter.date = {};
        if (startDate) filter.date.$gte = new Date(startDate);
        if (endDate) filter.date.$lte = new Date(endDate);
      }

      let events;
      if (search && search.trim() !== '') {
        // Search by title or eventType
        filter.$or = [
          { title: { $regex: search.trim(), $options: 'i' } },
          { eventType: { $regex: search.trim(), $options: 'i' } },
          { city: { $regex: search.trim(), $options: 'i' } },
        ];
      }

      const [data, total] = await Promise.all([
        Event.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limitNumber)
          .populate('customerId', 'name email phoneNumber'),
        Event.countDocuments(filter),
      ]);

      // Status summary counts
      const [open, quotation_received, booked, cancelled] = await Promise.all([
        Event.countDocuments({ status: 'open' }),
        Event.countDocuments({ status: 'quotation_received' }),
        Event.countDocuments({ status: 'booked' }),
        Event.countDocuments({ status: 'cancelled' }),
      ]);

      return res.json({
        events: data,
        total,
        page: pageNumber,
        perPage: limitNumber,
        totalPages: Math.ceil(total / limitNumber),
        stats: { open, quotation_received, booked, cancelled, total: open + quotation_received + booked + cancelled },
      });
    } catch (error) {
      console.error('admin listEvents error:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  },

  /**
   * POST /api/admin/events/detail
   * Full event detail including all quotations submitted on it.
   * Body: { id }
   */
  getEvent: async (req: Request, res: Response) => {
    try {
      const { id } = req.body;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid event ID' });
      }

      const event = await Event.findById(id).populate('customerId', 'name email phoneNumber city');
      if (!event) return res.status(404).json({ message: 'Event not found' });

      const quotations = await Quotation.find({ eventId: id })
        .populate('vendorId', 'name businessName eventCategory city')
        .sort({ createdAt: -1 });

      return res.json({ event, quotations });
    } catch (error) {
      console.error('admin getEvent error:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  },

  /**
   * POST /api/admin/events/status
   * Update event status manually.
   * Body: { id, status }
   */
  updateEventStatus: async (req: Request, res: Response) => {
    try {
      const { id, status } = req.body;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid event ID' });
      }

      const event = await Event.findByIdAndUpdate(
        id,
        { $set: { status } },
        { new: true }
      ).populate('customerId', 'name email');

      if (!event) return res.status(404).json({ message: 'Event not found' });

      return res.json({ message: `Event status updated to '${status}'`, event });
    } catch (error) {
      console.error('admin updateEventStatus error:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  },

  /**
   * POST /api/admin/events/delete
   * Permanently delete an event (also deletes related quotations + bookings).
   * Body: { id }
   */
  deleteEvent: async (req: Request, res: Response) => {
    try {
      const { id } = req.body;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid event ID' });
      }

      const event = await Event.findByIdAndDelete(id);
      if (!event) return res.status(404).json({ message: 'Event not found' });

      // Cascade delete related quotations and bookings
      await Promise.all([
        Quotation.deleteMany({ eventId: id }),
        Booking.deleteMany({ eventId: id }),
      ]);

      return res.json({ message: 'Event and related records deleted successfully' });
    } catch (error) {
      console.error('admin deleteEvent error:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  },
};

export default adminEventsController;
