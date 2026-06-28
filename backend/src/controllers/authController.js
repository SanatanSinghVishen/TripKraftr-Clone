import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import User from '../models/User.js';
import AdminUser from '../models/AdminUser.js';

const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_CALLBACK_URL
);

/**
 * Generate a JWT for an authenticated user.
 */
function signToken(userId, role) {
  return jwt.sign({ userId, role }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
}

/**
 * GET /auth/google
 * Redirect the user to Google's OAuth 2.0 consent screen.
 */
export const googleRedirect = (req, res) => {
  const authorizeUrl = googleClient.generateAuthUrl({
    access_type: 'offline',
    scope: ['openid', 'profile', 'email'],
    prompt: 'consent',
  });
  res.redirect(authorizeUrl);
};

/**
 * GET /auth/google/callback
 * Exchange the auth code for tokens, create/find user, issue JWT.
 */
export const googleCallback = async (req, res) => {
  try {
    const { code } = req.query;
    if (!code) {
      return res.status(400).json({ error: 'Missing authorization code' });
    }

    const { tokens } = await googleClient.getToken(code);
    const ticket = await googleClient.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub: googleId, name, email } = payload;

    // Find or create user
    let user = await User.findOne({ googleId });
    if (!user) {
      user = await User.create({ googleId, name, email });
    }

    const token = signToken(user._id, 'owner');

    // Set JWT as httpOnly cookie and redirect to frontend dashboard
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Also send token as query param for frontend to store (useful for cross-origin)
    const frontendOrigin = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';
    res.redirect(`${frontendOrigin}/auth/callback?token=${token}`);
  } catch (err) {
    console.error('Google OAuth callback error:', err);
    const frontendOrigin = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';
    res.redirect(`${frontendOrigin}/auth/callback?error=auth_failed`);
  }
};

/**
 * POST /auth/admin/login
 * Authenticate super admin with email + password, return JWT.
 */
export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const admin = await AdminUser.findOne({ email: email.toLowerCase() });
    if (!admin) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = signToken(admin._id, 'admin');
    res.json({ token, admin: { email: admin.email } });
  } catch (err) {
    console.error('Admin login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * GET /auth/me
 * Return the current authenticated user's identity.
 */
export const getMe = async (req, res) => {
  try {
    let token = null;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }
    if (!token && req.cookies) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role === 'owner') {
      const user = await User.findById(decoded.userId).select('-__v');
      if (!user) return res.status(401).json({ error: 'User not found' });
      return res.json({ role: 'owner', user });
    }

    if (decoded.role === 'admin') {
      const admin = await AdminUser.findById(decoded.userId).select('email');
      if (!admin) return res.status(401).json({ error: 'Admin not found' });
      return res.json({ role: 'admin', user: admin });
    }

    return res.status(401).json({ error: 'Invalid token role' });
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};
