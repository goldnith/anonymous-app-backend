const Story = require('../models/Story');
const Subscriber = require('../models/Subscriber');
const NewsletterState = require('../models/NewsletterState');
const { getMissingEmailConfig, sendDigestEmail } = require('./emailService');

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const RETRY_MS = 24 * 60 * 60 * 1000;
const CHECK_INTERVAL_MS = 60 * 60 * 1000;
let running = false;

const firstScheduledDate = () => {
  const next = new Date();
  next.setUTCHours(3, 0, 0, 0);
  const daysUntilSunday = (7 - next.getUTCDay()) % 7;
  next.setUTCDate(next.getUTCDate() + daysUntilSunday);
  if (next <= new Date()) next.setUTCDate(next.getUTCDate() + 7);
  return next;
};

const getState = () => NewsletterState.findOneAndUpdate(
  { key: 'weekly-digest' },
  { $setOnInsert: { nextSendAt: firstScheduledDate(), lastStatus: 'pending' } },
  { new: true, upsert: true, setDefaultsOnInsert: true }
);

const getDigestStories = async () => {
  const recentCutoff = new Date(Date.now() - WEEK_MS);
  let stories = await Story.find({ createdAt: { $gte: recentCutoff } })
    .sort({ likeCount: -1, createdAt: -1 })
    .limit(3)
    .lean();

  if (!stories.length) {
    stories = await Story.find({}).sort({ createdAt: -1 }).limit(3).lean();
  }
  return stories;
};

const sendWeeklyDigest = async ({ force = false } = {}) => {
  if (running) return { skipped: true, reason: 'already_running' };
  running = true;

  try {
    const missing = getMissingEmailConfig();
    if (missing.length) throw new Error(`Missing email configuration: ${missing.join(', ')}`);

    const state = await getState();
    if (!force && state.nextSendAt > new Date()) {
      return { skipped: true, reason: 'not_due', nextSendAt: state.nextSendAt };
    }

    state.lastAttemptAt = new Date();
    const [subscribers, stories] = await Promise.all([
      Subscriber.find({ isActive: true }).lean(),
      getDigestStories()
    ]);

    if (!subscribers.length || !stories.length) {
      state.lastStatus = 'sent';
      state.lastSentAt = new Date();
      state.nextSendAt = new Date(Date.now() + WEEK_MS);
      state.lastStats = { successful: 0, failed: 0, total: subscribers.length };
      state.lastError = undefined;
      await state.save();
      return { successful: 0, failed: 0, total: subscribers.length };
    }

    let successful = 0;
    let failed = 0;
    const errors = [];

    for (const subscriber of subscribers) {
      try {
        await sendDigestEmail(subscriber.email, stories);
        successful += 1;
      } catch (error) {
        failed += 1;
        errors.push(`${subscriber.email}: ${error.message}`);
      }
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    state.lastStatus = failed === 0 ? 'sent' : successful > 0 ? 'partial' : 'failed';
    state.lastStats = { successful, failed, total: subscribers.length };
    state.lastError = errors.slice(0, 5).join(' | ') || undefined;
    if (successful > 0) state.lastSentAt = new Date();
    state.nextSendAt = new Date(Date.now() + (successful > 0 ? WEEK_MS : RETRY_MS));
    await state.save();

    if (!successful) throw new Error(state.lastError || 'All newsletter deliveries failed');
    return { successful, failed, total: subscribers.length, nextSendAt: state.nextSendAt };
  } finally {
    running = false;
  }
};

const startNewsletterScheduler = () => {
  const check = () => sendWeeklyDigest().catch((error) => {
    console.error('Weekly newsletter error:', error.message);
  });
  setTimeout(check, 10_000);
  const timer = setInterval(check, CHECK_INTERVAL_MS);
  if (timer.unref) timer.unref();
};

module.exports = { sendWeeklyDigest, startNewsletterScheduler };
