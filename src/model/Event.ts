/**
 * EVENT MODEL
 * 
 * Represents an event that a Customer wants to host (e.g. Wedding, Birthday).
 * 
 * Flow:
 * 1. Customer creates an Event.
 * 2. This Event appears on the Vendor dashboard under "Leads".
 * 3. Vendors can see this event and decide to send a "Quotation" to provide 
 *    their services for it.
 */

import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IEvent extends Document {
  title: string; // The headline for the event (e.g. "Summer Wedding")
  description: string; // Additional details for vendors to read
  date: Date; // When the event happens
  guestsCount: number; // Size of the event
  budget: number; // Customer's total budget or budget for specific services
  
  // Connects the event to the Customer who created it
  customer: Types.ObjectId; 
  
  // Current state of the event
  // active: Open for vendors to bid
  // in-progress: Vendor hired and event ongoing
  // completed: Past event
  // cancelled: Customer stopped the event
  status: 'active' | 'in-progress' | 'completed' | 'cancelled';
  
  eventType: string; // e.g., "Wedding", "Corporate", "Birthday"
  location?: string; // Where it is taking place
  
  createdAt: Date;
  updatedAt: Date;
}

const EventSchema: Schema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    date: { type: Date, required: true },
    guestsCount: { type: Number, required: true },
    budget: { type: Number, required: true },
    customer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: { 
      type: String, 
      enum: ['active', 'in-progress', 'completed', 'cancelled'], 
      default: 'active' 
    },
    eventType: { type: String, required: true },
    location: { type: String },
  },
  { timestamps: true }
);

export default mongoose.models.Event || mongoose.model<IEvent>('Event', EventSchema);
