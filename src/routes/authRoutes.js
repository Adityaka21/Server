const express = require('express');
const { body } = require('express-validator');
const authController = require('../controller/authController');

const router = express.Router();

const loginValidator = [
    body('username')
        .notEmpty().withMessage('Username is required')
        .isEmail().withMessage('Username must be a valid email'),
    body('password')
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 4 }).withMessage('Password must be at least 4 characters long')
];
const registerValidator = [
    body('username')
        .notEmpty().withMessage('Username is required')
        .isEmail().withMessage('Username must be a valid email'),
    body('password')
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 4 }).withMessage('Password must be at least 4 characters long'),
    body('name')
        .notEmpty().withMessage('Name is required')
];

router.post('/login', loginValidator, authController.login);
router.post('/logout', authController.logout);
router.post('/is-user-logged-in', authController.isUserLoggedIn);
router.post('/register', registerValidator, authController.register);
router.post('/google-auth', authController.googleAuth);
router.post('/refresh-token', authController.refreshToken);
router.post('/send-reset-password-token', authController.sendResetPasswordToken);
router.post('/reset-password', authController.resetPassword);

module.exports = router;
