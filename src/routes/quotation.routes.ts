/**
 * Quotation Routes
 *
 * Vendor routes  → prefix: /api/web/vendor/quotations
 * Customer routes → prefix: /api/web/customer/quotations
 */

import express from 'express';
import { validateToken, validate } from '../middlewares/common';
import { sendQuotationSchema, updateQuotationStatusSchema } from '../validation/quotation.validation';
import quotationController from '../controllers/quotation.controller';

// ─── Vendor Router ────────────────────────────────────────────────────────────
export const vendorQuotationRouter = express.Router();

// POST /api/web/vendor/quotations — Send a quotation on a lead
vendorQuotationRouter.post(
  '/',
  validateToken,
  validate(sendQuotationSchema),
  quotationController.sendQuotation
);

// GET /api/web/vendor/quotations — List all sent quotations
vendorQuotationRouter.get('/', validateToken, quotationController.listVendorQuotations);

// GET /api/web/vendor/quotations/:id — Single quotation detail
vendorQuotationRouter.get('/:id', validateToken, quotationController.getVendorQuotationById);

// ─── Customer Router ──────────────────────────────────────────────────────────
export const customerQuotationRouter = express.Router();

// GET /api/web/customer/quotations — All quotations across all customer events
customerQuotationRouter.get('/', validateToken, quotationController.listCustomerQuotations);

// GET /api/web/customer/quotations/event/:eventId — Quotations for a specific event
customerQuotationRouter.get(
  '/event/:eventId',
  validateToken,
  quotationController.getCustomerEventQuotations
);

// PATCH /api/web/customer/quotations/:id/status — Accept or reject a quotation
customerQuotationRouter.patch(
  '/:id/status',
  validateToken,
  validate(updateQuotationStatusSchema),
  quotationController.updateQuotationStatus
);
