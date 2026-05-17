/**
 * USER MODEL
 * 
 * This model represents both Customers and Vendors in the system.
 * By using a single User collection, we make authentication and session
 * management simpler. The `role` field determines what the user can do
 * and what dashboard they see.
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  // Basic login details for everyone
  name: string;
  email: string;
  passwordHash: string;
  
  // Defines the capabilities of the user
  // 'customer' posts events and books vendors.
  // 'vendor' receives leads, sends quotations, and manages a portfolio.
  role: 'customer' | 'vendor';
  
  // The following fields are specific to Vendors
  businessName?: string; // e.g. "DJ Bob's Entertainment"
  businessCategory?: string; // e.g. "DJ", "Catering", "Photography"
  profileImage?: string; // Avatar or business logo
  
  // Standard timestamps
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['customer', 'vendor'], required: true },
    businessName: { type: String },
    businessCategory: { type: String },
    profileImage: { type: String },
  },
  { timestamps: true } // Automatically manages createdAt and updatedAt
);

// We check if the model is already registered to avoid Next.js hot-reloading errors
export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
