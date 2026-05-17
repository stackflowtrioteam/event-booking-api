/**
 * BOOKING MODEL
 * 
 * Represents a confirmed contract / agreement between a Customer and a Vendor.
 * 
 * Flow:
 * 1. Customer accepts a Quotation.
 * 2. A Booking is created referencing the Event, Vendor, and accepted Quotation.
 * 3. The totalAmount is locked in. Payments are tracked against this booking.
 */

import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IBooking extends Document {
  // Reference to the Event this booking belongs to
  event: Types.ObjectId;
  
  // The hired Vendor
  vendor: Types.ObjectId;
  
  // The Customer who owns the Event
  customer: Types.ObjectId;
  
  // The specific Quotation that was accepted to make this Booking happen
  quotation: Types.ObjectId;
  
  // Status of the work
  // confirmed: Job accepted, awaiting event date
  // completed: Job finished
  // cancelled: The booking was terminated
  status: 'confirmed' | 'completed' | 'cancelled';
  
  // Financial tracking for the booking
  totalAmount: number; // Agreed upon price (from quotation)
  paidAmount: number;  // How much the customer has paid so far
  
  createdAt: Date;
  updatedAt: Date;
}

const BookingSchema: Schema = new Schema(
  {
    event: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
    vendor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    customer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    quotation: { type: Schema.Types.ObjectId, ref: 'Quotation', required: true },
    status: { 
      type: String, 
      enum: ['confirmed', 'completed', 'cancelled'], 
      default: 'confirmed' 
    },
    totalAmount: { type: Number, required: true },
    paidAmount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.models.Booking || mongoose.model<IBooking>('Booking', BookingSchema);
