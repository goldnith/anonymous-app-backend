const express = require('express');
const router = express.Router();
const Subscriber = require('../models/Subscriber');
const { sendWelcomeEmail } = require('../services/emailService');
const { sendWeeklyDigest } = require('../services/newsletterScheduler');

router.get('/', async (req, res) => {
  try {
    const subscribers = await Subscriber.find({ isActive: true });
    res.json({ success: true, data: subscribers });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch subscribers' });
  }
});

const validateEmail = (req, res, next) => {
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ success: false, message: 'Valid email is required' });
  }
  req.body.email = email;
  next();
};

router.post('/', validateEmail, async (req, res) => {
  try {
    const { email } = req.body;
    let subscriber = await Subscriber.findOne({ email });
    let status = 'new';

    if (subscriber?.isActive) {
      return res.status(200).json({
        success: true,
        message: 'Already subscribed',
        data: { email, status: 'active', welcomeEmailSent: false }
      });
    }

    if (subscriber) {
      subscriber.isActive = true;
      subscriber.dateSubscribed = new Date();
      status = 'reactivated';
    } else {
      subscriber = new Subscriber({ email, isActive: true, dateSubscribed: new Date() });
    }
    await subscriber.save();

    let welcomeEmailSent = false;
    let emailWarning;
    try {
      await sendWelcomeEmail(email);
      welcomeEmailSent = true;
    } catch (emailError) {
      emailWarning = 'Subscription saved, but the welcome email could not be delivered.';
      console.error('Welcome email error:', emailError.message);
    }

    res.status(status === 'new' ? 201 : 200).json({
      success: true,
      message: status === 'new' ? 'Successfully subscribed' : 'Subscription reactivated',
      data: { email, status, welcomeEmailSent },
      warning: emailWarning
    });
  } catch (error) {
    console.error('Subscriber creation error:', error);
    res.status(500).json({ success: false, message: 'Failed to process subscription' });
  }
});

router.delete('/:email', async (req, res) => {
  try {
    const email = decodeURIComponent(req.params.email).trim().toLowerCase();
    const subscriber = await Subscriber.findOne({ email });
    if (!subscriber) {
      return res.status(404).json({ success: false, message: 'Subscriber not found' });
    }
    subscriber.isActive = false;
    await subscriber.save();
    res.json({ success: true, message: 'Successfully unsubscribed' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to remove subscriber' });
  }
});

router.post('/send', async (req, res) => {
  const adminKey = req.get('x-newsletter-key');
  if (!process.env.NEWSLETTER_ADMIN_KEY || adminKey !== process.env.NEWSLETTER_ADMIN_KEY) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  try {
    const stats = await sendWeeklyDigest({ force: true });
    res.json({ success: true, message: 'Newsletter send completed', stats });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Newsletter send failed', error: error.message });
  }
});

module.exports = router;
