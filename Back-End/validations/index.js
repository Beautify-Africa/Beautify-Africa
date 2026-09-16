// validations/index.js
const authValidation = require('./authValidation');
const productValidation = require('./productValidation');
const orderValidation = require('./orderValidation');
const newsletterValidation = require('./newsletterValidation');

module.exports = {
  ...authValidation,
  ...productValidation,
  ...orderValidation,
  ...newsletterValidation,
};
