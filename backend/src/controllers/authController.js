
import { User } from '../Models/userModel.js';
import { promisify } from 'node:util';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import ImageKit from '../utils/ImagekitIO.js';
import {
    forgotPasswordMailGenContent,
    sendMail
} from '../utils/mail.js';

const signToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    });
};

const createSendToken = (user, statusCode, res) => {
    const token = signToken(user.id);

    res.cookie('jwt', token, {
        expires: new Date(
            Date.now() +
            Number(process.env.JWT_COOKIE_EXPIRES_IN || 1) *
            24 * 60 * 60 * 1000
        ),
        httpOnly: true,
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        secure: process.env.NODE_ENV === 'production'
    });

    const { password, ...safeUser } = user;

    return res.status(statusCode).json({
        status: 'Success',
        token,
        user: safeUser
    });
};

const defaultAvatarUrl = 'https://i.pravatar.cc/150?img=3';

const signup = async (req, res) => {
    try {
        const user = await User.create({
            name: req.body.name,
            email: req.body.email,
            phoneNumber: req.body.phoneNumber,
            password: req.body.password,
            passwordConfirm: req.body.passwordConfirm
        });

        return createSendToken(user, 201, res);
    } catch (error) {
        return res.status(400).json({ message: error.message });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            throw new Error('Please provide email and password');
        }

        const user = await User.findByEmail(email);

        if (!user || !(await User.correctPassword(password, user.password))) {
            throw new Error('Incorrect email or password');
        }

        return createSendToken(user, 200, res);
    } catch (error) {
        return res.status(401).json({
            status: 'fail',
            message: error.message
        });
    }
};

const logout = (req, res) => {
    res.cookie('jwt', '', {
        expires: new Date(0),
        httpOnly: true,
        path: '/',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        secure: process.env.NODE_ENV === 'production'
    });

    return res.status(200).json({
        status: 'success',
        message: 'Logged out successfully'
    });
};

const protect = async (req, res, next) => {
    try {
        let token;

        if (req.headers.authorization?.startsWith('Bearer ')) {
            token = req.headers.authorization.split(' ')[1];
        } else if (req.cookies?.jwt && req.cookies.jwt !== 'loggedout') {
            token = req.cookies.jwt;
        }

        if (!token) {
            throw new Error('You are not logged in. Please log in to access this resource.');
        }

        const decoded = await promisify(jwt.verify)(
            token,
            process.env.JWT_SECRET
        );

        const user = await User.findById(decoded.id);

        if (!user) {
            throw new Error('The user belonging to this token no longer exists');
        }

        if (
            user.password_changed_at &&
            Math.floor(new Date(user.password_changed_at).getTime() / 1000) >
                decoded.iat
        ) {
            throw new Error('Password recently changed. Please log in again.');
        }

        req.user = user;
        return next();
    } catch (error) {
        return res.status(401).json({
            status: 'fail',
            message: error.message
        });
    }
};

const updateMe = async (req, res) => {
    try {
        const { name, phoneNumber } = req.body;
        let avatarUrl;
        let avatarPublicId;

        if (req.body.avatar) {
            const uploaded = await ImageKit.upload({
                file: req.body.avatar,
                fileName: `avatar_${Date.now()}.jpg`,
                folder: 'avatars'
            });

            avatarUrl = uploaded.url;
            avatarPublicId = uploaded.fileId;
        }

        const user = await User.updateProfile(req.user.id, {
            name,
            phoneNumber,
            avatarUrl,
            avatarPublicId
        });

        return res.status(200).json({
            status: 'Success',
            data: { user }
        });
    } catch (error) {
        return res.status(400).json({
            status: 'Fail',
            message: error.message
        });
    }
};

const updatePassword = async (req, res) => {
    try {
        const user = await User.findByIdWithPassword(req.user.id);

        if (
            !user ||
            !(await User.correctPassword(
                req.body.passwordCurrent,
                user.password
            ))
        ) {
            throw new Error('Your current password is wrong');
        }

        const updatedUser = await User.updatePassword(
            req.user.id,
            req.body.password,
            req.body.passwordConfirm
        );

        return createSendToken(updatedUser, 200, res);
    } catch (error) {
        return res.status(400).json({
            status: 'fail',
            message: error.message
        });
    }
};

const forgotPassword = async (req, res) => {
    try {
        const user = await User.findByEmail(req.body.email);

        if (!user) {
            return res.status(404).json({
                error: 'There is no user with this email'
            });
        }

        const token = await User.createPasswordResetToken(user.email);

        const frontendUrl =
            process.env.FRONTEND_URL || 'http://localhost:5173';

        const resetUrl =
            `${frontendUrl}/user/resetPassword/${token}`;

        await sendMail({
            email: user.email,
            subject: 'Reset your Password (valid for 10 mins)',
            mailGenContent: forgotPasswordMailGenContent(
                user.name,
                resetUrl
            )
        });

        return res.status(200).json({
            status: 'success',
            message: 'Token sent successfully'
        });
    } catch (error) {
        return res.status(400).json({ error: error.message });
    }
};

const resetPassword = async (req, res) => {
    try {
        const hashedToken = crypto
            .createHash('sha256')
            .update(req.params.token)
            .digest('hex');

        const user = await User.findByResetToken(hashedToken);

        if (!user) {
            throw new Error('Token is invalid or expired');
        }

        const updatedUser = await User.resetPassword(
            user.id,
            req.body.password,
            req.body.passwordConfirm
        );

        return createSendToken(updatedUser, 200, res);
    } catch (error) {
        return res.status(400).json({
            status: 'fail',
            error: error.message
        });
    }
};

const check = async (req, res) => {
    return res.status(200).json({
        status: 'success',
        message: 'Logged In',
        user: req.user
    });
};

export {
    signup,
    login,
    logout,
    protect,
    updateMe,
    resetPassword,
    forgotPassword,
    updatePassword,
    check
};
