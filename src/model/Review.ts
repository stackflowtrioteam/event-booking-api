/**
 * REVIEW MODEL
 * 
 * Feedback left by a Customer for a Vendor after an Event is completed.
 * 
 * Flow:
 * 1. The Event and Booking reach 'completed' status.
 * 2. Customer writes a review for the Vendor.
 * 3. This updates the Vendor's average rating shown on their profile.
 */

import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IReview extends Document {
  // The vendor being reviewed
  vendor: Types.ObjectId;
  
  // The customer leaving the review
  customer: Types.ObjectId;
  
  // The event context for this review (to ensure they actually worked together)
  event: Types.ObjectId;
  
  // Star rating (usually 1 through 5)
  rating: number; 
  
  // Written feedback
  comment: string;
  
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema: Schema = new Schema(
  {
    vendor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    customer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    event: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String },
  },
  { timestamps: true }
);

export default mongoose.models.Review || mongoose.model<IReview>('Review', ReviewSchema);
