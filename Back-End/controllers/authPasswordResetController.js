// controllers/authPasswordResetController.js
const { Op } = require('sequelize');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');
const { generatePasswordResetEmail } = require('../services/emailTemplates');
const {
  normalizeEmail,
  hashPasswordResetToken,
  createPasswordResetTokenPayload,
  buildPasswordResetLink,
  validatePasswordStrength,
  getAuthErrorResponse,
} = require('../services/authService');

const PASSWORD_RESET_SUCCESS_MESSAGE =
  'If an account with that email exists, we have sent password reset instructions.';

function handleAuthError(res, error) {
  const { statusCode, message } = getAuthErrorResponse(error);
  return res.status(statusCode).json({ status: 'error', message });
}

async function forgotPassword(req, res) {
  try {
    const normalizedEmail = normalizeEmail(req.body?.email || '');
    if (!normalizedEmail) {
      return res.status(400).json({ status: 'error', message: 'Email is required' });
    }

    const user = await User.findOne({ where: { email: normalizedEmail } });
    if (!user) {
      return res.status(200).json({ status: 'success', message: PASSWORD_RESET_SUCCESS_MESSAGE });
    }

    const { rawToken, hashedToken, expiresAt } = createPasswordResetTokenPayload();
    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = expiresAt;
    await user.save();

    const resetLink = buildPasswordResetLink(rawToken);

    // Luxury HTML Email Template
    const { html: emailHtml, text: emailText } = generatePasswordResetEmail({
      resetLink,
      clientUrl: process.env.PASSWORD_RESET_URL_BASE || process.env.CLIENT_URL,
      email: user.email,
    });

    try {
      await sendEmail({
        email: user.email,
        subject: 'Beautify Africa Password Reset',
        text: emailText,
        html: emailHtml,
      });
    } catch (emailError) {
      user.passwordResetToken = null;
      user.passwordResetExpires = null;
      await user.save();
      return res.status(500).json({
        status: 'error',
        message: 'Unable to deliver password reset email right now. Please try again shortly.',
      });
    }

    return res.status(200).json({ status: 'success', message: PASSWORD_RESET_SUCCESS_MESSAGE });
  } catch (error) {
    return handleAuthError(res, error);
  }
}

async function resetPassword(req, res) {
  try {
    const token = String(req.body?.token || '').trim();
    const password = String(req.body?.password || '');
    if (!token || !password) {
      return res
        .status(400)
        .json({ status: 'error', message: 'Reset token and new password are required' });
    }

    const passwordCheck = validatePasswordStrength(password);
    if (!passwordCheck.isValid) {
      return res.status(400).json({ status: 'error', message: passwordCheck.message });
    }

    const hashedToken = hashPasswordResetToken(token);
    const user = await User.findOne({
      where: { passwordResetToken: hashedToken, passwordResetExpires: { [Op.gt]: new Date() } },
    });
    if (!user) {
      return res
        .status(400)
        .json({ status: 'error', message: 'Password reset token is invalid or has expired' });
    }

    user.password = password;
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    if (typeof user.recordSuccessfulLogin === 'function') {
      await user.recordSuccessfulLogin();
    }
    await user.save();

    return res.status(200).json({
      status: 'success',
      message: 'Password reset successful. You can now sign in with your new password.',
    });
  } catch (error) {
    return handleAuthError(res, error);
  }
}

module.exports = {
  PASSWORD_RESET_SUCCESS_MESSAGE,
  forgotPassword,
  resetPassword,
};
