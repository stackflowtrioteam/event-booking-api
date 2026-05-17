/**
 * PAYMENT MODEL
 * 
 * Records individual financial transactions made by a Customer to a Vendor
 * for a specific Booking.
 * 
 * Flow:
 * 1. A Booking is confirmed.
 * 2. Customer pays a deposit or the full amount.
 * 3. A Payment document is created to log this transaction.
 * 4. The Booking's 'paidAmount' is incremented.
 * 5. This drives the Vendor's "Earnings" dashboard.
 */

import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IPayment extends Document {
  // The specific Booking this payment applies to
  booking: Types.ObjectId;
  
  // Who is paying
  customer: Types.ObjectId;
  
  // Who the money goes to
  vendor: Types.ObjectId;
  
  // How much money was transacted
  amount: number;
  
  // Status of the payment gateway transaction
  status: 'pending' | 'success' | 'failed';
  
  // E.g., 'Credit Card', 'PayPal', 'Stripe'
  paymentMethod?: string;
  
  // Stripe/Payment provider transaction ID for cross-referencing
  transactionId?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema: Schema = new Schema(
  {
    booking: { type: Schema.Types.ObjectId, ref: 'Booking', required: true },
    customer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    vendor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    status: { 
      type: String, 
      enum: ['pending', 'success', 'failed'], 
      default: 'pending' 
    },
    paymentMethod: { type: String },
    transactionId: { type: String },
  },
  { timestamps: true }
);

export default mongoose.models.Payment || mongoose.model<IPayment>('Payment', PaymentSchema);
