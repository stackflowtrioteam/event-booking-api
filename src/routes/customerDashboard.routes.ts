/**
 * Customer Dashboard Route
 * Base path: /api/web/customer/dashboard
 *
 * GET /  → getDashboard — stats + recent activity for logged-in customer
 */

import express from 'express';
import { validateToken } from '../middlewares/common';
import customerDashboardController from '../controllers/customerDashboard.controller';

const router = express.Router();

// GET /api/web/customer/dashboard
router.get('/', validateToken, customerDashboardController.getDashboard);

export default router;
