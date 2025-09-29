const mongoose = require("mongoose");
const { Schema } = mongoose;

const userSchema = new Schema(
  {
    firstName: { type: String, trim: true, required: true },
    lastName: { type: String, trim: true, required: true },
    email: { type: String, trim: true, required: true, unique: true },
    password: { type: String, required: true },
    otp: { type: String },
    otpExpiry: Date,
    lastOtpRequest: Date,
    otpAttempts: { type: Number, default: 0 },
    lockedUntil: Date,
    verified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("UserList", userSchema);
