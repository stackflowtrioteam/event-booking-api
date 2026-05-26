/**
 * Cities Model
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface ICity extends Document {
    name: string;
    slug: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}


const CitySchema: Schema = new Schema(
    {
        name: { type: String, required: true },
        slug: { type: String, required: true },
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

export default mongoose.models.City || mongoose.model<ICity>('City', CitySchema);
