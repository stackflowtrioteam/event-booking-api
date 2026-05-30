/**
 * Quotation Model
 *
 * Stores vendor quotations sent on customer event leads.
 * A vendor can submit only ONE quotation per event (unique index on eventId + vendorId).
 * Multiple vendors can bid on the same event (bidding/leads system).
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface IQuotation extends Document {
  eventId: mongoose.Types.ObjectId;       // ref → Event
  vendorId: mongoose.Types.ObjectId;      // ref → users (vendor)
  vendorCategory: string;                 // vendor's category e.g. "Photography", "Catering"
  quotedPrice: number;                    // quoted amount in INR
  servicesOffered: string;               // comma-separated or description e.g. "Sound System, DJ, Lighting"
  description?: string;                  // detailed message/pitch to customer
  validUntil?: Date;                     // optional validity date
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

const quotationSchema = new Schema<IQuotation>(
  {
    eventId: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },
    vendorId: {
      type: Schema.Types.ObjectId,
      ref: 'users',
      required: true,
    },
    vendorCategory: {
      type: String,
      required: true,
    },
    quotedPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    servicesOffered: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    validUntil: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

// One quotation per vendor per event
quotationSchema.index({ eventId: 1, vendorId: 1 }, { unique: true });

export default mongoose.model<IQuotation>('Quotation', quotationSchema);
