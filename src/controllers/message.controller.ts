/**
 * Message Controller
 *
 * Handles chat messages for two contexts:
 *
 * 1. 'quotation' context (pre-acceptance negotiation):
 *    - ONLY fixed/template messages are allowed (server-enforced whitelist)
 *    - Prevents vendors and customers from sharing contact details off-platform
 *
 * 2. 'booking' context (post-acceptance coordination):
 *    - Free-form messages allowed (max 2000 chars)
 *    - For discussing event progress, logistics, etc.
 *
 * Routes (prefix: /api/web/messages):
 *   GET  /fixed                        → getFixedMessages      — list of allowed template messages
 *   GET  /:contextType/:contextId      → getMessages           — fetch conversation thread
 *   POST /                             → sendMessage           — send a message
 */

import { Response } from 'express';
import mongoose from 'mongoose';
import Message from '../models/message.model';
import Quotation from '../models/quotation.model';
import Booking from '../models/booking.model';

// ─── Approved fixed messages (pre-acceptance quotation chat) ─────────────────
// These are the ONLY messages allowed when contextType === 'quotation'.
// Server validates against this list — cannot be bypassed via API.
export const FIXED_MESSAGES = [
  'Can you share more details about your services?',
  'Is there any flexibility on the quoted price?',
  'What is included in this package?',
  'Can we schedule a call to discuss further?',
  'Please share your portfolio or past work.',
  'What is your cancellation policy?',
  'I am interested, will confirm soon.',
  'Thank you for your quotation.',
];

/**
 * Helper — verifies that the requesting user is a participant
 * in the given context (quotation or booking).
 * Returns { customerId, vendorId } on success, or null on failure.
 */
async function getParticipants(
  contextType: string,
  contextId: string,
  userId: string
): Promise<{ customerId: string; vendorId: string } | null> {
  if (contextType === 'quotation') {
    const quotation = await Quotation.findById(contextId).populate('eventId');
    console.log('[DEBUG getParticipants] quotation found:', !!quotation);
    if (!quotation) return null;
    const event = quotation.eventId as any;
    console.log('[DEBUG getParticipants] event (populated):', event);
    const customerId = event?.customerId?.toString();
    const vendorId = quotation.vendorId.toString();
    console.log('[DEBUG getParticipants] customerId:', customerId, '| vendorId:', vendorId, '| requestingUserId:', userId);
    if (userId !== customerId && userId !== vendorId) return null;
    return { customerId, vendorId };
  }

  if (contextType === 'booking') {
    const booking = await Booking.findById(contextId);
    console.log('[DEBUG getParticipants] booking found:', !!booking);
    if (!booking) return null;
    const customerId = booking.customerId.toString();
    const vendorId = booking.vendorId.toString();
    console.log('[DEBUG getParticipants] customerId:', customerId, '| vendorId:', vendorId, '| requestingUserId:', userId);
    if (userId !== customerId && userId !== vendorId) return null;
    return { customerId, vendorId };
  }

  return null;
}

const messageController = {
  /**
   * GET /api/web/messages/fixed
   * Returns the list of allowed template messages for quotation-context chats.
   * Public to authenticated users (no context validation needed).
   */
  getFixedMessages: async (_req: any, res: Response) => {
    return res.json({ fixedMessages: FIXED_MESSAGES });
  },

  /**
   * GET /api/web/messages/:contextType/:contextId
   *
   * Fetches all messages in a conversation thread.
   * contextType: 'quotation' | 'booking'
   * contextId: ObjectId of the quotation or booking
   *
   * Validates the requesting user is a participant before returning messages.
   */
  getMessages: async (req: any, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ message: 'Unauthorized' });

      const { contextType, contextId } = req.params;

      if (!['quotation', 'booking'].includes(contextType)) {
        return res.status(400).json({ message: 'contextType must be "quotation" or "booking"' });
      }

      if (!mongoose.Types.ObjectId.isValid(contextId)) {
        return res.status(400).json({ message: 'Invalid contextId' });
      }

      const participants = await getParticipants(contextType, contextId, userId);
      if (!participants) {
        return res.status(403).json({ message: 'Access denied or context not found' });
      }

      const { page = 1, limit = 50 } = req.query;
      const pageNum = Math.max(1, parseInt(page as string, 10));
      const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10)));
      const skip = (pageNum - 1) * limitNum;

      const [messages, total] = await Promise.all([
        Message.find({ contextType, contextId })
          .sort({ createdAt: 1 }) // oldest first (chat order)
          .skip(skip)
          .limit(limitNum)
          .populate('senderId', 'name businessName userType')
          .populate('receiverId', 'name businessName userType'),
        Message.countDocuments({ contextType, contextId }),
      ]);

      return res.json({
        messages,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum),
        },
        contextType,
        contextId,
        myId: userId,
      });
    } catch (error) {
      console.error('getMessages error:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  },

  /**
   * POST /api/web/messages
   *
   * Sends a message in a conversation thread.
   * Body: { contextType, contextId, message }
   *
   * Rules:
   *   - contextType === 'quotation' → message MUST be from FIXED_MESSAGES list
   *   - contextType === 'booking'   → any text allowed (max 2000 chars)
   *   - Sender must be a participant (customer or vendor) in the context
   */
  sendMessage: async (req: any, res: Response) => {
    try {
      const senderId = req.user?.id;
      if (!senderId) return res.status(401).json({ message: 'Unauthorized' });

      const { contextType, contextId, message } = req.body;

      if (!contextType || !contextId || !message) {
        return res.status(400).json({ message: 'contextType, contextId, and message are required' });
      }

      if (!['quotation', 'booking'].includes(contextType)) {
        return res.status(400).json({ message: 'contextType must be "quotation" or "booking"' });
      }

      if (!mongoose.Types.ObjectId.isValid(contextId)) {
        return res.status(400).json({ message: 'Invalid contextId' });
      }

      if (typeof message !== 'string' || message.trim().length === 0) {
        return res.status(400).json({ message: 'message must be a non-empty string' });
      }

      if (message.length > 2000) {
        return res.status(400).json({ message: 'message must not exceed 2000 characters' });
      }

      // ── Validate participant access ──
      const participants = await getParticipants(contextType, contextId, senderId);
      if (!participants) {
        return res.status(403).json({ message: 'Access denied or context not found' });
      }

      // ── Enforce fixed messages for quotation context ──
      let isFixed = false;
      if (contextType === 'quotation') {
        if (!FIXED_MESSAGES.includes(message.trim())) {
          return res.status(400).json({
            message:
              'Only pre-approved messages are allowed before a quotation is accepted. Use GET /api/web/messages/fixed to see allowed messages.',
            allowedMessages: FIXED_MESSAGES,
          });
        }
        isFixed = true;
      }

      // ── Determine receiver (the other participant) ──
      const receiverId =
        senderId === participants.customerId
          ? participants.vendorId
          : participants.customerId;

      const savedMessage = await Message.create({
        contextType,
        contextId,
        senderId,
        receiverId,
        message: message.trim(),
        isFixed,
      });

      const populated = await Message.findById(savedMessage._id)
        .populate('senderId', 'name businessName userType')
        .populate('receiverId', 'name businessName userType');

      return res.status(201).json({
        message: 'Message sent successfully',
        data: populated,
      });
    } catch (error) {
      console.error('sendMessage error:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  },
};

export default messageController;
