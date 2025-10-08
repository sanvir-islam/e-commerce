const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const { Schema } = mongoose;

const userSchema = new Schema(
  {
    firstName: { type: String, trim: true, required: [true, "First name is required"] },
    lastName: { type: String, trim: true, required: [true, "Last name is required"] },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      required: [true, "Email is required"],
      unique: true,
      match: [/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, "Please provide a valid email address"],
    },
    password: { type: String, required: true, required: [true, "Password is required"], select: false }, //select false => password will not be returned in queries by default
    verified: { type: Boolean, default: false },
    role: { type: String, enum: ["user", "staff", "admin", "super-admin"], default: "user" },
    otp: { type: String },
    otpExpiry: Date,
    lastOtpRequest: Date,
    otpAttempts: { type: Number, default: 0 },
    lockedUntil: Date,
  },
  { timestamps: true }
);

// password hashing middleware
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// create index on email
userSchema.index({ email: 1 });

// custom instance method to compare password
userSchema.method.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

module.exports = mongoose.model("UserList", userSchema);
