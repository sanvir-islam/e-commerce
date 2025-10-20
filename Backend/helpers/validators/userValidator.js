const regex = require("../regex");

// Validation rules that can be reused
const rules = {
  name: {
    min: 2,
    max: 50,
    message: (field) => ({
      min: `${field} must be at least ${rules.name.min} characters`,
      max: `${field} cannot exceed ${rules.name.max} characters`,
    }),
  },
  password: {
    min: 8,
    patterns: [
      { regex: /\d/, message: "Password must contain at least one number" },
      { regex: /[A-Z]/, message: "Password must contain at least one uppercase letter" },
      { regex: /[a-z]/, message: "Password must contain at least one lowercase letter" },
      { regex: /[!@#$%^&*]/, message: "Password must contain at least one special character (!@#$%^&*)" },
    ],
  },
};

// Obj contain - core validation functions
const validators = {
  validateName(name, fieldName) {
    if (!name) return `${fieldName} is required`;
    name = name.trim();
    if (name.length < rules.name.min) return rules.name.message(fieldName).min;
    if (name.length > rules.name.max) return rules.name.message(fieldName).max;
    return null;
  },
  validateEmail(email) {
    if (!email) return "Email is required";
    email = email.trim().toLowerCase();
    if (!regex.isValidEmail(email)) return "Invalid email format";
    return null;
  },
  validatePassword(password) {
    if (!password) return "Password is required";
    if (password.length < rules.password.min) return `Password must be at least ${rules.password.min} characters`;

    for (const pattern of rules.password.patterns) {
      if (!pattern.regex.test(password)) return pattern.message;
    }
    return null;
  },
};

// Main validation functions
exports.validateRegistration = (data) => {
  const errors = {};

  // Validate names
  const firstNameError = validators.validateName(data.firstName, "First name");
  if (firstNameError) errors.firstName = firstNameError;

  const lastNameError = validators.validateName(data.lastName, "Last name");
  if (lastNameError) errors.lastName = lastNameError;

  // Validate email
  const emailError = validators.validateEmail(data.email);
  if (emailError) errors.email = emailError;

  // Validate password
  const passwordError = validators.validatePassword(data.password);
  if (passwordError) errors.password = passwordError;

  return {
    errors,
    hasError: Object.keys(errors).length > 0,
    sanitizedData: {
      firstName: data.firstName?.trim(),
      lastName: data.lastName?.trim(),
      email: data.email?.trim().toLowerCase(),
      password: data.password,
    },
  };
};

exports.validateLogin = ({ email, password }) => {
  const errors = {};

  const emailError = validators.validateEmail(email);
  if (emailError) errors.email = emailError;

  if (!password) errors.password = "Password is required";

  return {
    errors,
    hasError: Object.keys(errors).length > 0,
    sanitizedData: {
      email: email?.trim().toLowerCase(),
      password,
    },
  };
};

exports.validateEmail = (email) => {
  const error = validators.validateEmail(email);
  return {
    error,
    hasError: Boolean(error),
    sanitizedEmail: email?.trim().toLowerCase(),
  };
};

exports.validateOTP = (otp) => {
  if (!otp) return { error: "OTP is required", hasError: true };
  otp = otp.trim();
  if (otp.length !== 6 || !/^\d{6}$/.test(otp)) {
    return { error: "OTP must be a 6-digit number", hasError: true };
  }
  return { error: null, hasError: false, sanitizedOTP: otp };
};
