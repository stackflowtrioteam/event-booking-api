/**
 * Booking Model
 *
 * Auto-created when a customer accepts a quotation.
 * Represents a confirmed service engagement between customer and vendor.
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface IBooking extends Document {
  quotationId: mongoose.Types.ObjectId;   // ref → Quotation
  eventId: mongoose.Types.ObjectId;       // ref → Event
  customerId: mongoose.Types.ObjectId;    // ref → users (customer)
  vendorId: mongoose.Types.ObjectId;      // ref → users (vendor)
  amount: number;                         // agreed price from quotation
  servicesOffered: string;               // services from quotation
  vendorCategory: string;                // category e.g. Photography, Catering
  status: 'upcoming' | 'confirmed' | 'completed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

const bookingSchema = new Schema<IBooking>(
  {
    quotationId: {
      type: Schema.Types.ObjectId,
      ref: 'Quotation',
      required: true,
      unique: true, // one booking per accepted quotation
    },
    eventId: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
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
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    servicesOffered: {
      type: String,
      required: true,
    },
    vendorCategory: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['upcoming', 'confirmed', 'completed', 'cancelled'],
      default: 'upcoming',
    },
  },
  { timestamps: true }
);

export default mongoose.model<IBooking>('Booking', bookingSchema);
