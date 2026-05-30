/**
 * Event Model
 * Stores customer-created event requirements posted to find vendors.
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface IVendorRequirement {
  vendorCategory: string;   // vendor category / type
  budgetRange: string;      // e.g. "10000-50000"
  description?: string;     // description of requirements
}

export interface IEvent extends Document {
  customerId: mongoose.Types.ObjectId;   // ref → users (customer)
  title: string;                          // Event Title
  eventType: string;                      // Event Type (e.g. Wedding, Birthday)
  date: Date;                             // Event Date
  time: string;                           // Event Time (e.g. "18:00")
  numberOfGuests: number;                 // Number of Guests
  city: string;                           // Event Location (City)
  state?: string;                         // optional state
  vendorRequirements: IVendorRequirement[];
  referenceImages: string[];              // uploaded image URLs
  status: 'open' | 'quotation_received' | 'booked' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

const vendorRequirementSchema = new Schema<IVendorRequirement>(
  {
    vendorCategory: { type: String, required: true },
    budgetRange: { type: String, required: true },
    description: { type: String },
  },
  { _id: false }
);

const eventSchema = new Schema<IEvent>(
  {
    customerId: {
      type: Schema.Types.ObjectId,
      ref: 'users',
      required: true,
    },
    title: { type: String, required: true },
    eventType: { type: String, required: true },
    date: { type: Date, required: true },
    time: { type: String, required: true },
    numberOfGuests: { type: Number, required: true },
    city: { type: String, required: true },
    state: { type: String },
    vendorRequirements: {
      type: [vendorRequirementSchema],
      required: true,
      validate: {
        validator: (arr: IVendorRequirement[]) => arr.length > 0,
        message: 'At least one vendor requirement is required.',
      },
    },
    referenceImages: [{ type: String }],
    status: {
      type: String,
      enum: ['open', 'quotation_received', 'booked', 'cancelled'],
      default: 'open',
    },
  },
  { timestamps: true }
);

export default mongoose.model<IEvent>('Event', eventSchema);
