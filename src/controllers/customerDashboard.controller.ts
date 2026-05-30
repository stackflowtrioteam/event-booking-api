/**
 * Customer Dashboard Controller
 *
 * Routes (prefix: /api/web/customer/dashboard):
 *   GET /   → getDashboard
 *
 * Returns:
 *   - customerName          (for "Welcome back, <name>!")
 *   - stats:
 *       activeEvents        (open + quotation_received events)
 *       pendingQuotations   (quotations in pending status for this customer's events)
 *       confirmedBookings   (bookings with status upcoming | confirmed)
 *       totalSpent          (sum of all booking amounts)
 *   - recentActivity        (last 10 activities across events, quotations, bookings — sorted newest first)
 */

import { Response } from 'express';
import mongoose from 'mongoose';
import User from '../models/user.model';
import Event from '../models/event.model';
import Quotation from '../models/quotation.model';
import Booking from '../models/booking.model';

const customerDashboardController = {
  /**
   * GET /api/web/customer/dashboard
   *
   * Aggregates stats and recent activity for the logged-in customer.
   */
  getDashboard: async (req: any, res: Response) => {
    try {
      const customerId = req.user?.id;
      if (!customerId) return res.status(401).json({ message: 'Unauthorized' });

      const customer = await User.findById(customerId).select('name userType');
      if (!customer || customer.userType !== 'customer') {
        return res.status(403).json({ message: 'Only customers can access this resource' });
      }

      const customerObjectId = new mongoose.Types.ObjectId(customerId);

      // ── Fetch all stats in parallel ────────────────────────────────────────
      const [
        activeEvents,
        allCustomerEventIds,
        confirmedBookings,
        totalSpentResult,
        recentEvents,
        recentBookings,
      ] = await Promise.all([
        // 1. Active events: open or quotation_received
        Event.countDocuments({
          customerId: customerObjectId,
          status: { $in: ['open', 'quotation_received'] },
        }),

        // 2. All event IDs for this customer (for quotation lookup)
        Event.find({ customerId: customerObjectId }).select('_id').lean(),

        // 3. Confirmed bookings (upcoming + confirmed statuses)
        Booking.countDocuments({
          customerId: customerObjectId,
          status: { $in: ['upcoming', 'confirmed'] },
        }),

        // 4. Total spent: sum of all booking amounts (all statuses)
        Booking.aggregate([
          { $match: { customerId: customerObjectId } },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]),

        // 5. Recent events (last 5)
        Event.find({ customerId: customerObjectId })
          .sort({ createdAt: -1 })
          .limit(5)
          .select('title eventType status createdAt')
          .lean(),

        // 6. Recent bookings (last 5)
        Booking.find({ customerId: customerObjectId })
          .sort({ createdAt: -1 })
          .limit(5)
          .populate('vendorId', 'name businessName')
          .select('vendorCategory servicesOffered status amount createdAt vendorId')
          .lean(),
      ]);

      const eventIdList = allCustomerEventIds.map((e: any) => e._id);

      // 7. Pending quotations count (across all customer events)
      const pendingQuotations = eventIdList.length > 0
        ? await Quotation.countDocuments({
            eventId: { $in: eventIdList },
            status: 'pending',
          })
        : 0;

      // 8. Recent quotations received (last 5)
      const recentQuotations = eventIdList.length > 0
        ? await Quotation.find({
            eventId: { $in: eventIdList },
          })
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('vendorId', 'name businessName')
            .populate('eventId', 'title')
            .select('quotedPrice servicesOffered status createdAt vendorId eventId')
            .lean()
        : [];

      const totalSpent = totalSpentResult[0]?.total || 0;

      // ── Build recent activity feed ─────────────────────────────────────────
      // Each item: { type, title, subtitle, status, tag, createdAt }

      const activityItems: Array<{
        type: string;
        title: string;
        subtitle: string;
        tag: string;
        tagColor: string;
        createdAt: Date;
      }> = [];

      // Events → activity
      for (const ev of recentEvents) {
        activityItems.push({
          type: 'event',
          title: `${ev.title} Event Created`,
          subtitle: ev.eventType,
          tag: ev.status === 'open' ? 'New' : ev.status === 'quotation_received' ? 'Quotation' : ev.status,
          tagColor: ev.status === 'open' ? 'purple' : ev.status === 'booked' ? 'green' : 'blue',
          createdAt: ev.createdAt as Date,
        });
      }

      // Quotations → activity
      for (const q of recentQuotations as any[]) {
        const vendorName = q.vendorId?.businessName || q.vendorId?.name || 'a vendor';
        const eventTitle = q.eventId?.title || 'your event';
        activityItems.push({
          type: 'quotation',
          title: `Quotation received from ${vendorName}`,
          subtitle: `For: ${eventTitle} · ₹${q.quotedPrice?.toLocaleString('en-IN')}`,
          tag: q.status === 'pending' ? 'Quotation' : q.status === 'accepted' ? 'Accepted' : 'Rejected',
          tagColor: q.status === 'pending' ? 'blue' : q.status === 'accepted' ? 'green' : 'red',
          createdAt: q.createdAt as Date,
        });
      }

      // Bookings → activity
      for (const b of recentBookings as any[]) {
        const vendorName = (b.vendorId as any)?.businessName || (b.vendorId as any)?.name || 'a vendor';
        activityItems.push({
          type: 'booking',
          title: `${b.status === 'completed' ? 'Payment confirmed' : 'Booking ' + b.status} for ${b.vendorCategory}`,
          subtitle: `With: ${vendorName} · ₹${b.amount?.toLocaleString('en-IN')}`,
          tag: b.status === 'completed' ? 'Completed' : b.status === 'upcoming' ? 'Upcoming' : b.status,
          tagColor: b.status === 'completed' ? 'green' : b.status === 'cancelled' ? 'red' : 'orange',
          createdAt: b.createdAt as Date,
        });
      }

      // Sort by newest first and return top 10
      activityItems.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      const recentActivity = activityItems.slice(0, 10);

      return res.json({
        customerName: customer.name,
        stats: {
          activeEvents,
          pendingQuotations,
          confirmedBookings,
          totalSpent,
        },
        recentActivity,
      });
    } catch (error) {
      console.error('customerDashboard error:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  },
};

export default customerDashboardController;
