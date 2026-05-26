/**
 * Event Categories Model
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface IEventCategory extends Document {
    name: string;
    slug: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}


const EventCategorySchema: Schema = new Schema(
    {
        name: { type: String, required: true },
        slug: { type: String, required: true },
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

export default mongoose.models.EventCategory || mongoose.model<IEventCategory>('EventCategory', EventCategorySchema);
