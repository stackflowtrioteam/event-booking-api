import express from 'express';
import { validate, validateAdminToken } from '../middlewares/common';
import adminQuotationsController from '../controllers/adminQuotations.controller';
import {
  adminListQuotationsSchema,
  adminGetQuotationSchema,
  adminDeleteQuotationSchema,
} from '../validation/admin.validation';

const router = express.Router();

// POST /api/admin/quotations/list    — List all quotations (paginated + filters)
router.post('/list',   validateAdminToken, validate(adminListQuotationsSchema),  adminQuotationsController.listQuotations);

// POST /api/admin/quotations/detail  — Single quotation full detail
router.post('/detail', validateAdminToken, validate(adminGetQuotationSchema),    adminQuotationsController.getQuotation);

// POST /api/admin/quotations/delete  — Delete a quotation
router.post('/delete', validateAdminToken, validate(adminDeleteQuotationSchema), adminQuotationsController.deleteQuotation);

export default router;
