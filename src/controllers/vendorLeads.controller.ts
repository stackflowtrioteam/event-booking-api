/**
 * Vendor Leads Controller
 *
 * A "lead" is an open customer event whose:
 *   1. city         matches the vendor's city          (case-insensitive)
 *   2. vendorRequirements[].vendorCategory  contains the vendor's eventCategory (case-insensitive)
 *
 * Routes (prefix: /api/web/vendor/leads):
 *   POST /       → listLeads    — paginated list of matched open events
 *   GET  /:id    → getLeadById  — full detail of a single matched event
 */

import { Response } from 'express';
import Event from '../models/event.model';
import User from '../models/user.model';

const vendorLeadsController = {
  // ─── LIST LEADS ───────────────────────────────────────────────────────────────
  /**
   * POST /api/web/vendor/leads
   *
   * Matching rules:
   *   • event.status    === 'open'
   *   • event.city      ===  vendor.city              (case-insensitive regex)
   *   • event.vendorRequirements[].vendorCategory  includes vendor.eventCategory (case-insensitive regex)
   *
   * Optional body filters:
   *   { city, eventType, page, limit }
   *   city      → override city filter (browse other cities)
   *   eventType → filter by event type (e.g. "Wedding")
   *   page      → page number (default: 1)
   *   limit     → results per page (default: 10, max: 50)
   */
  listLeads: async (req: any, res: Response) => {
    try {
      const vendorId = req.user?.id;
      if (!vendorId) return res.status(401).json({ message: 'Unauthorized' });

      // Fetch the vendor's profile to get their city and eventCategory
      const vendor = await User.findById(vendorId).select('userType city eventCategory');
      if (!vendor) return res.status(404).json({ message: 'Vendor not found' });
      if (vendor.userType !== 'vendor') {
        return res.status(403).json({ message: 'Only vendors can access leads' });
      }

      const vendorCity = vendor.city?.trim();
      const vendorCategory = vendor.eventCategory?.trim();

      if (!vendorCity || !vendorCategory) {
        return res.status(400).json({
          message: 'Please complete your profile (city and event category) to see leads.',
        });
      }

      // ─── Build query ───────────────────────────────────────────────────────
      const { eventType, city, page = 1, limit = 10 } = req.body;

      const pageNum = Math.max(1, parseInt(page as string, 10));
      const limitNum = Math.min(50, Math.max(1, parseInt(limit as string, 10)));
      const skip = (pageNum - 1) * limitNum;

      // City to filter on — use query param if provided, otherwise vendor's own city
      const cityFilter = (city as string)?.trim() || vendorCity;

      const query: any = {
        status: 'open',
        // city match (case-insensitive)
        city: { $regex: new RegExp(`^${cityFilter}$`, 'i') },
        // at least one vendorRequirement whose vendorCategory matches the vendor's category
        'vendorRequirements.vendorCategory': {
          $regex: new RegExp(`^${vendorCategory}$`, 'i'),
        },
      };

      // Optional event type filter
      if (eventType) {
        query.eventType = { $regex: new RegExp(`^${eventType as string}$`, 'i') };
      }

      const [events, total] = await Promise.all([
        Event.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limitNum)
          .populate('customerId', 'name phoneNumber'),
        Event.countDocuments(query),
      ]);

      // Attach the matching vendorRequirement for each event so the frontend
      // can directly render the budget range for this vendor's category.
      const leads = events.map((event) => {
        const eventObj = event.toObject() as any;
        const matchingRequirement = eventObj.vendorRequirements.find(
          (vr: any) =>
            new RegExp(`^${vendorCategory}$`, 'i').test(vr.vendorCategory)
        );
        return {
          ...eventObj,
          matchingRequirement: matchingRequirement || null, // { vendorCategory, budgetRange, description }
        };
      });

      return res.json({
        leads,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum),
        },
        vendorFilter: {
          city: vendorCity,
          category: vendorCategory,
        },
      });
    } catch (error) {
      console.error('listLeads error:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  },

  // ─── GET LEAD DETAIL ──────────────────────────────────────────────────────────
  /**
   * GET /api/web/vendor/leads/:id
   *
   * Returns full event detail, but only if:
   *   • event.status === 'open'
   *   • event city + vendorRequirements category still match this vendor
   *
   * Also populates customer name for the vendor to see who posted it.
   */
  getLeadById: async (req: any, res: Response) => {
    try {
      const vendorId = req.user?.id;
      if (!vendorId) return res.status(401).json({ message: 'Unauthorized' });

      const vendor = await User.findById(vendorId).select('userType city eventCategory');
      if (!vendor) return res.status(404).json({ message: 'Vendor not found' });
      if (vendor.userType !== 'vendor') {
        return res.status(403).json({ message: 'Only vendors can access leads' });
      }

      const vendorCity = vendor.city?.trim();
      const vendorCategory = vendor.eventCategory?.trim();

      if (!vendorCity || !vendorCategory) {
        return res.status(400).json({
          message: 'Please complete your profile (city and event category) to view leads.',
        });
      }

      const event = await Event.findOne({
        _id: req.params.id,
        status: 'open',
        city: { $regex: new RegExp(`^${vendorCity}$`, 'i') },
        'vendorRequirements.vendorCategory': {
          $regex: new RegExp(`^${vendorCategory}$`, 'i'),
        },
      }).populate('customerId', 'name phoneNumber');

      if (!event) {
        return res.status(404).json({ message: 'Lead not found or no longer available' });
      }

      const eventObj = event.toObject() as any;

      // Extract the requirement that matches this vendor's category
      const matchingRequirement = eventObj.vendorRequirements.find(
        (vr: any) => new RegExp(`^${vendorCategory}$`, 'i').test(vr.vendorCategory)
      );

      return res.json({
        lead: {
          ...eventObj,
          matchingRequirement: matchingRequirement || null,
        },
      });
    } catch (error) {
      console.error('getLeadById error:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  },
};

export default vendorLeadsController;
