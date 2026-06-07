const User = require('../models/User');

const seedAdmin = async () => {
  try {
    const email    = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;

    if (!email || !password) {
      console.log('[Seeder] ADMIN_EMAIL or ADMIN_PASSWORD not set in .env — skipping admin seed.');
      return;
    }

    const exists = await User.findOne({ email });
    if (exists) {
      // Make sure the existing account is actually admin role
      if (exists.role !== 'admin') {
        exists.role = 'admin';
        await exists.save();
        console.log(`[Seeder] Updated ${email} to admin role.`);
      } else {
        console.log(`[Seeder] Admin account already exists: ${email}`);
      }
      return;
    }

    await User.create({
      name:     'Admin',
      email,
      password,
      role:     'admin',
      isVerified: true,
    });

    console.log(`[Seeder] ✅ Admin account created: ${email}`);
  } catch (err) {
    console.error('[Seeder] Failed to seed admin:', err.message);
  }
};

module.exports = seedAdmin;