const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 10000;
const { corsOptions, errorHandler, requestLogger } = require('./middleware/middleware');
const { startNewsletterScheduler } = require('./services/newsletterScheduler');

app.options('*', cors(corsOptions));
app.use(cors(corsOptions));
app.use(express.json());
app.use(requestLogger);

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    startNewsletterScheduler();
  })
  .catch((error) => console.error('MongoDB connection error:', error.message));

app.use('/api/stories', require('./routes/stories'));
app.use('/api/comments', require('./routes/comments'));
app.use('/api/ping', require('./routes/ping'));
app.use('/api/subscribers', require('./routes/subscribers'));
app.use('/api/search', require('./routes/search'));

app.get('/health', (req, res) => {
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  res.json({ status: 'ok', server: 'running', database: states[mongoose.connection.readyState] });
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

app.use(errorHandler);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on ${PORT}`);
});
