const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { OAuth2Client } = require('google-auth-library');
const { validationResult } = require('express-validator');
const crypto = require('crypto');
const User = require('../model/Users');
const { send } = require('../service/emailService');

const secret = "wC9_Ebs3FbHcu-Jsdf89sfkuSjdf9sdfjsdfYhsdfsfKdjH";
const refreshSecret = process.env.JWT_REFRESH_TOKEN_SECRET;

const authController = {
    login: async (request, response) => {
        const errors = validationResult(request);
        if (!errors.isEmpty()) {
            return response.status(400).json({ errors: errors.array() });
        }

        try {
            const { username, password } = request.body;
            const data = await User.findOne({ email: username });
            if (!data) {
                return response.status(401).json({ message: 'Invalid Credentials' });
            }

            const isMatch = await bcrypt.compare(password, data.password);
            if (!isMatch) {
                return response.status(401).json({ message: 'Invalid Credentials' });
            }

            const userDetails = {
                id: data._id,
                name: data.name,
                email: data.email,
                role: data.role || 'admin',
                adminId: data.adminId,
                credits: data.credits,
                subscription: data.subscription,
            };

            const token = jwt.sign(userDetails, secret, { expiresIn: '1h' });
            const refreshToken = jwt.sign(userDetails, refreshSecret, { expiresIn: '7d' });

            response.cookie('jwtToken', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                domain: process.env.COOKIE_DOMAIN || 'localhost',
                path: "/",
                sameSite: 'Strict',
            });

            response.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                domain: process.env.COOKIE_DOMAIN || 'localhost',
                path: '/',
                sameSite: 'Strict'
            });

            response.json({ message: "User authenticated successfully", userDetails });
        } catch (error) {
            console.error(error);
            response.status(500).json({ message: 'Internal Server Error' });
        }
    },

    logout: (request, response) => {
        response.clearCookie('jwtToken');
        response.clearCookie('refreshToken');
        response.json({ message: "User logged out successfully" });
    },

    isUserLoggedIn: async (request, response) => {
        const token = request.cookies.jwtToken;
        if (!token) {
            return response.status(401).json({ message: 'Unauthorized access' });
        }

        jwt.verify(token, secret, async (err, decoded) => {
            if (err) {
                return response.status(401).json({ message: 'Unauthorized access' });
            }

            try {
                const data = await User.findById(decoded.id);
                if (!data) {
                    return response.status(404).json({ message: 'User not found' });
                }

                return response.json({ userDetails: data });
            } catch (error) {
                console.error(error);
                return response.status(500).json({ message: 'Internal Server Error' });
            }
        });
    },

    register: async (request, response) => {
        try {
            const { username, password, name } = request.body;
            const existingUser = await User.findOne({ email: username });

            if (existingUser) {
                return response.status(400).json({ message: 'User already exists' });
            }

            const encryptedPassword = await bcrypt.hash(password, 10);

            const user = new User({
                email: username,
                password: encryptedPassword,
                name,
                role: 'admin',
                subscription: null
            });

            await user.save();

            const userDetails = {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                credits: user.credits,
                subscription: user.subscription
            };

            const token = jwt.sign(userDetails, secret, { expiresIn: '1h' });
            const refreshToken = jwt.sign(userDetails, refreshSecret, { expiresIn: '7d' });

            response.cookie('jwtToken', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                domain: process.env.COOKIE_DOMAIN || 'localhost',
                path: '/',
                sameSite: 'Strict',
            });

            response.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                domain: process.env.COOKIE_DOMAIN || 'localhost',
                path: '/',
                sameSite: 'Strict',
            });

            response.json({ message: "User registered successfully", userDetails });
        } catch (error) {
            console.error(error);
            response.status(500).json({ message: 'Internal server error' });
        }
    },

    googleAuth: async (request, response) => {
        const { idToken } = request.body;
        if (!idToken) {
            return response.status(400).json({ message: 'Invalid request' });
        }

        try {
            const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
            const ticket = await googleClient.verifyIdToken({
                idToken,
                audience: process.env.GOOGLE_CLIENT_ID,
            });

            const payload = ticket.getPayload();
            const { sub: googleId, email, name } = payload;

            let user = await User.findOne({ email });

            if (!user) {
                user = new User({
                    email,
                    name,
                    isGoogleUser: true,
                    googleId,
                    role: 'admin',
                });

                await user.save();
            }

            const userDetails = {
                id: user._id || googleId,
                username: email,
                name,
                role: user.role || 'admin',
                credits: user.credits,
                subscription: user.subscription,
            };

            const token = jwt.sign(userDetails, secret, { expiresIn: '1h' });

            response.cookie('jwtToken', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                domain: process.env.COOKIE_DOMAIN || 'localhost',
                path: '/',
                sameSite: 'Strict',
            });

            response.json({ message: "User authenticated successfully", userDetails });
        } catch (error) {
            console.error(error);
            response.status(500).json({ message: 'Internal server error' });
        }
    },

    refreshToken: async (request, response) => {
        try {
            const refreshToken = request.cookies?.refreshToken;
            if (!refreshToken) {
                return response.status(401).json({ message: 'No refresh token' });
            }

            const decoded = jwt.verify(refreshToken, refreshSecret);
            const data = await User.findById(decoded.id);

            if (!data) {
                return response.status(404).json({ message: 'User not found' });
            }

            const userDetails = {
                id: data._id,
                username: data.email,
                name: data.name,
                role: data.role || 'admin',
                credits: data.credits,
                subscription: data.subscription
            };

            const newAccessToken = jwt.sign(userDetails, secret, { expiresIn: '1h' });

            response.cookie('jwtToken', newAccessToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                domain: process.env.COOKIE_DOMAIN || 'localhost',
                path: '/',
                sameSite: 'Strict',
            });

            response.json({ message: 'Token refreshed', userDetails });
        } catch (error) {
            console.error(error);
            response.status(500).json({ message: 'Internal server error' });
        }
    },

    sendResetPasswordToken: async (req, res) => {
        const { email } = req.body;
        try {
            const user = await User.findOne({ email });
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            const token = Math.floor(100000 + Math.random() * 900000).toString();;
            const expiry = Date.now() + 10 * 60 * 1000;

            user.resetToken = token;
            user.resetTokenExpiry = expiry;
            await user.save();

            const resetLink = `${process.env.CLIENT_URL}/reset-password`;
            await send(email, 'Reset Your Password', `Click the link to reset your password: ${resetLink}\nThe code is: ${token}`);
           
            res.status(200).json({ message: 'Reset password link sent' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Server error' });
        }
    },

    resetPassword: async (req, res) => {

        try {
            const { email, code, newPassword } = req.body;
            const user = await User.findOne({ email });
            if (!user) return res.status(404).json({ message: 'User not found' });
            if (
                !user.resetToken ||
                user.resetToken !== code ||
                user.resetTokenExpiry < Date.now()
            ) {
                return res.status(400).json({ message: 'Invalid or expired reset code' });
            }

            const hashedPassword = await bcrypt.hash(newPassword, 10);
            user.password = hashedPassword;
            user.resetToken = undefined;
            user.resetTokenExpiry = undefined;
            await user.save();

            return res.status(200).json({ message: 'Password reset successful' });
        } catch (error) {
            console.log(error)
            res.status(500).json({ message: 'Internal Server Error' });
        }
    },
};

module.exports = authController;
