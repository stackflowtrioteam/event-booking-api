/**
 * Message Model
 *
 * Stores chat messages for two contexts:
 *   - 'quotation' context: pre-acceptance negotiation (fixed messages only)
 *   - 'booking' context:  post-acceptance coordination (free-form messages)
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage extends Document {
  contextType: 'quotation' | 'booking';  // which entity this message belongs to
  contextId: mongoose.Types.ObjectId;    // quotationId OR bookingId
  senderId: mongoose.Types.ObjectId;     // ref → users
  receiverId: mongoose.Types.ObjectId;   // ref → users
  message: string;
  isFixed: boolean;                      // true = from approved fixed list (quotation context)
  createdAt: Date;
}

const messageSchema = new Schema<IMessage>(
  {
    contextType: {
      type: String,
      enum: ['quotation', 'booking'],
      required: true,
    },
    contextId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'users',
      required: true,
    },
    receiverId: {
      type: Schema.Types.ObjectId,
      ref: 'users',
      required: true,
    },
    message: {
      type: String,
      required: true,
      maxlength: 2000,
    },
    isFixed: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Index for fast conversation fetches
messageSchema.index({ contextType: 1, contextId: 1, createdAt: 1 });

export default mongoose.model<IMessage>('Message', messageSchema);
