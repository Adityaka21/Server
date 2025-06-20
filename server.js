const express = require('express') // Express module included

const cookieParser = require('cookie-parser'); // Cookie parser module included

const app = express(); // instances of express application 

const authRoutes = require('./src/routes/authRoutes'); // Importing auth routes

app.use(express.json()); // Middleware to parse JSON bodies

app.use(cookieParser()); // Middleware to parse cookies

app.use('/auth', authRoutes); // Mounting auth routes on /auth path

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