/**
 * ADMIN USER MODEL
 * 
 * By using a single User collection, we make authentication and session
 * management simpler. The `role` field determines what the user can do
 * and what dashboard they see.
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface IAdminUser extends Document {
  email: string;
  passwordHash: string;
  role: 'admin';
  createdAt: Date;
  updatedAt: Date;
}


const UserSchema: Schema = new Schema(
  {
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['admin'], required: true },
  },
  { timestamps: true }
);

// We check if the model is already registered to avoid Next.js hot-reloading errors
export default mongoose.models.AdminUser || mongoose.model<IAdminUser>('AdminUser', UserSchema);
