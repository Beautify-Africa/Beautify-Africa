// controllers/authPasswordResetController.js
const { Op } = require('sequelize');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');
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
    const emailText = [
      'Reset your Beautify Africa password',
      '',
      'We received a request to reset your password.',
      'Use the link below to set a new password:',
      resetLink,
      '',
      'If you did not request this, you can ignore this email.',
    ].join('\n');

    const emailHtml = `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#292524;max-width:620px;margin:0 auto;"><h2 style="font-size:24px;margin-bottom:16px;">Reset your Beautify Africa password</h2><p style="margin-bottom:12px;">We received a request to reset your password.</p><p style="margin-bottom:18px;">Click the button below to set a new password. This link expires shortly for security reasons.</p><p style="margin:24px 0;"><a href="${resetLink}" style="display:inline-block;background:#1c1917;color:#ffffff;text-decoration:none;padding:12px 18px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;">Reset Password</a></p><p style="font-size:13px;color:#57534e;word-break:break-all;">If the button does not work, copy and paste this link into your browser:<br />${resetLink}</p></div>`;

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
