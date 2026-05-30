/**
 * Quotation Controller
 *
 * Handles the bidding/quotation system where vendors bid on customer event leads.
 *
 * Vendor Routes (prefix: /api/web/vendor/quotations):
 *   POST   /              → sendQuotation          — vendor submits a bid on a lead
 *   GET    /              → listVendorQuotations    — vendor's sent quotations with status
 *   GET    /:id           → getVendorQuotationById  — single quotation detail for vendor
 *
 * Customer Routes (prefix: /api/web/customer/quotations):
 *   GET    /              → listCustomerQuotations       — all quotations on customer's events
 *   GET    /event/:eventId → getCustomerEventQuotations  — quotations for a specific event
 *   PATCH  /:id/status    → updateQuotationStatus        — accept or reject a quotation
 */

import { Response } from 'express';
import mongoose from 'mongoose';
import Quotation from '../models/quotation.model';
import Event from '../models/event.model';
import User from '../models/user.model';
import Booking from '../models/booking.model';

const quotationController = {
  // ─────────────────────────────────────────────────────────────────────────────
  // VENDOR ENDPOINTS
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * POST /api/web/vendor/quotations
   *
   * Vendor submits a quotation on an open event lead.
   * Checks:
   *   1. Lead exists and is still open
   *   2. Vendor's city + category matches the lead
   *   3. Vendor hasn't already submitted a quotation for this event
   */
  sendQuotation: async (req: any, res: Response) => {
    try {
      const vendorId = req.user?.id;
      if (!vendorId) return res.status(401).json({ message: 'Unauthorized' });

      // Fetch vendor profile
      const vendor = await User.findById(vendorId).select('userType city eventCategory businessName');
      if (!vendor) return res.status(404).json({ message: 'Vendor not found' });
      if (vendor.userType !== 'vendor') {
        return res.status(403).json({ message: 'Only vendors can send quotations' });
      }

      const vendorCity = vendor.city?.trim();
      const vendorCategory = vendor.eventCategory?.trim();

      if (!vendorCity || !vendorCategory) {
        return res.status(400).json({
          message: 'Please complete your profile (city and event category) before sending quotations.',
        });
      }

      const { eventId, quotedPrice, servicesOffered, description, validUntil } = req.body;

      // Validate event exists, is open, and matches vendor's city + category
      const event = await Event.findOne({
        _id: eventId,
        status: 'open',
        city: { $regex: new RegExp(`^${vendorCity}$`, 'i') },
        'vendorRequirements.vendorCategory': {
          $regex: new RegExp(`^${vendorCategory}$`, 'i'),
        },
      });

      if (!event) {
        return res.status(404).json({
          message: 'Lead not found, no longer available, or does not match your profile.',
        });
      }

      // Create quotation (will fail with duplicate key error if already sent)
      try {
        const quotation = await Quotation.create({
          eventId,
          vendorId,
          vendorCategory,
          quotedPrice,
          servicesOffered,
          description,
          validUntil: validUntil || undefined,
          status: 'pending',
        });

        // Update event status to 'quotation_received' if it's still 'open'
        if (event.status === 'open') {
          await Event.findByIdAndUpdate(eventId, { status: 'quotation_received' });
        }

        return res.status(201).json({
          message: 'Quotation sent successfully',
          quotation,
        });
      } catch (err: any) {
        if (err.code === 11000) {
          return res.status(409).json({
            message: 'You have already sent a quotation for this event.',
          });
        }
        throw err;
      }
    } catch (error) {
      console.error('sendQuotation error:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  },

  /**
   * GET /api/web/vendor/quotations
   *
   * Returns all quotations sent by the authenticated vendor.
   * Populates event title and customer name.
   * Supports optional query: status, page, limit
   */
  listVendorQuotations: async (req: any, res: Response) => {
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

      const [quotations, total] = await Promise.all([
        Quotation.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limitNum)
          .populate('eventId', 'title eventType date city customerId')
          .populate({
            path: 'eventId',
            populate: { path: 'customerId', select: 'name phoneNumber' },
          }),
        Quotation.countDocuments(filter),
      ]);

      // Compute summary stats
      const [totalCount, pendingCount, acceptedCount, rejectedCount] = await Promise.all([
        Quotation.countDocuments({ vendorId }),
        Quotation.countDocuments({ vendorId, status: 'pending' }),
        Quotation.countDocuments({ vendorId, status: 'accepted' }),
        Quotation.countDocuments({ vendorId, status: 'rejected' }),
      ]);

      return res.json({
        quotations,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum),
        },
        stats: {
          total: totalCount,
          pending: pendingCount,
          accepted: acceptedCount,
          rejected: rejectedCount,
        },
      });
    } catch (error) {
      console.error('listVendorQuotations error:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  },

  /**
   * GET /api/web/vendor/quotations/:id
   *
   * Returns a single quotation's full detail — only if it belongs to this vendor.
   */
  getVendorQuotationById: async (req: any, res: Response) => {
    try {
      const vendorId = req.user?.id;
      if (!vendorId) return res.status(401).json({ message: 'Unauthorized' });

      const quotation = await Quotation.findOne({ _id: req.params.id, vendorId })
        .populate('eventId', 'title eventType date time city numberOfGuests vendorRequirements referenceImages status')
        .populate({
          path: 'eventId',
          populate: { path: 'customerId', select: 'name phoneNumber' },
        });

      if (!quotation) {
        return res.status(404).json({ message: 'Quotation not found' });
      }

      return res.json({ quotation });
    } catch (error) {
      console.error('getVendorQuotationById error:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // CUSTOMER ENDPOINTS
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * GET /api/web/customer/quotations
   *
   * Returns all quotations received across all events belonging to this customer.
   * Populates vendor info (name, businessName, eventCategory, portfolio rating).
   * Supports optional query: status, eventId, page, limit
   */
  listCustomerQuotations: async (req: any, res: Response) => {
    try {
      const customerId = req.user?.id;
      if (!customerId) return res.status(401).json({ message: 'Unauthorized' });

      const customer = await User.findById(customerId).select('userType');
      if (!customer || customer.userType !== 'customer') {
        return res.status(403).json({ message: 'Only customers can access this resource' });
      }

      const { status, eventId, page = 1, limit = 20 } = req.query;
      const pageNum = Math.max(1, parseInt(page as string, 10));
      const limitNum = Math.min(50, Math.max(1, parseInt(limit as string, 10)));
      const skip = (pageNum - 1) * limitNum;

      // Get all event IDs belonging to this customer
      let eventFilter: any = { customerId };
      if (eventId) eventFilter._id = eventId;
      const customerEvents = await Event.find(eventFilter).select('_id');
      const customerEventIds = customerEvents.map((e) => e._id);

      if (customerEventIds.length === 0) {
        return res.json({
          quotations: [],
          pagination: { total: 0, page: pageNum, limit: limitNum, totalPages: 0 },
          stats: { total: 0, pending: 0, accepted: 0, rejected: 0 },
        });
      }

      const filter: any = { eventId: { $in: customerEventIds } };
      if (status) filter.status = status;

      const [quotations, total] = await Promise.all([
        Quotation.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limitNum)
          .populate('eventId', 'title eventType date city')
          .populate('vendorId', 'name businessName eventCategory portfolio'),
        Quotation.countDocuments(filter),
      ]);

      // Stats across ALL customer events (not filtered)
      const allFilter = { eventId: { $in: customerEventIds } };
      const [totalCount, pendingCount, acceptedCount, rejectedCount] = await Promise.all([
        Quotation.countDocuments(allFilter),
        Quotation.countDocuments({ ...allFilter, status: 'pending' }),
        Quotation.countDocuments({ ...allFilter, status: 'accepted' }),
        Quotation.countDocuments({ ...allFilter, status: 'rejected' }),
      ]);

      return res.json({
        quotations,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum),
        },
        stats: {
          total: totalCount,
          pending: pendingCount,
          accepted: acceptedCount,
          rejected: rejectedCount,
        },
      });
    } catch (error) {
      console.error('listCustomerQuotations error:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  },

  /**
   * GET /api/web/customer/quotations/event/:eventId
   *
   * Returns all quotations for a specific event — only if that event belongs to this customer.
   * Groups them by vendorCategory so the customer can compare like-for-like bids.
   */
  getCustomerEventQuotations: async (req: any, res: Response) => {
    try {
      const customerId = req.user?.id;
      if (!customerId) return res.status(401).json({ message: 'Unauthorized' });

      const { eventId } = req.params;

      // Verify event belongs to this customer
      const event = await Event.findOne({ _id: eventId, customerId });
      if (!event) {
        return res.status(404).json({ message: 'Event not found' });
      }

      const quotations = await Quotation.find({ eventId })
        .sort({ quotedPrice: 1 }) // cheapest first
        .populate('vendorId', 'name businessName eventCategory portfolio city');

      return res.json({
        event: {
          _id: event._id,
          title: event.title,
          eventType: event.eventType,
          date: event.date,
          city: event.city,
          status: event.status,
        },
        quotations,
        total: quotations.length,
      });
    } catch (error) {
      console.error('getCustomerEventQuotations error:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  },

  /**
   * PATCH /api/web/customer/quotations/:id/status
   *
   * Customer accepts or rejects a pending quotation.
   * Only the event owner can do this and only on 'pending' quotations.
   */
  updateQuotationStatus: async (req: any, res: Response) => {
    try {
      const customerId = req.user?.id;
      if (!customerId) return res.status(401).json({ message: 'Unauthorized' });

      const { id } = req.params;
      const { status } = req.body; // 'accepted' | 'rejected'

      // Find the quotation and verify the event belongs to this customer
      const quotation = await Quotation.findById(id).populate('eventId');
      if (!quotation) {
        return res.status(404).json({ message: 'Quotation not found' });
      }

      const event = quotation.eventId as any;
      if (event.customerId.toString() !== customerId) {
        return res.status(403).json({ message: 'You are not authorized to update this quotation' });
      }

      if (quotation.status !== 'pending') {
        return res.status(400).json({
          message: `Quotation is already ${quotation.status} and cannot be changed`,
        });
      }

      quotation.status = status;
      await quotation.save();

      // If accepted → create Booking + update event status
      if (status === 'accepted') {
        await Booking.create({
          quotationId: quotation._id,
          eventId: event._id,
          customerId: event.customerId,
          vendorId: quotation.vendorId,
          amount: quotation.quotedPrice,
          servicesOffered: quotation.servicesOffered,
          vendorCategory: quotation.vendorCategory,
          status: 'upcoming',
        });
        await Event.findByIdAndUpdate(event._id, { status: 'booked' });
      }

      return res.json({
        message: `Quotation ${status} successfully`,
        quotation,
      });
    } catch (error) {
      console.error('updateQuotationStatus error:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  },
};

export default quotationController;
