require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const mongoose = require('mongoose');

const authRoutes = require('./src/routes/authRoutes');
const linksRoutes = require('./src/routes/linksRoutes');
const userRoutes = require('./src/routes/userRoutes');
const paymentRoutes = require('./src/routes/paymentRoutes');

const app = express();

// ✅ Parse raw body for Razorpay webhook route
app.use('/payments/webhook', express.raw({ type: 'application/json' }));

// ✅ Parse JSON body for all other routes
app.use(express.json());
app.use(cookieParser());

const corsOptions = {
    origin: process.env.CLIENT_ENDPOINT,
    credentials: true,
};

app.use(cors(corsOptions));

// ✅ Mount routes
app.use('/auth', authRoutes);
app.use('/links', linksRoutes);
app.use('/users', userRoutes);
app.use('/payments', paymentRoutes);

// ✅ Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('Database connected successfully'))
    .catch((error) => console.error('Database connection error:', error));

const PORT = 5000;

app.listen(PORT, (error) => {
    if (error) {
        console.error('Error starting the server:', error);
        return;
    }
    console.log('Server is running on http://localhost:' + PORT);
});
