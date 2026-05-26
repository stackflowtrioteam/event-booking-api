import mongoose, { Document } from "mongoose";

export interface IPortfolio {
  description?: string;
  portfolioImages?: string[];
  startingPrice?: number;
  servicesOffered?: string;
}

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
  isActive: boolean;
  kycStatus: 'pending' | 'approved' | 'rejected';
  kycRemark?: string;
  portfolio?: IPortfolio;
}

const portfolioSchema = new mongoose.Schema(
  {
    description: { type: String },
    portfolioImages: [{ type: String }],
    startingPrice: { type: Number },
    servicesOffered: { type: String },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    userType: { type: String, required: true },
    businessName: { type: String, required: false },
    eventCategory: { type: String, required: false },
    state: { type: String, required: false },
    city: { type: String, required: false },
    isActive: { type: Boolean, default: true },
    kycStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    kycRemark: { type: String },
    portfolio: { type: portfolioSchema, required: false },
  },
  { timestamps: true }
);

export default mongoose.model<IUser>("users", userSchema);