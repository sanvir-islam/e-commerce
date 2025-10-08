const regex = require("./regex");

function validatreRegisterInput({ firstName, lastName, email, password }) {
  let errors = {};

  // collect validation errors
  if (!firstName) errors.firstName = "First name is required";
  if (!lastName) errors.lastName = "Last name is required";

  if (!email) errors.email = "Email is required";
  else if (!regex.isValidEmail(email)) errors.email = "Invalid email address";

  if (!password) errors.password = "Password is required";
  else {
    const passError = regex.validatePassword(password);
    if (passError) errors.password = passError;
  }

  return errors;
}

module.exports = validatreRegisterInput;
