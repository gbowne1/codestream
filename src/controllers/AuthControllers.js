import User from '../models/User.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;
const SALT_ROUNDS = 10;

/**
 * @route POST /api/auth/register
 * @desc Register a new user and return a JWT
 */

export const register = async (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ message: 'Please enter all fields.' });
    }

    try {
        // 1. Check if user already exists
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: 'User with that email already exists.' });
        }

        // 2. Hash Password
        const salt = await bcrypt.genSalt(SALT_ROUNDS);
        const passwordHashed = await bcrypt.hash(password, salt);

        // 3. Create new user instance
        user = new User({
            username,
            email,
            password: passwordHashed,
            role: 'user'
        });

        // 4. Save to DB
        await user.save();

        // 5. Create JWT
        const payload = {
            id: user.id,
            role: user.role
        };
        if (!JWT_SECRET) {
            return res.status(500).json({ message: 'Server misconfigured: JWT secret missing.' });
        }
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' });

        // 6. Respond with token and user info
        res.status(201).json({
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });

    } catch (err) {
        // Handle validation errors 
        if (err.code === 11000) {
            return res.status(400).json({ message: 'Username or email already taken.' });
        }
        console.error(err.message);
        res.status(500).json({ message: 'Server error during registration.' });
    }
};

/**
 * @route POST /api/auth/login
 * @desc Authenticate user and get token
 */
export const login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Please fill out all fields.' });
    }

    try {
        // 1. Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }

        // 2. Compare Password 
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }

        // 3. Create JWT
        const payload = {
            id: user.id,
            role: user.role
        };
        if (!JWT_SECRET) {
            return res.status(500).json({ message: 'Server misconfigured: JWT secret missing.' });
        }
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' });

        // 4. Respond with token and user info
        res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server error during login.' });
    }
};

/**
 * @route GET /api/auth/me
 * @desc Get user data (protected route)
 */
export const getUserDetails = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }
        // Return the user data (without the password)
        res.json(user);

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server error retrieving user data.' });
    }
};