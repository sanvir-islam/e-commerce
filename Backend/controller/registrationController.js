const emailValidation = require("../helpers/emailValidation");
const userSchema = require("../model/userSchema");
const bcrypt = require("bcrypt");

async function registrationController(req, res) {
  const { firstName, lastName, email, password } = req.body;
  if (!firstName) {
    return res.json({
      message: "firstName is required",
    });
  }
  if (!lastName) {
    return res.status(400).json({
      message: "lastName is required",
    });
  }
  if (!email) {
    return res.status(400).json({
      message: "email is required",
    });
  } else if (!emailValidation(email)) {
    return res.status(400).json({
      message: "Invalid email address",
    });
  }
  if (!password) {
    return res.status(400).json({
      message: "email is required",
    });
  }
  try {
    const existUser = await userSchema.findOne({ email });
    if (existUser) {
      return res.status(400).json({ message: "Email already exist" });
    }

    const hashPassword = await bcrypt.hash(password, 10);

    const user = new userSchema({
      firstName,
      lastName,
      email,
      password: hashPassword,
    });

    await user.save();

    res.status(201).json({
      message: "Registration successfull",
      data: user,
    });
  } catch (err) {
    res.status(500).json({ status: 500, message: "server error" });
  }
}

module.exports = registrationController;
