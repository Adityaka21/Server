const { request } = require('http');
const jwt = require('jsonwebtoken');
const secret = "abcd";
const authController = {
    login: (request, response) => {
        const { username, password } = request.body;
        // Here you would typically check the username and password against a database
        if (username === 'admin' && password === 'admin') {
            const userDetails = {
                name: "Aditya",
                email: "Adi@gmail.com"
            };
            const token = jwt.sign( userDetails,secret,{expiresIn: '1h'});

            response.cookie('jwtToken', token, {
                httpOnly: true,
                secure: true,
                domain: 'localhost',
                path: "/"
            })
            response.json({message:"User authenticated successfully", userDetails: userDetails});
        } else {
            response.status(401).json({ message: 'Invalid credentials' });
        }
    },

    logout: (request, response) => {
        response.clearCookie('jwtToken');
            response.json({message: "User logged out successfully"});
        },

        isUserLoggedIn: (request, response) => {
            const token = request.cookies.jwtToken;
            if (!token) {
                return response.status(401).json({ message: 'Unauthorized access' });
            }
            jwt.verify(token, secret, (err, decoded) => {
                if (err) {
                    return response.status(401).json({ message: 'Unauthorized access' });
                }
                else{
                response.json({userDetails: userDetails });
                }
            });
        }
};

module.exports = authController;