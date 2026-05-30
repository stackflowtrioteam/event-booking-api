/**
 * Admin Reviews Controller
 *
 * Routes (prefix: /api/admin/reviews):
 *   POST /list     → listReviews  — paginated list with filters + overall stats
 *   POST /detail   → getReview    — single review detail
 *   POST /delete   → deleteReview — permanently delete a review
 */

import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Review from '../models/review.model';

const adminReviewsController = {

  /**
   * POST /api/admin/reviews/list
   * Paginated list of all reviews with optional filters.
   * Body: { page, perPage, vendorId?, customerId?, rating?, search? }
   */
  listReviews: async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.body.page) || 1;
      const perPage = parseInt(req.body.perPage) || 10;
      const { vendorId, customerId, rating, search } = req.body;

      const pageNumber = Math.max(1, page);
      const limitNumber = Math.max(1, perPage);
      const skip = (pageNumber - 1) * limitNumber;

      const filter: any = {};
      if (vendorId && mongoose.Types.ObjectId.isValid(vendorId)) filter.vendorId = vendorId;
      if (customerId && mongoose.Types.ObjectId.isValid(customerId)) filter.customerId = customerId;
      if (rating && [1, 2, 3, 4, 5].includes(parseInt(rating))) filter.rating = parseInt(rating);
      if (search && search.trim() !== '') {
        filter.reviewText = { $regex: search.trim(), $options: 'i' };
      }

      const [reviews, total] = await Promise.all([
        Review.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limitNumber)
          .populate('customerId', 'name email')
          .populate('vendorId', 'name businessName eventCategory city')
          .populate('bookingId', 'vendorCategory amount status'),
        Review.countDocuments(filter),
      ]);

      // Overall platform stats
      const [statsResult, star5, star4, star3, star2, star1] = await Promise.all([
        Review.aggregate([{ $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } }]),
        Review.countDocuments({ rating: 5 }),
        Review.countDocuments({ rating: 4 }),
        Review.countDocuments({ rating: 3 }),
        Review.countDocuments({ rating: 2 }),
        Review.countDocuments({ rating: 1 }),
      ]);

      return res.json({
        reviews,
        total,
        page: pageNumber,
        perPage: limitNumber,
        totalPages: Math.ceil(total / limitNumber),
        stats: {
          averageRating: parseFloat((statsResult[0]?.avg || 0).toFixed(1)),
          totalReviews: statsResult[0]?.count || 0,
          distribution: { 5: star5, 4: star4, 3: star3, 2: star2, 1: star1 },
        },
      });
    } catch (error) {
      console.error('admin listReviews error:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  },

  /**
   * POST /api/admin/reviews/detail
   * Full review detail with customer, vendor, and booking info.
   * Body: { id }
   */
  getReview: async (req: Request, res: Response) => {
    try {
      const { id } = req.body;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid review ID' });
      }

      const review = await Review.findById(id)
        .populate('customerId', 'name email phoneNumber')
        .populate('vendorId', 'name businessName eventCategory city')
        .populate({
          path: 'bookingId',
          populate: [
            { path: 'eventId', select: 'title eventType date city' },
          ],
        });

      if (!review) return res.status(404).json({ message: 'Review not found' });

      return res.json({ review });
    } catch (error) {
      console.error('admin getReview error:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  },

  /**
   * POST /api/admin/reviews/delete
   * Permanently delete a review.
   * Body: { id }
   */
  deleteReview: async (req: Request, res: Response) => {
    try {
      const { id } = req.body;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid review ID' });
      }

      const review = await Review.findByIdAndDelete(id);
      if (!review) return res.status(404).json({ message: 'Review not found' });

      return res.json({ message: 'Review deleted successfully' });
    } catch (error) {
      console.error('admin deleteReview error:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  },
};

export default adminReviewsController;
