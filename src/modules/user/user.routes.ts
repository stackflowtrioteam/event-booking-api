import { Router } from 'express';
import user from './user.controller';
const router = Router();

router.post("/login", user.login);
router.post("/fetchUserData", user.fetchUserData);
export default router;