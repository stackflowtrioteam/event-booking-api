/**
 * Review Controller
 *
 * Customer Routes (prefix: /api/web/customer/reviews):
 *   POST   /           → createReview        — submit a review for a completed booking
 *   GET    /           → listCustomerReviews  — all reviews given by the customer
 *   PUT    /:id        → updateReview         — edit own review
 *   DELETE /:id        → deleteReview         — delete own review
 *
 * Vendor Routes (prefix: /api/web/vendor/reviews):
 *   GET    /           → listVendorReviews    — all reviews received + overall rating + distribution
 *
 * Public Routes (prefix: /api/web):
 *   GET    /vendors/:vendorId/reviews  → getPublicVendorReviews — public vendor reviews listing
 */

import { Response } from 'express';
import mongoose from 'mongoose';
import Review from '../models/review.model';
import Booking from '../models/booking.model';
import User from '../models/user.model';

const reviewController = {
  // ─────────────────────────────────────────────────────────────────────────────
  // CUSTOMER ENDPOINTS
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * POST /api/web/customer/reviews
   *
   * Customer submits a rating and review for a completed booking.
   * Rules:
   *   - Booking must exist and belong to this customer
   *   - Booking status must be 'completed'
   *   - Only one review per booking
   */
  createReview: async (req: any, res: Response) => {
    try {
      const customerId = req.user?.id;
      if (!customerId) return res.status(401).json({ message: 'Unauthorized' });

      const customer = await User.findById(customerId).select('userType');
      if (!customer || customer.userType !== 'customer') {
        return res.status(403).json({ message: 'Only customers can submit reviews' });
      }

      const { bookingId, rating, reviewText } = req.body;

      // Verify booking exists and belongs to this customer
      const booking = await Booking.findById(bookingId);
      if (!booking) {
        return res.status(404).json({ message: 'Booking not found' });
      }
      if (booking.customerId.toString() !== customerId) {
        return res.status(403).json({ message: 'This booking does not belong to you' });
      }
      if (booking.status !== 'completed') {
        return res.status(400).json({
          message: 'You can only review a booking once it is completed',
        });
      }

      // Check duplicate
      const existing = await Review.findOne({ bookingId });
      if (existing) {
        return res.status(409).json({ message: 'You have already reviewed this booking' });
      }

      const review = await Review.create({
        bookingId,
        customerId,
        vendorId: booking.vendorId,
        rating,
        reviewText: reviewText || '',
      });

      const populated = await Review.findById(review._id)
        .populate('vendorId', 'name businessName eventCategory')
        .populate('bookingId', 'servicesOffered vendorCategory amount');

      return res.status(201).json({ message: 'Review submitted successfully', review: populated });
    } catch (error) {
      console.error('createReview error:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  },

  /**
   * GET /api/web/customer/reviews
   *
   * Returns all reviews submitted by the authenticated customer.
   * Populates vendor info and booking info.
   * Optional query: page, limit
   */
  listCustomerReviews: async (req: any, res: Response) => {
    try {
      const customerId = req.user?.id;
      if (!customerId) return res.status(401).json({ message: 'Unauthorized' });

      const customer = await User.findById(customerId).select('userType');
      if (!customer || customer.userType !== 'customer') {
        return res.status(403).json({ message: 'Only customers can access this resource' });
      }

      const { page = 1, limit = 20 } = req.query;
      const pageNum = Math.max(1, parseInt(page as string, 10));
      const limitNum = Math.min(50, Math.max(1, parseInt(limit as string, 10)));
      const skip = (pageNum - 1) * limitNum;

      const [reviews, total] = await Promise.all([
        Review.find({ customerId })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limitNum)
          .populate('vendorId', 'name businessName eventCategory city')
          .populate('bookingId', 'servicesOffered vendorCategory amount status eventId')
          .populate({
            path: 'bookingId',
            populate: { path: 'eventId', select: 'title eventType' },
          }),
        Review.countDocuments({ customerId }),
      ]);

      return res.json({
        reviews,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum),
        },
      });
    } catch (error) {
      console.error('listCustomerReviews error:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  },

  /**
   * PUT /api/web/customer/reviews/:id
   *
   * Customer edits their own review (rating and/or reviewText).
   */
  updateReview: async (req: any, res: Response) => {
    try {
      const customerId = req.user?.id;
      if (!customerId) return res.status(401).json({ message: 'Unauthorized' });

      const review = await Review.findById(req.params.id);
      if (!review) {
        return res.status(404).json({ message: 'Review not found' });
      }
      if (review.customerId.toString() !== customerId) {
        return res.status(403).json({ message: 'You can only edit your own reviews' });
      }

      const { rating, reviewText } = req.body;
      if (rating !== undefined) review.rating = rating;
      if (reviewText !== undefined) review.reviewText = reviewText;
      await review.save();

      const populated = await Review.findById(review._id)
        .populate('vendorId', 'name businessName eventCategory')
        .populate('bookingId', 'servicesOffered vendorCategory amount');

      return res.json({ message: 'Review updated successfully', review: populated });
    } catch (error) {
      console.error('updateReview error:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  },

  /**
   * DELETE /api/web/customer/reviews/:id
   *
   * Customer deletes their own review.
   */
  deleteReview: async (req: any, res: Response) => {
    try {
      const customerId = req.user?.id;
      if (!customerId) return res.status(401).json({ message: 'Unauthorized' });

      const review = await Review.findById(req.params.id);
      if (!review) {
        return res.status(404).json({ message: 'Review not found' });
      }
      if (review.customerId.toString() !== customerId) {
        return res.status(403).json({ message: 'You can only delete your own reviews' });
      }

      await review.deleteOne();
      return res.json({ message: 'Review deleted successfully' });
    } catch (error) {
      console.error('deleteReview error:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // VENDOR ENDPOINTS
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * GET /api/web/vendor/reviews
   *
   * Returns all reviews received by the authenticated vendor.
   * Also computes overall rating average and distribution (1★–5★ counts).
   * Optional query: page, limit
   */
  listVendorReviews: async (req: any, res: Response) => {
    try {
      const vendorId = req.user?.id;
      if (!vendorId) return res.status(401).json({ message: 'Unauthorized' });

      const vendor = await User.findById(vendorId).select('userType');
      if (!vendor || vendor.userType !== 'vendor') {
        return res.status(403).json({ message: 'Only vendors can access this resource' });
      }

      const { page = 1, limit = 20 } = req.query;
      const pageNum = Math.max(1, parseInt(page as string, 10));
      const limitNum = Math.min(50, Math.max(1, parseInt(limit as string, 10)));
      const skip = (pageNum - 1) * limitNum;

      const vendorObjectId = new mongoose.Types.ObjectId(vendorId);

      const [reviews, total, stats] = await Promise.all([
        Review.find({ vendorId })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limitNum)
          .populate('customerId', 'name')
          .populate('bookingId', 'servicesOffered vendorCategory eventId')
          .populate({
            path: 'bookingId',
            populate: { path: 'eventId', select: 'title eventType' },
          }),
        Review.countDocuments({ vendorId }),
        // Aggregate: overall average + per-star distribution
        Review.aggregate([
          { $match: { vendorId: vendorObjectId } },
          {
            $group: {
              _id: null,
              averageRating: { $avg: '$rating' },
              totalReviews: { $sum: 1 },
              star5: { $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] } },
              star4: { $sum: { $cond: [{ $eq: ['$rating', 4] }, 1, 0] } },
              star3: { $sum: { $cond: [{ $eq: ['$rating', 3] }, 1, 0] } },
              star2: { $sum: { $cond: [{ $eq: ['$rating', 2] }, 1, 0] } },
              star1: { $sum: { $cond: [{ $eq: ['$rating', 1] }, 1, 0] } },
            },
          },
        ]),
      ]);

      const ratingStats = stats[0] || {
        averageRating: 0,
        totalReviews: 0,
        star5: 0,
        star4: 0,
        star3: 0,
        star2: 0,
        star1: 0,
      };

      return res.json({
        reviews,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum),
        },
        ratingStats: {
          averageRating: parseFloat((ratingStats.averageRating || 0).toFixed(1)),
          totalReviews: ratingStats.totalReviews,
          distribution: {
            5: ratingStats.star5,
            4: ratingStats.star4,
            3: ratingStats.star3,
            2: ratingStats.star2,
            1: ratingStats.star1,
          },
        },
      });
    } catch (error) {
      console.error('listVendorReviews error:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // PUBLIC ENDPOINT
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * GET /api/web/vendors/:vendorId/reviews
   *
   * Public endpoint — no auth required.
   * Returns reviews for a specific vendor so other customers can see them.
   * Includes overall rating stats and distribution.
   * Optional query: page, limit
   */
  getPublicVendorReviews: async (req: any, res: Response) => {
    try {
      const { vendorId } = req.params;

      if (!mongoose.Types.ObjectId.isValid(vendorId)) {
        return res.status(400).json({ message: 'Invalid vendor ID' });
      }

      const vendor = await User.findById(vendorId).select(
        'name businessName eventCategory city state portfolio kycStatus userType'
      );
      if (!vendor || vendor.userType !== 'vendor') {
        return res.status(404).json({ message: 'Vendor not found' });
      }

      const { page = 1, limit = 10 } = req.query;
      const pageNum = Math.max(1, parseInt(page as string, 10));
      const limitNum = Math.min(50, Math.max(1, parseInt(limit as string, 10)));
      const skip = (pageNum - 1) * limitNum;

      const vendorObjectId = new mongoose.Types.ObjectId(vendorId);

      const [reviews, total, stats] = await Promise.all([
        Review.find({ vendorId })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limitNum)
          .populate('customerId', 'name')
          .populate('bookingId', 'vendorCategory eventId')
          .populate({
            path: 'bookingId',
            populate: { path: 'eventId', select: 'title eventType' },
          }),
        Review.countDocuments({ vendorId }),
        Review.aggregate([
          { $match: { vendorId: vendorObjectId } },
          {
            $group: {
              _id: null,
              averageRating: { $avg: '$rating' },
              totalReviews: { $sum: 1 },
              star5: { $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] } },
              star4: { $sum: { $cond: [{ $eq: ['$rating', 4] }, 1, 0] } },
              star3: { $sum: { $cond: [{ $eq: ['$rating', 3] }, 1, 0] } },
              star2: { $sum: { $cond: [{ $eq: ['$rating', 2] }, 1, 0] } },
              star1: { $sum: { $cond: [{ $eq: ['$rating', 1] }, 1, 0] } },
            },
          },
        ]),
      ]);

      const ratingStats = stats[0] || {
        averageRating: 0,
        totalReviews: 0,
        star5: 0,
        star4: 0,
        star3: 0,
        star2: 0,
        star1: 0,
      };

      return res.json({
        vendor: {
          _id: vendor._id,
          name: vendor.name,
          businessName: vendor.businessName,
          eventCategory: vendor.eventCategory,
          city: vendor.city,
          state: vendor.state,
          portfolio: vendor.portfolio,
        },
        reviews,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum),
        },
        ratingStats: {
          averageRating: parseFloat((ratingStats.averageRating || 0).toFixed(1)),
          totalReviews: ratingStats.totalReviews,
          distribution: {
            5: ratingStats.star5,
            4: ratingStats.star4,
            3: ratingStats.star3,
            2: ratingStats.star2,
            1: ratingStats.star1,
          },
        },
      });
    } catch (error) {
      console.error('getPublicVendorReviews error:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  },
};

export default reviewController;
