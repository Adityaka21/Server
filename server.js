const express = require('express') // Express module included
const cookieParser = require('cookie-parser'); // Cookie parser module included
const cors = require('cors'); // CORS module included

const authRoutes = require('./src/routes/authRoutes'); // Importing auth routes
const linksRoutes = require('./src/routes/linksRoutes'); // Importing links routes


 require('dotenv').config(); // Load environment variables from .env file

 const mongoose = require('mongoose'); 
const app = express(); // instances of express application 
app.use(express.json()); // Middleware to parse JSON bodies
app.use(cookieParser()); // Middleware to parse cookies

const corsOptions = {
    origin: process.env.CLIENT_ENDPOINT, // Allow requests from this origin
    credentials: true, // Allow credentials (cookies, authorization headers, etc.)
}

app.use(cors(corsOptions)); // Use CORS middleware with specified options

app.use('/auth', authRoutes); // Mounting auth routes on /auth path
app.use('/links', linksRoutes); // Mounting links routes on /links path\


mongoose.connect(process.env.MONGO_URI).then(() => console.log('Database connected successfully'))
.catch((error) =>
    console.error('Database connection error:'));

const PORT = 5000; // Port number for the server

app.listen(PORT , (error) => {
    if(error){
        console.error('Error starting the server:', error);
        return;
    }
    else{
    console.log('Server is running on http://localhost:' + PORT);  
    }
});