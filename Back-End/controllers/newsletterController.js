// controllers/newsletterController.js
const Newsletter = require('../models/Newsletter');
const sendEmail = require('../utils/sendEmail');

// @desc    Subscribe to the newsletter
// @route   POST /api/newsletter/subscribe
// @access  Public
const subscribeNewsletter = async (req, res) => {
  const { email } = req.body;

  if (!email || !/\S+@\S+\.\S+/.test(email)) {
    return res.status(400).json({ status: 'error', message: 'Please provide a valid email address.' });
  }

  try {
    const existingSubscription = await Newsletter.findOne({ email: email.toLowerCase() });

    if (existingSubscription) {
      if (!existingSubscription.isActive) {
        existingSubscription.isActive = true;
        await existingSubscription.save();
      }
      return res.status(200).json({ status: 'success', message: 'Already subscribed to the newsletter.' });
    }

    const newSubscriber = await Newsletter.create({ email: email.toLowerCase() });

    // HTML Email Template
    const emailHtml = `
      <div style="font-family: 'Georgia', serif; max-width: 600px; margin: 0 auto; color: #1c1917; padding: 20px; border: 1px solid #e7e5e4;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #451a03; font-size: 28px; font-weight: normal; margin: 0; letter-spacing: 2px;">BEAUTIFY AFRICA</h1>
          <p style="text-transform: uppercase; letter-spacing: 4px; font-size: 10px; color: #78716c; margin-top: 5px;">Skincare Excellence</p>
        </div>
        
        <p style="font-size: 16px; line-height: 1.6; color: #44403c;">Hello,</p>
        
        <p style="font-size: 16px; line-height: 1.6; color: #44403c;">
          Thank you for subscribing to the Beautify Africa newsletter! We are thrilled to welcome you to our community.
        </p>

        <p style="font-size: 16px; line-height: 1.6; color: #44403c;">
          You are now on the exclusive list to receive our latest product launches, skincare secrets, and VIP promotional offers directly in your inbox.
        </p>
        
        <div style="text-align: center; margin: 40px 0;">
          <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/shop" style="background-color: #1c1917; color: #ffffff; padding: 14px 30px; text-decoration: none; text-transform: uppercase; letter-spacing: 2px; font-size: 12px; font-weight: bold; display: inline-block;">
            Shop Collection
          </a>
        </div>
        
        <p style="font-size: 14px; color: #78716c; border-top: 1px solid #e7e5e4; padding-top: 20px; text-align: center;">
          Always authentically African.
        </p>
      </div>
    `;

    // Attempt to send email
    try {
      await sendEmail({
        email: newSubscriber.email,
        subject: 'Welcome to the Beautify Africa Newsletter',
        html: emailHtml,
      });
    } catch (emailError) {
      console.error('Email dispatch failed:', emailError);
      // We still return success since the database record successfully captured the email
      return res.status(201).json({ 
        status: 'success', 
        message: 'Successfully subscribed (Email currently offline).' 
      });
    }

    res.status(201).json({ status: 'success', message: 'Successfully subscribed. Welcome email sent!' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message || 'Server error' });
  }
};

module.exports = { subscribeNewsletter };
