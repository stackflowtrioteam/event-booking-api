/**
 * Admin Bookings Controller
 *
 * Routes (prefix: /api/admin/bookings):
 *   POST /list     → listBookings    — paginated list with filters + earnings stats
 *   POST /detail   → getBooking      — single booking with full details
 *   POST /status   → updateStatus    — manually override booking status
 *   POST /delete   → deleteBooking   — permanently delete a booking
 */

import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Booking from '../models/booking.model';

const adminBookingsController = {

  /**
   * POST /api/admin/bookings/list
   * Paginated list of all bookings with optional filters.
   * Body: { page, perPage, status?, vendorId?, customerId?, search? }
   */
  listBookings: async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.body.page) || 1;
      const perPage = parseInt(req.body.perPage) || 10;
      const { status, vendorId, customerId, search } = req.body;

      const pageNumber = Math.max(1, page);
      const limitNumber = Math.max(1, perPage);
      const skip = (pageNumber - 1) * limitNumber;

      const filter: any = {};
      if (status && ['upcoming', 'confirmed', 'completed', 'cancelled'].includes(status)) filter.status = status;
      if (vendorId && mongoose.Types.ObjectId.isValid(vendorId)) filter.vendorId = vendorId;
      if (customerId && mongoose.Types.ObjectId.isValid(customerId)) filter.customerId = customerId;
      if (search && search.trim() !== '') {
        filter.$or = [
          { vendorCategory: { $regex: search.trim(), $options: 'i' } },
          { servicesOffered: { $regex: search.trim(), $options: 'i' } },
        ];
      }

      const [bookings, total] = await Promise.all([
        Booking.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limitNumber)
          .populate('eventId', 'title eventType date city')
          .populate('customerId', 'name email phoneNumber')
          .populate('vendorId', 'name businessName eventCategory city')
          .populate('quotationId', 'quotedPrice servicesOffered'),
        Booking.countDocuments(filter),
      ]);

      // Status summary counts + total earnings
      const [upcoming, confirmed, completed, cancelled, earningsResult] = await Promise.all([
        Booking.countDocuments({ status: 'upcoming' }),
        Booking.countDocuments({ status: 'confirmed' }),
        Booking.countDocuments({ status: 'completed' }),
        Booking.countDocuments({ status: 'cancelled' }),
        Booking.aggregate([{ $group: { _id: null, total: { $sum: '$amount' } } }]),
      ]);

      return res.json({
        bookings,
        total,
        page: pageNumber,
        perPage: limitNumber,
        totalPages: Math.ceil(total / limitNumber),
        stats: {
          upcoming,
          confirmed,
          completed,
          cancelled,
          totalBookings: upcoming + confirmed + completed + cancelled,
          totalEarnings: earningsResult[0]?.total || 0,
        },
      });
    } catch (error) {
      console.error('admin listBookings error:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  },

  /**
   * POST /api/admin/bookings/detail
   * Full booking detail with all related data.
   * Body: { id }
   */
  getBooking: async (req: Request, res: Response) => {
    try {
      const { id } = req.body;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid booking ID' });
      }

      const booking = await Booking.findById(id)
        .populate('eventId', 'title eventType date time city state numberOfGuests referenceImages vendorRequirements')
        .populate('customerId', 'name email phoneNumber city')
        .populate('vendorId', 'name businessName eventCategory city portfolio')
        .populate('quotationId', 'quotedPrice servicesOffered description validUntil');

      if (!booking) return res.status(404).json({ message: 'Booking not found' });

      return res.json({ booking });
    } catch (error) {
      console.error('admin getBooking error:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  },

  /**
   * POST /api/admin/bookings/status
   * Manually override a booking's status.
   * Body: { id, status }
   */
  updateStatus: async (req: Request, res: Response) => {
    try {
      const { id, status } = req.body;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid booking ID' });
      }

      const booking = await Booking.findByIdAndUpdate(
        id,
        { $set: { status } },
        { new: true }
      )
        .populate('customerId', 'name email')
        .populate('vendorId', 'name businessName');

      if (!booking) return res.status(404).json({ message: 'Booking not found' });

      return res.json({ message: `Booking status updated to '${status}'`, booking });
    } catch (error) {
      console.error('admin updateStatus error:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  },

  /**
   * POST /api/admin/bookings/delete
   * Permanently delete a booking.
   * Body: { id }
   */
  deleteBooking: async (req: Request, res: Response) => {
    try {
      const { id } = req.body;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid booking ID' });
      }

      const booking = await Booking.findByIdAndDelete(id);
      if (!booking) return res.status(404).json({ message: 'Booking not found' });

      return res.json({ message: 'Booking deleted successfully' });
    } catch (error) {
      console.error('admin deleteBooking error:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  },
};

export default adminBookingsController;
