const emailjs = require('@emailjs/nodejs');

const requiredEmailEnv = [
  'EMAILJS_SERVICE_ID',
  'EMAILJS_TEMPLATE_ID',
  'EMAILJS_PUBLIC_KEY',
  'EMAILJS_PRIVATE_KEY'
];

const getMissingEmailConfig = () => requiredEmailEnv.filter((key) => !process.env[key]);

const assertEmailConfigured = () => {
  const missing = getMissingEmailConfig();
  if (missing.length) {
    throw new Error(`Email service is not configured. Missing: ${missing.join(', ')}`);
  }
};

const escapeHtml = (value = '') => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

const sendEmail = async (templateParams) => {
  assertEmailConfigured();
  return emailjs.send(
    process.env.EMAILJS_SERVICE_ID,
    process.env.EMAILJS_TEMPLATE_ID,
    templateParams,
    {
      publicKey: process.env.EMAILJS_PUBLIC_KEY,
      privateKey: process.env.EMAILJS_PRIVATE_KEY
    }
  );
};

const unsubscribeUrl = (email) => {
  const frontendUrl = (process.env.FRONTEND_URL || 'https://alien-stories.vercel.app').replace(/\/$/, '');
  return `${frontendUrl}/unsubscribe?email=${encodeURIComponent(email)}`;
};

const sendWelcomeEmail = (email) => sendEmail({
  to_email: email,
  subject: 'Welcome to the Alien Stories community 👽',
  head_message: 'Greetings from Alien Stories! 👽',
  message_html: `
    <div style="max-width:600px;margin:auto;padding:24px;background:#000;color:#fff;font-family:Arial,sans-serif;border:1px solid #00ffcc;border-radius:12px">
      <h2 style="color:#00ffcc">Welcome, fellow earthling! 🛸</h2>
      <p>Thanks for subscribing. You will receive a weekly digest of stories from our anonymous community.</p>
      <p style="margin-top:24px"><a href="${unsubscribeUrl(email)}" style="color:#00ffcc">Unsubscribe</a></p>
    </div>`
});

const buildDigestHtml = (stories, email) => {
  const cards = stories.map((story) => {
    const text = story.story || story.content || '';
    const excerpt = text.length > 180 ? `${text.slice(0, 180)}…` : text;
    return `
      <div style="margin:18px 0;padding:16px;border:1px solid #00ffcc;border-radius:8px">
        <h3 style="margin-top:0;color:#00ffcc">${escapeHtml(story.title)}</h3>
        <p>${escapeHtml(excerpt)}</p>
        <small>👽 ${Number(story.likeCount) || 0} likes</small>
      </div>`;
  }).join('');

  return `
    <div style="max-width:600px;margin:auto;padding:24px;background:#000;color:#fff;font-family:Arial,sans-serif;border:1px solid #00ffcc;border-radius:12px">
      <h2 style="color:#00ffcc">Your Weekly Alien Stories Digest 🛸</h2>
      ${cards}
      <p style="margin-top:24px;color:#00ffcc">Stay weird, stay anonymous! 👽</p>
      <p><a href="${unsubscribeUrl(email)}" style="color:#00ffcc">Unsubscribe</a></p>
    </div>`;
};

const sendDigestEmail = (email, stories) => sendEmail({
  to_email: email,
  subject: '🛸 Your Weekly Alien Stories Digest',
  head_message: 'Greetings Earthling!',
  stories: stories.map((story) => ({
    title: story.title,
    excerpt: (story.story || story.content || '').slice(0, 180),
    likes: Number(story.likeCount) || 0
  })),
  message_html: buildDigestHtml(stories, email)
});

module.exports = {
  getMissingEmailConfig,
  sendWelcomeEmail,
  sendDigestEmail
};
