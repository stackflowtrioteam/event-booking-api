import express from 'express';
import user from '../controllers/adminUsers.controller';
import { validateAdminToken } from '../middlewares/common';
const router = express.Router();

router.post("/login", user.login);
router.post("/fetchUserData", validateAdminToken, user.fetchUserData);
export default router;