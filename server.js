const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config(); // Load environment variables
console.log('MONGO_URI:', process.env.MONGO_URI); // Debugging: Check if MONGO_URI is loaded

const app = express();
const PORT = process.env.PORT || 10000;

const { corsOptions, errorHandler, requestLogger } = require('./middleware/middleware');



// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(requestLogger);

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB connected'))
    .catch((err) => console.log('MongoDB connection error:', err));

// Route
const storiesRoute = require('./routes/stories'); // Ensure this path is correct
app.use('/api/stories', storiesRoute); // Corrected route mounting

// Health Check Endpoint
app.get('/health', async (req, res) => {
    const dbState = mongoose.connection.readyState;
    const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
    res.json({ 
        status: 'ok',
        server: 'running', 
        database: states[dbState] 
      });
});

// 404 Handler
app.use((req, res) => {
    res.status(404).json({ 
      success: false,
      message: `Route ${req.originalUrl} not found`
    });
  });

// Global Error Handler
// app.use((err, req, res, next) => {
//     console.error(err.stack);
//     res.status(500).json({ message: 'Something went wrong!' });
// });

app.use(errorHandler);


// Import Routes
// const likeRoutes = require("./routes/likeRoute");

// Use Routes
// app.use("/api/stories", likeRoutes);

// Start Server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on ${PORT}`);
});
