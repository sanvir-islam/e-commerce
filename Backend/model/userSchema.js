const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const { Schema } = mongoose;

const userSchema = new Schema(
  {
    firstName: {
      type: String,
      trim: true,
      required: [true, "First name is required"],
      minlength: [2, "First name must be at least 2 characters"],
      maxlength: [50, "First name cannot exceed 50 characters"],
    },
    lastName: {
      type: String,
      trim: true,
      required: [true, "Last name is required"],
      minlength: [2, "First name must be at least 2 characters"],
      maxlength: [50, "First name cannot exceed 50 characters"],
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      required: [true, "Email is required"],
      unique: true,
      match: [/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, "Please provide a valid email address"],
    },
    password: { type: String, required: true, required: [true, "Password is required"], select: false },
    role: { type: String, enum: ["admin", "manager", "staff", "user"], default: "user" },
    verified: { type: Boolean, default: false },

    //otp fields
    otp: { type: String, select: false },
    otpExpiry: { type: Date, select: false },
    lastOtpRequest: { type: Date, select: false },
    otpAttempts: { type: Number, default: 0, select: false },
    lockedUntil: { type: Date, select: false },

    // additional fields
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: Date,
    profileImage: String,
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        delete ret.password;
        delete ret.otp;
        delete ret.otpExpiry;
        delete ret.otpAttempts;
        delete ret.lockedUntil;
        delete ret.lastOtpRequest;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// password hashing middleware
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// custom instance method to compare password
userSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

module.exports = mongoose.model("UserList", userSchema);
