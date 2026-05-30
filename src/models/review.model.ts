/**
 * Review Model
 *
 * Created by a customer after a booking is marked as completed.
 * One review per booking (unique constraint on bookingId).
 *
 * Fields:
 *   bookingId   — ref → Booking (unique)
 *   customerId  — ref → users (customer who wrote the review)
 *   vendorId    — ref → users (vendor being reviewed)
 *   rating      — 1 to 5 (integer)
 *   reviewText  — optional textual review
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface IReview extends Document {
  bookingId: mongoose.Types.ObjectId;
  customerId: mongoose.Types.ObjectId;
  vendorId: mongoose.Types.ObjectId;
  rating: number;
  reviewText?: string;
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema<IReview>(
  {
    bookingId: {
      type: Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
      unique: true, // only one review per booking
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: 'users',
      required: true,
    },
    vendorId: {
      type: Schema.Types.ObjectId,
      ref: 'users',
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    reviewText: {
      type: String,
      maxlength: 2000,
      default: '',
    },
  },
  { timestamps: true }
);

// Index for fast lookup by vendor (for vendor reviews listing)
reviewSchema.index({ vendorId: 1, createdAt: -1 });
// Index for fast lookup by customer (for customer reviews listing)
reviewSchema.index({ customerId: 1, createdAt: -1 });

export default mongoose.model<IReview>('Review', reviewSchema);
