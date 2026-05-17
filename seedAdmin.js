import mongoose from "mongoose";
import bcrypt from "bcrypt";

const MONGO_URI = "mongodb://127.0.0.1:27017/event_management";

const seedAdmin = async () => {
  try {
    await mongoose.connect(MONGO_URI);

    const password = "admin123";

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    const AdminUser = mongoose.model(
      "AdminUser",
      new mongoose.Schema(
        {
          email: String,
          passwordHash: String,
          role: String,
        },
        { timestamps: true }
      )
    );

    const admin = await AdminUser.create({
      email: "admin@management.com",
      passwordHash,
      role: "admin",
    });

    console.log("✅ Admin created:");
    console.log({
      email: admin.email,
      password: password,
      role: admin.role,
    });

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
};

seedAdmin();