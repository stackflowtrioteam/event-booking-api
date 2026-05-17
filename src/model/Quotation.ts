/**
 * QUOTATION MODEL
 * 
 * Acts as an "Offer" or "Bid" placed by a Vendor for a Customer's Event.
 * 
 * Flow:
 * 1. Vendor reads an Event (Lead).
 * 2. Vendor sends a Quotation proposing a price and describing their services.
 * 3. Customer sees this Quotation in their dashboard.
 * 4. Customer can 'accept' or 'reject' it. Accepting creates a Booking.
 */

import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IQuotation extends Document {
  // Vendor offering the service
  vendor: Types.ObjectId; 
  // Customer receiving the offer
  customer: Types.ObjectId;
  // The specific event being bid on
  event: Types.ObjectId;
  
  // The price the vendor is asking for
  amount: number;
  
  // A cover letter or description of what the vendor provides
  message: string;
  
  // State of this specific proposal
  status: 'pending' | 'accepted' | 'rejected';
  
  createdAt: Date;
  updatedAt: Date;
}

const QuotationSchema: Schema = new Schema(
  {
    vendor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    customer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    event: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
    amount: { type: Number, required: true },
    message: { type: String },
    status: { 
      type: String, 
      enum: ['pending', 'accepted', 'rejected'], 
      default: 'pending' 
    },
  },
  { timestamps: true }
);

export default mongoose.models.Quotation || mongoose.model<IQuotation>('Quotation', QuotationSchema);
