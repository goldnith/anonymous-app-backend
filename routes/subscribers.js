const express = require('express');
const router = express.Router();
const Subscriber = require('../models/Subscriber');
const emailjs = require('@emailjs/nodejs');

// Get all subscribers
router.get('/', async (req, res) => {
  try {
      const subscribers = await Subscriber.find({ isActive: true });
      res.json({
          success: true,
          data: subscribers
      });
  } catch (error) {
      res.status(500).json({
          success: false,
          message: 'Failed to fetch subscribers'
      });
  }
});

// Validation middleware
const validateEmail = (req, res, next) => {
  const { email } = req.body;
  if (!email || typeof email !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'Valid email is required'
    });
  }
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid email format'
    });
  }
  next();
};

// Add new subscriber with validation
router.post('/', validateEmail, async (req, res) => {
  try {
    const { email } = req.body;

    // Check if subscriber exists
    const existingSubscriber = await Subscriber.findOne({ email });
    
    if (existingSubscriber) {
      if (existingSubscriber.isActive) {
        // Already subscribed and active
        return res.status(200).json({
          success: true,
          message: 'Already subscribed',
          data: {
            email: existingSubscriber.email,
            status: 'active'
          }
        });
      } else {
        // Reactivate subscription
        existingSubscriber.isActive = true;
        await existingSubscriber.save();
        return res.status(200).json({
          success: true,
          message: 'Subscription reactivated',
          data: {
            email: existingSubscriber.email,
            status: 'reactivated'
          }
        });
      }
    }

    // Create new subscriber
    const subscriber = new Subscriber({ 
      email,
      isActive: true,
      dateSubscribed: new Date()
    });
    await subscriber.save();

    res.status(201).json({
      success: true,
      message: 'Successfully subscribed',
      data: {
        email: subscriber.email,
        status: 'new'
      }
    });

  } catch (error) {
    console.error('Subscriber creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process subscription',
      error: error.message
    });
  }
});

// Remove subscriber
router.delete('/:email', async (req, res) => {
  try {
      const email = decodeURIComponent(req.params.email);
      const subscriber = await Subscriber.findOne({ email });

      if (!subscriber) {
          return res.status(404).json({
              success: false,
              message: 'Subscriber not found'
          });
      }

      subscriber.isActive = false;
      await subscriber.save();

      res.json({
          success: true,
          message: 'Successfully unsubscribed'
      });
  } catch (error) {
      res.status(500).json({
          success: false,
          message: 'Failed to remove subscriber',
          error: error.message
      });
  }
});

// Send newsletter
router.post('/send', async (req, res) => {
  try {
    const { stories } = req.body;
    if (!stories || !Array.isArray(stories) || stories.length === 0) {
      return res.status(400).json({ message: 'No stories provided' });
    }

    // Get active subscribers
    const subscribers = await Subscriber.find({ isActive: true });
    if (subscribers.length === 0) {
      return res.status(400).json({ message: 'No active subscribers' });
    }

    // Initialize EmailJS
    emailjs.init({
      privateKey: process.env.EMAILJS_PRIVATE_KEY,
      publicKey: process.env.EMAILJS_PUBLIC_KEY
    });

    // Send to each subscriber
    const results = await Promise.allSettled(
      subscribers.map(async (subscriber) => {
        const templateParams = {
          to_email: subscriber.email,
          subject: '🛸 Your Weekly Alien Stories Digest',
          stories: stories
        };

        return emailjs.send(
          process.env.EMAILJS_SERVICE_ID,
          process.env.EMAILJS_TEMPLATE_ID,
          templateParams
        );
      })
    );

    // Count successes and failures
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    res.json({
      message: 'Newsletter sent',
      stats: { successful, failed, total: subscribers.length }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error sending newsletter', error: error.message });
  }
});

module.exports = router;