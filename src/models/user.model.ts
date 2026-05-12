import mongoose, { Document } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  userType: string;
  phoneNumber: string;
  businessName: string;
  eventCategory: string;
  state: string;
  city: string;
}

const userSchema = new mongoose.Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  userType: { type: String, required: true },
  businessName: { type: String, required: false },
  eventCategory: { type: String, required: false },
  state: { type: String, required: false },
  city: { type: String, required: false },
}, { timestamps: true });

export default mongoose.model<IUser>("users", userSchema);