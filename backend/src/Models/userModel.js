
import bcrypt from 'bcrypt';
import validator from 'validator';
import crypto from 'crypto';
import { pool } from '../utils/db.js';

const User = {
    async create({ name, email, password, passwordConfirm, phoneNumber }) {
        if (!name || !email || !password || !phoneNumber) {
            throw new Error('Please provide all required fields');
        }

        if (!validator.isEmail(email)) {
            throw new Error('Please enter a valid email address');
        }

        if (password.length < 6) {
            throw new Error('Password must be at least 6 characters');
        }

        if (password !== passwordConfirm) {
            throw new Error('Passwords do not match');
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const result = await pool.query(
            `INSERT INTO users (name, email, password, phone_number)
             VALUES ($1, $2, $3, $4)
             RETURNING id, name, email, phone_number`,
            [name, email.toLowerCase(), hashedPassword, phoneNumber]
        );

        return result.rows[0];
    },

    async findByEmail(email) {
        const result = await pool.query(
            'SELECT * FROM users WHERE email = $1',
            [email.toLowerCase()]
        );

        return result.rows[0] || null;
    },

    async findById(id) {
        const result = await pool.query(
            `SELECT id, name, email, phone_number,
                    avatar_url, avatar_public_id, password_changed_at
             FROM users WHERE id = $1`,
            [id]
        );

        return result.rows[0] || null;
    },

    async correctPassword(candidatePassword, hashedPassword) {
        return bcrypt.compare(candidatePassword, hashedPassword);
    },

    async updateProfile(id, { name, phoneNumber, avatarUrl, avatarPublicId }) {
        const result = await pool.query(
            `UPDATE users
             SET name = COALESCE($1, name),
                 phone_number = COALESCE($2, phone_number),
                 avatar_url = COALESCE($3, avatar_url),
                 avatar_public_id = COALESCE($4, avatar_public_id),
                 updated_at = NOW()
             WHERE id = $5
             RETURNING id, name, email, phone_number,
                       avatar_url, avatar_public_id`,
            [name ?? null, phoneNumber ?? null, avatarUrl ?? null,
             avatarPublicId ?? null, id]
        );

        return result.rows[0] || null;
    },

    async findByIdWithPassword(id) {
        const result = await pool.query(
            'SELECT * FROM users WHERE id = $1',
            [id]
        );

        return result.rows[0] || null;
    },

    async updatePassword(id, password, passwordConfirm) {
        if (!password || password.length < 6) {
            throw new Error('Password must be at least 6 characters');
        }

        if (password !== passwordConfirm) {
            throw new Error('Passwords do not match');
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const result = await pool.query(
            `UPDATE users
             SET password = $1, password_changed_at = NOW(),
                 updated_at = NOW()
             WHERE id = $2
             RETURNING id, name, email, phone_number, password_changed_at`,
            [hashedPassword, id]
        );

        return result.rows[0] || null;
    },

    async createPasswordResetToken(email) {
        const token = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        const result = await pool.query(
            `UPDATE users
             SET password_reset_token = $1,
                 password_reset_expires = NOW() + INTERVAL '10 minutes'
             WHERE email = $2
             RETURNING id`,
            [hashedToken, email.toLowerCase()]
        );

        if (!result.rowCount) {
            throw new Error('User not found');
        }

        return token;
    },

    async findByResetToken(hashedToken) {
        const result = await pool.query(
            `SELECT id, name, email
             FROM users
             WHERE password_reset_token = $1
               AND password_reset_expires > NOW()`,
            [hashedToken]
        );

        return result.rows[0] || null;
    },

    async resetPassword(id, password, passwordConfirm) {
        if (!password || password.length < 6 || password !== passwordConfirm) {
            throw new Error('Invalid password or passwords do not match');
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const result = await pool.query(
            `UPDATE users
             SET password = $1,
                 password_changed_at = NOW(),
                 password_reset_token = NULL,
                 password_reset_expires = NULL,
                 updated_at = NOW()
             WHERE id = $2
             RETURNING id, name, email, phone_number, password_changed_at`,
            [hashedPassword, id]
        );

        return result.rows[0] || null;
    }
};

export { User };
