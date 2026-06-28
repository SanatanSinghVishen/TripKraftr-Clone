import { Router } from 'express';
import {
  googleRedirect,
  googleCallback,
  adminLogin,
  getMe,
} from '../controllers/authController.js';

const router = Router();

// Google OAuth for Homestay Owners
router.get('/google', googleRedirect);
router.get('/google/callback', googleCallback);

// Super Admin email/password login
router.post('/admin/login', adminLogin);

// Get current identity (HO or Admin)
router.get('/me', getMe);

export default router;
