const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');
const {
  normalizeEmail,
  getPrimaryConfiguredAdminEmail,
  getConfiguredAdminDashboardPassword,
  isConfiguredAdminDashboardCredential,
  hashPasswordResetToken,
  createPasswordResetTokenPayload,
  buildPasswordResetLink,
  sanitizeUser,
  signToken,
  getAuthErrorResponse,
} = require('../services/authService');

const PASSWORD_RESET_SUCCESS_MESSAGE =
  'If an account with that email exists, we have sent password reset instructions.';

function handleAuthError(res, error) {
  const { statusCode, message } = getAuthErrorResponse(error);

  return res.status(statusCode).json({
    status: 'error',
    message,
  });
}

async function register(req, res) {
  try {
    const { name, email, password } = req.body;
    const normalizedEmail = normalizeEmail(email || '');

    if (!name || !email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Name, email, and password are required',
      });
    }

    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({
        status: 'error',
        message: 'Email is already registered',
      });
    }

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
    });

    const token = signToken(user._id);

    return res.status(201).json({
      status: 'success',
      token,
      user: sanitizeUser(user),
    });
  } catch (error) {
    return handleAuthError(res, error);
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;
    const normalizedEmail = normalizeEmail(email || '');

    if (!email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Email and password are required',
      });
    }

    const user = await User.findOne({ email: normalizedEmail }).select('+password');

    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid credentials',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid credentials',
      });
    }

    const token = signToken(user._id);

    return res.status(200).json({
      status: 'success',
      token,
      user: sanitizeUser(user),
    });
  } catch (error) {
    return handleAuthError(res, error);
  }
}

async function adminDashboardLogin(req, res) {
  try {
    const { email, password } = req.body;
    const normalizedEmail = normalizeEmail(email || '');

    if (!email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Email and password are required',
      });
    }

    const configuredEmail = getPrimaryConfiguredAdminEmail();
    const configuredPassword = getConfiguredAdminDashboardPassword();

    if (!configuredEmail || !configuredPassword) {
      return res.status(503).json({
        status: 'error',
        message: 'Admin dashboard credentials are not configured on the server.',
      });
    }

    if (!isConfiguredAdminDashboardCredential(normalizedEmail, password)) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid admin dashboard credentials',
      });
    }

    let user = await User.findOne({ email: normalizedEmail }).select('+password');

    if (!user) {
      user = await User.create({
        name: 'Admin User',
        email: normalizedEmail,
        password,
        isAdmin: true,
      });
    } else {
      let requiresSave = false;

      if (!user.isAdmin) {
        user.isAdmin = true;
        requiresSave = true;
      }

      const matchesConfiguredPassword = await user.comparePassword(password);
      if (!matchesConfiguredPassword) {
        user.password = password;
        requiresSave = true;
      }

      if (requiresSave) {
        await user.save();
      }
    }

    const token = signToken(user._id);
    const sanitized = sanitizeUser(user);

    return res.status(200).json({
      status: 'success',
      token,
      user: sanitized,
    });
  } catch (error) {
    return handleAuthError(res, error);
  }
}

async function forgotPassword(req, res) {
  try {
    const normalizedEmail = normalizeEmail(req.body?.email || '');

    if (!normalizedEmail) {
      return res.status(400).json({
        status: 'error',
        message: 'Email is required',
      });
    }

    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(200).json({
        status: 'success',
        message: PASSWORD_RESET_SUCCESS_MESSAGE,
      });
    }

    const { rawToken, hashedToken, expiresAt } = createPasswordResetTokenPayload();
    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = expiresAt;
    await user.save({ validateBeforeSave: false });

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
    const emailHtml = `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#292524;max-width:620px;margin:0 auto;">
        <h2 style="font-size:24px;margin-bottom:16px;">Reset your Beautify Africa password</h2>
        <p style="margin-bottom:12px;">We received a request to reset your password.</p>
        <p style="margin-bottom:18px;">Click the button below to set a new password. This link expires shortly for security reasons.</p>
        <p style="margin:24px 0;">
          <a href="${resetLink}" style="display:inline-block;background:#1c1917;color:#ffffff;text-decoration:none;padding:12px 18px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;">Reset Password</a>
        </p>
        <p style="font-size:13px;color:#57534e;word-break:break-all;">If the button does not work, copy and paste this link into your browser:<br />${resetLink}</p>
      </div>
    `;

    try {
      await sendEmail({
        email: user.email,
        subject: 'Beautify Africa Password Reset',
        text: emailText,
        html: emailHtml,
      });
    } catch (emailError) {
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });

      return res.status(500).json({
        status: 'error',
        message: 'Unable to deliver password reset email right now. Please try again shortly.',
      });
    }

    return res.status(200).json({
      status: 'success',
      message: PASSWORD_RESET_SUCCESS_MESSAGE,
    });
  } catch (error) {
    return handleAuthError(res, error);
  }
}

async function resetPassword(req, res) {
  try {
    const token = String(req.body?.token || '').trim();
    const password = String(req.body?.password || '');

    if (!token || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Reset token and new password are required',
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        status: 'error',
        message: 'Password must be at least 8 characters',
      });
    }

    const hashedToken = hashPasswordResetToken(token);
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({
        status: 'error',
        message: 'Password reset token is invalid or has expired',
      });
    }

    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    return res.status(200).json({
      status: 'success',
      message: 'Password reset successful. You can now sign in with your new password.',
    });
  } catch (error) {
    return handleAuthError(res, error);
  }
}

async function me(req, res) {
  return res.status(200).json({
    status: 'success',
    user: sanitizeUser(req.user),
  });
}

async function updateUserProfile(req, res) {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.name = req.body.name || user.name;
      const normalizedEmail = normalizeEmail(req.body.email || '');
      
      // Check if email changed and if it already exists in another user
      if (req.body.email && normalizedEmail !== req.user.email) {
        const existingEmail = await User.findOne({ email: normalizedEmail });
        if (existingEmail) {
           return res.status(409).json({ status: 'error', message: 'Email is already taken by another account.' });
        }
        user.email = normalizedEmail;
      }

      if (req.body.password) {
        user.password = req.body.password;
      }

      const updatedUser = await user.save();

      return res.status(200).json({
        status: 'success',
        user: sanitizeUser(updatedUser),
      });
    } else {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }
  } catch (error) {
    return handleAuthError(res, error);
  }
}

module.exports = {
  register,
  login,
  adminDashboardLogin,
  forgotPassword,
  resetPassword,
  me,
  updateUserProfile,
};
