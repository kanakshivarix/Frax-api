const mongoose = require("mongoose");

const { connectToMongoDB } = require("../src/configs/db.config");
const { ADMIN_EMAIL, ADMIN_PASS, ADMIN_PHONE } = require("../src/configs/env.config");
const { User_Type } = require("../src/constants/app.constant");
const { User } = require("../src/models/index.model");
const { hashPassword } = require("../src/utils/helpers/bcrypt.util");

const seedAdmin = async () => {
  try {
    await connectToMongoDB();
    console.log("✅ MongoDB connected");

    const existingAdmin = await User.findOne({ email: ADMIN_EMAIL });

    if (existingAdmin) {
      console.log("ℹ️ Admin already exists");
      return;
    }

    const hashedPassword = await hashPassword(ADMIN_PASS);

    const admin = new User({
      fullname: "Super Admin",
      email: ADMIN_EMAIL,
      phone: ADMIN_PHONE,
      password: hashedPassword,
      role: User_Type.SUPER_ADMIN,
      isEmailVerified: true,
      isPhoneVerified: true,
      isDisabled: false,
      refreshToken: null,
    });

    await admin.save();
    console.log(`✅ Admin seeded successfully → ${ADMIN_EMAIL}`);
  } catch (err) {
    console.error("❌ Admin seed failed:", err);
  } finally {
    await mongoose.connection.close();
    console.log("🔒 MongoDB connection closed");
  }
};

seedAdmin();
