/**
 * Vendor Dashboard Controller
 *
 * GET /api/web/vendor/dashboard
 *
 * Returns a single aggregated response for the vendor dashboard UI:
 *
 * ┌─────────────────────────────────────────────────────────┐
 * │  stats                                                  │
 * │    activeLeads        → open events matching vendor     │
 * │    pendingQuotations  → vendor quotations (pending)     │
 * │    confirmedBookings  → bookings (confirmed / upcoming) │
 * │    thisMonthEarnings  → sum of booking.amount (month)   │
 * ├─────────────────────────────────────────────────────────┤
 * │  customerSatisfaction                                   │
 * │    averageRating      → from Review model (stub: 0)     │
 * │    totalReviews       → total review count              │
 * ├─────────────────────────────────────────────────────────┤
 * │  recentLeads          → last 3 matching open events     │
 * └─────────────────────────────────────────────────────────┘
 *
 * NOTE: customerSatisfaction will return 0/0 until a Review model is built.
 */

import { Response } from 'express';
import mongoose from 'mongoose';
import User from '../models/user.model';
import Event from '../models/event.model';
import Quotation from '../models/quotation.model';
import Booking from '../models/booking.model';

const vendorDashboardController = {
  /**
   * GET /api/web/vendor/dashboard
   * Auth: Bearer JWT (vendor only)
   */
  getDashboard: async (req: any, res: Response) => {
    try {
      const vendorId = req.user?.id;
      if (!vendorId) return res.status(401).json({ message: 'Unauthorized' });

      // ── Fetch vendor profile ───────────────────────────────────────────────
      const vendor = await User.findById(vendorId).select(
        'userType city eventCategory name businessName'
      );
      if (!vendor) return res.status(404).json({ message: 'Vendor not found' });
      if (vendor.userType !== 'vendor') {
        return res.status(403).json({ message: 'Only vendors can access this dashboard' });
      }

      const vendorCity = vendor.city?.trim() || '';
      const vendorCategory = vendor.eventCategory?.trim() || '';
      const vendorObjectId = new mongoose.Types.ObjectId(vendorId);

      // ── This-month date range ──────────────────────────────────────────────
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

      // ── Build leads (active) query — same matching logic as listLeads ──────
      const leadsQuery: any = { status: 'open' };
      if (vendorCity) {
        leadsQuery.city = { $regex: new RegExp(`^${vendorCity}$`, 'i') };
      }
      if (vendorCategory) {
        leadsQuery['vendorRequirements.vendorCategory'] = {
          $regex: new RegExp(`^${vendorCategory}$`, 'i'),
        };
      }

      // ── Run all DB queries in parallel for speed ───────────────────────────
      const [
        activeLeadsCount,
        pendingQuotationsCount,
        confirmedBookingsCount,
        thisMonthEarningsResult,
        recentLeads,
      ] = await Promise.all([
        // 1. Active leads — open events matching vendor
        Event.countDocuments(leadsQuery),

        // 2. Pending quotations sent by this vendor
        Quotation.countDocuments({ vendorId: vendorObjectId, status: 'pending' }),

        // 3. Confirmed bookings (upcoming + confirmed — excludes completed & cancelled)
        Booking.countDocuments({
          vendorId: vendorObjectId,
          status: { $in: ['upcoming', 'confirmed'] },
        }),

        // 4. This month earnings — sum of booking.amount for bookings created this month
        Booking.aggregate([
          {
            $match: {
              vendorId: vendorObjectId,
              status: { $nin: ['cancelled'] }, // exclude cancelled
              createdAt: { $gte: startOfMonth, $lte: endOfMonth },
            },
          },
          {
            $group: {
              _id: null,
              total: { $sum: '$amount' },
            },
          },
        ]),

        // 5. Recent leads — last 3 matching open events
        Event.find(leadsQuery)
          .sort({ createdAt: -1 })
          .limit(3)
          .select('title eventType date numberOfGuests city vendorRequirements status'),
      ]);

      // ── Extract earnings total ─────────────────────────────────────────────
      const thisMonthEarnings =
        thisMonthEarningsResult.length > 0 ? thisMonthEarningsResult[0].total : 0;

      // ── Format recent leads — attach matching requirement for this vendor ──
      const formattedRecentLeads = recentLeads.map((event) => {
        const eventObj = event.toObject() as any;
        const matchingRequirement = vendorCategory
          ? eventObj.vendorRequirements?.find((vr: any) =>
              new RegExp(`^${vendorCategory}$`, 'i').test(vr.vendorCategory)
            )
          : null;
        return {
          _id: eventObj._id,
          title: eventObj.title,
          eventType: eventObj.eventType,
          date: eventObj.date,
          numberOfGuests: eventObj.numberOfGuests,
          city: eventObj.city,
          status: eventObj.status,
          budget: matchingRequirement?.budgetRange || null,
        };
      });

      // ── Customer satisfaction (stub — wire up when Review model is ready) ──
      // TODO: Replace with actual Review model aggregation once reviews are implemented.
      const customerSatisfaction = {
        averageRating: 0,
        totalReviews: 0,
      };

      return res.json({
        vendor: {
          name: vendor.name,
          businessName: vendor.businessName,
          city: vendorCity,
          category: vendorCategory,
        },
        stats: {
          activeLeads: activeLeadsCount,
          pendingQuotations: pendingQuotationsCount,
          confirmedBookings: confirmedBookingsCount,
          thisMonthEarnings,
        },
        customerSatisfaction,
        recentLeads: formattedRecentLeads,
      });
    } catch (error) {
      console.error('getDashboard error:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  },
};

export default vendorDashboardController;
