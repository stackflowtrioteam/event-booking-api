/**
 * Admin Quotations Controller
 *
 * Routes (prefix: /api/admin/quotations):
 *   POST /list     → listQuotations  — paginated list with filters
 *   POST /detail   → getQuotation    — single quotation detail
 *   POST /delete   → deleteQuotation — permanently delete a quotation
 */

import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Quotation from '../models/quotation.model';

const adminQuotationsController = {

  /**
   * POST /api/admin/quotations/list
   * Paginated list of all quotations with optional status/vendor/event filters.
   * Body: { page, perPage, status?, vendorId?, eventId?, search? }
   */
  listQuotations: async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.body.page) || 1;
      const perPage = parseInt(req.body.perPage) || 10;
      const { status, vendorId, eventId, search } = req.body;

      const pageNumber = Math.max(1, page);
      const limitNumber = Math.max(1, perPage);
      const skip = (pageNumber - 1) * limitNumber;

      const filter: any = {};
      if (status && ['pending', 'accepted', 'rejected'].includes(status)) filter.status = status;
      if (vendorId && mongoose.Types.ObjectId.isValid(vendorId)) filter.vendorId = vendorId;
      if (eventId && mongoose.Types.ObjectId.isValid(eventId)) filter.eventId = eventId;
      if (search && search.trim() !== '') {
        filter.$or = [
          { servicesOffered: { $regex: search.trim(), $options: 'i' } },
          { vendorCategory: { $regex: search.trim(), $options: 'i' } },
        ];
      }

      const [quotations, total] = await Promise.all([
        Quotation.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limitNumber)
          .populate('eventId', 'title eventType date city status')
          .populate('vendorId', 'name businessName eventCategory city'),
        Quotation.countDocuments(filter),
      ]);

      // Status summary counts
      const [pending, accepted, rejected] = await Promise.all([
        Quotation.countDocuments({ status: 'pending' }),
        Quotation.countDocuments({ status: 'accepted' }),
        Quotation.countDocuments({ status: 'rejected' }),
      ]);

      return res.json({
        quotations,
        total,
        page: pageNumber,
        perPage: limitNumber,
        totalPages: Math.ceil(total / limitNumber),
        stats: { pending, accepted, rejected, total: pending + accepted + rejected },
      });
    } catch (error) {
      console.error('admin listQuotations error:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  },

  /**
   * POST /api/admin/quotations/detail
   * Full quotation detail with event + vendor info.
   * Body: { id }
   */
  getQuotation: async (req: Request, res: Response) => {
    try {
      const { id } = req.body;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid quotation ID' });
      }

      const quotation = await Quotation.findById(id)
        .populate('eventId', 'title eventType date time city state numberOfGuests vendorRequirements customerId')
        .populate({
          path: 'eventId',
          populate: { path: 'customerId', select: 'name email phoneNumber' },
        })
        .populate('vendorId', 'name businessName eventCategory city portfolio');

      if (!quotation) return res.status(404).json({ message: 'Quotation not found' });

      return res.json({ quotation });
    } catch (error) {
      console.error('admin getQuotation error:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  },

  /**
   * POST /api/admin/quotations/delete
   * Permanently delete a quotation.
   * Body: { id }
   */
  deleteQuotation: async (req: Request, res: Response) => {
    try {
      const { id } = req.body;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid quotation ID' });
      }

      const quotation = await Quotation.findByIdAndDelete(id);
      if (!quotation) return res.status(404).json({ message: 'Quotation not found' });

      return res.json({ message: 'Quotation deleted successfully' });
    } catch (error) {
      console.error('admin deleteQuotation error:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  },
};

export default adminQuotationsController;
