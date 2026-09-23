// validations/index.js
const authValidation = require('./authValidation');
const productValidation = require('./productValidation');
const orderValidation = require('./orderValidation');
const newsletterValidation = require('./newsletterValidation');
const cartValidation = require('./cartValidation');
const wishlistValidation = require('./wishlistValidation');
const paymentValidation = require('./paymentValidation');
const adminValidation = require('./adminValidation');

module.exports = {
  ...authValidation,
  ...productValidation,
  ...orderValidation,
  ...newsletterValidation,
  ...cartValidation,
  ...wishlistValidation,
  ...paymentValidation,
  ...adminValidation,
};
