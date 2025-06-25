const { request } = require('http');
const jwt = require('jsonwebtoken');
const { register } = require('module');
const bcrypt = require('bcryptjs');
const secret = "abcd";
const { OAuth2Client } = require('google-auth-library');
const User = require('../model/Users'); // Importing User model
const authController = {
    login: async (request, response) => {
        const { username, password } = request.body;

         try {
            const { username, password } = request.body;
            
            const data = await User.findOne({email: username});
            if (!data) {
                return response.status(401).json({ message: 'Invalid Credentials' });
            }

            const isMatch = await bcrypt.compare(password, data.password);
            if (!isMatch) {
                return response.status(401).json({ message: 'Invalid Credentials' });
            }
        // Here you would typically check the username and password against a database
       
            const userDetails = {
               id: data._id, 
                name: data.name,
                email: data.email
            };
            const token = jwt.sign( userDetails,secret,{expiresIn: '1h'});

            response.cookie('jwtToken', token, {
                httpOnly: true,
                secure: true,
                domain: 'localhost',
                path: "/"
            })
            // console.log('Received request for login with username:', username);
            response.json({message:"User authenticated successfully", userDetails: userDetails});
        } catch(errror) {
            console.log(error);
            response.status(401).json({ message: 'Internal Server Error' });
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
                response.json({userDetails: decoded });
                }
            });
        },

        register: async(request, response) => {
            try{
            const { username, password, name} = request.body;

            const data = await User.findOne({ email: username });
            if (data) {
                return response.status(401).json({ message: 'User already exists' });
            }
            const encryptedPassword = await bcrypt.hash(password , 10);
            const user = new User({
                email: username,
                password: encryptedPassword,
                name: name
            });
            await user.save();
            response.status(200).json({ message: 'User registered successfully' });
        } catch (error) {
            console.log(error);
            response.status(500).json({ message: 'Internal server error' });
        }
    },

    googleAuth: async (request, response) => {
        const { idToken } = request.body;
        if(!idToken) {
            return response.status(401).json({ message: 'Invalid request' });
        }
        try {
            const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
            const googleresponse = await googleClient.verifyIdToken({
                idToken: idToken,
                audience: process.env.GOOGLE_CLIENT_ID
            });
            const payload = googleresponse.getPayload();
            const {sub: googleId, email, name} = payload;

            let data = await User.findOne({email: email});
            if (!data) {
                data = new User({
                    email: email,
                    name: name,
                    isGoogleUser: true,
                    googleId: googleId
                });
                await data.save();
            } 

            const user = {
                id: data._id?data._id : googleId,
                username: email,
                name: name
            };
              const token = jwt.sign( user,secret,{expiresIn: '1h'});

            response.cookie('jwtToken', token, {
                httpOnly: true,
                secure: true,
                domain: 'localhost',
                path: "/"
            })
            response.json({message:"User authenticated successfully", userDetails: user});
        }catch (error) {
            console.log(error);
            response.status(500).json({ message: 'Internal server error' });
        }
    },

};

module.exports = authController;