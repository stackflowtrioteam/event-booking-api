/**
 * Message Routes
 *
 * Prefix: /api/web/messages
 *
 * GET  /fixed                     → Get list of allowed fixed messages (quotation context)
 * GET  /:contextType/:contextId   → Get conversation messages
 * POST /                          → Send a message
 */

import express from 'express';
import { validateToken } from '../middlewares/common';
import messageController from '../controllers/message.controller';

const messageRouter = express.Router();

// GET /api/web/messages/fixed — Allowed template messages for pre-acceptance chat
messageRouter.get('/fixed', validateToken, messageController.getFixedMessages);

// GET /api/web/messages/:contextType/:contextId — Fetch conversation thread
messageRouter.get('/:contextType/:contextId', validateToken, messageController.getMessages);

// POST /api/web/messages — Send a message
messageRouter.post('/', validateToken, messageController.sendMessage);

export default messageRouter;
