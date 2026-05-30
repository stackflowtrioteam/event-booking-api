/**
 * Booking Controller
 *
 * Bookings are auto-created when a customer accepts a quotation.
 *
 * Customer Routes (prefix: /api/web/customer/bookings):
 *   GET    /     → listCustomerBookings   — all bookings for authenticated customer
 *   GET    /:id  → getBookingById         — single booking detail
 *
 * Vendor Routes (prefix: /api/web/vendor/bookings):
 *   GET    /          → listVendorBookings      — all bookings for authenticated vendor + earnings
 *   GET    /:id       → getBookingById          — single booking detail
 *   PATCH  /:id/status → updateBookingStatus   — change booking status (vendor only)
 */

import { Response } from 'express';
import Booking from '../models/booking.model';
import User from '../models/user.model';

const bookingController = {
  // ─────────────────────────────────────────────────────────────────────────────
  // CUSTOMER ENDPOINTS
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * GET /api/web/customer/bookings
   *
   * Returns all bookings for the authenticated customer.
   * Populates vendor info and event details.
   * Optional query: status, page, limit
   */
  listCustomerBookings: async (req: any, res: Response) => {
    try {
      const customerId = req.user?.id;
      if (!customerId) return res.status(401).json({ message: 'Unauthorized' });

      const customer = await User.findById(customerId).select('userType');
      if (!customer || customer.userType !== 'customer') {
        return res.status(403).json({ message: 'Only customers can access this resource' });
      }

      const { status, page = 1, limit = 20 } = req.query;
      const pageNum = Math.max(1, parseInt(page as string, 10));
      const limitNum = Math.min(50, Math.max(1, parseInt(limit as string, 10)));
      const skip = (pageNum - 1) * limitNum;

      const filter: any = { customerId };
      if (status) filter.status = status;

      const [bookings, total] = await Promise.all([
        Booking.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limitNum)
          .populate('eventId', 'title eventType date time city state numberOfGuests')
          .populate('vendorId', 'name businessName eventCategory city portfolio')
          .populate('quotationId', 'quotedPrice servicesOffered description'),
        Booking.countDocuments(filter),
      ]);

      return res.json({
        bookings,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum),
        },
      });
    } catch (error) {
      console.error('listCustomerBookings error:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // VENDOR ENDPOINTS
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * GET /api/web/vendor/bookings
   *
   * Returns all bookings for the authenticated vendor.
   * Also returns total earnings (sum of all booking amounts).
   * Optional query: status, page, limit
   */
  listVendorBookings: async (req: any, res: Response) => {
    try {
      const vendorId = req.user?.id;
      if (!vendorId) return res.status(401).json({ message: 'Unauthorized' });

      const vendor = await User.findById(vendorId).select('userType');
      if (!vendor || vendor.userType !== 'vendor') {
        return res.status(403).json({ message: 'Only vendors can access this resource' });
      }

      const { status, page = 1, limit = 20 } = req.query;
      const pageNum = Math.max(1, parseInt(page as string, 10));
      const limitNum = Math.min(50, Math.max(1, parseInt(limit as string, 10)));
      const skip = (pageNum - 1) * limitNum;

      const filter: any = { vendorId };
      if (status) filter.status = status;

      const [bookings, total] = await Promise.all([
        Booking.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limitNum)
          .populate('eventId', 'title eventType date time city state numberOfGuests')
          .populate('customerId', 'name phoneNumber')
          .populate('quotationId', 'quotedPrice servicesOffered description'),
        Booking.countDocuments(filter),
      ]);

      // Total earnings across ALL bookings for this vendor (not just current page/filter)
      const earningsResult = await Booking.aggregate([
        { $match: { vendorId: vendor._id } },
        { $group: { _id: null, totalEarnings: { $sum: '$amount' } } },
      ]);
      const totalEarnings = earningsResult[0]?.totalEarnings || 0;

      return res.json({
        bookings,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum),
        },
        stats: {
          totalBookings: await Booking.countDocuments({ vendorId }),
          totalEarnings,
          upcoming: await Booking.countDocuments({ vendorId, status: 'upcoming' }),
          completed: await Booking.countDocuments({ vendorId, status: 'completed' }),
        },
      });
    } catch (error) {
      console.error('listVendorBookings error:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  },

  /**
   * GET /api/web/customer/bookings/:id  OR  /api/web/vendor/bookings/:id
   *
   * Returns a single booking detail.
   * Accessible by either the customer or the vendor involved in the booking.
   */
  getBookingById: async (req: any, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ message: 'Unauthorized' });

      const booking = await Booking.findById(req.params.id)
        .populate('eventId', 'title eventType date time city state numberOfGuests referenceImages vendorRequirements')
        .populate('vendorId', 'name businessName eventCategory city portfolio')
        .populate('customerId', 'name phoneNumber')
        .populate('quotationId', 'quotedPrice servicesOffered description validUntil');

      if (!booking) {
        return res.status(404).json({ message: 'Booking not found' });
      }

      // Must be participant (customer or vendor)
      const isCustomer = booking.customerId._id.toString() === userId;
      const isVendor = booking.vendorId._id.toString() === userId;
      if (!isCustomer && !isVendor) {
        return res.status(403).json({ message: 'Access denied' });
      }

      return res.json({ booking });
    } catch (error) {
      console.error('getBookingById error:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  },
  // ─────────────────────────────────────────────────────────────────────────────
  // VENDOR — UPDATE BOOKING STATUS
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * PATCH /api/web/vendor/bookings/:id/status
   *
   * Vendor changes the status of one of their bookings.
   * Allowed transitions:
   *   upcoming  → confirmed | cancelled
   *   confirmed → completed | cancelled
   *   completed → (no further transitions)
   *   cancelled → (no further transitions)
   *
   * Body: { status: 'confirmed' | 'completed' | 'cancelled' }
   */
  updateBookingStatus: async (req: any, res: Response) => {
    try {
      const vendorId = req.user?.id;
      if (!vendorId) return res.status(401).json({ message: 'Unauthorized' });

      const vendor = await User.findById(vendorId).select('userType');
      if (!vendor || vendor.userType !== 'vendor') {
        return res.status(403).json({ message: 'Only vendors can update booking status' });
      }

      const booking = await Booking.findById(req.params.id);
      if (!booking) {
        return res.status(404).json({ message: 'Booking not found' });
      }
      if (booking.vendorId.toString() !== vendorId) {
        return res.status(403).json({ message: 'This booking does not belong to you' });
      }

      const { status: newStatus } = req.body;
      const currentStatus = booking.status;

      // Define allowed transitions
      const allowedTransitions: Record<string, string[]> = {
        upcoming: ['confirmed', 'cancelled'],
        confirmed: ['completed', 'cancelled'],
        completed: [],
        cancelled: [],
      };

      if (!allowedTransitions[currentStatus]?.includes(newStatus)) {
        return res.status(400).json({
          message: `Cannot transition booking from '${currentStatus}' to '${newStatus}'`,
          allowedTransitions: allowedTransitions[currentStatus],
        });
      }

      booking.status = newStatus;
      await booking.save();

      const updated = await Booking.findById(booking._id)
        .populate('eventId', 'title eventType date time city state numberOfGuests')
        .populate('customerId', 'name phoneNumber')
        .populate('quotationId', 'quotedPrice servicesOffered description');

      return res.json({ message: `Booking status updated to '${newStatus}'`, booking: updated });
    } catch (error) {
      console.error('updateBookingStatus error:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  },
};

export default bookingController;
