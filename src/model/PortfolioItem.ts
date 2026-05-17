/**
 * PORTFOLIO ITEM MODEL
 * 
 * Allows Vendors to showcase their past work, helping them get selected
 * by Customers.
 * 
 * Flow:
 * 1. Vendor logs into their tracking Dashboard.
 * 2. They upload photos/videos of "Last week's Wedding" as a PortfolioItem.
 * 3. Customers see these items when viewing the Vendor's profile.
 */

import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IPortfolioItem extends Document {
  // The Vendor who owns this portfolio piece
  vendor: Types.ObjectId;
  
  // E.g., "Mansion Wedding Setup"
  title: string;
  
  // Details about what the vendor specifically did
  description: string;
  
  // Array of image URls hosted on Cloudinary/S3 etc.
  images: string[];
  
  createdAt: Date;
  updatedAt: Date;
}

const PortfolioItemSchema: Schema = new Schema(
  {
    vendor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    description: { type: String },
    images: [{ type: String }],
  },
  { timestamps: true }
);

export default mongoose.models.PortfolioItem || mongoose.model<IPortfolioItem>('PortfolioItem', PortfolioItemSchema);
