import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../../.env') });

import AdminUser from '../models/AdminUser.js';

async function seedAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const existingAdmin = await AdminUser.findOne({ email: 'admin@availnow.in' });
    if (existingAdmin) {
      console.log('Admin user already exists, skipping seed.');
      await mongoose.disconnect();
      return;
    }

    const passwordHash = await bcrypt.hash('admin123', 12);

    await AdminUser.create({
      email: 'admin@availnow.in',
      passwordHash,
    });

    console.log('Admin user created successfully:');
    console.log('  Email: admin@availnow.in');
    console.log('  Password: admin123');
    console.log('  ⚠️  Change this password immediately in production!');

    await mongoose.disconnect();
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  }
}

seedAdmin();
