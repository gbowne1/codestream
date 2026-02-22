import User from '../models/User.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;
const SALT_ROUNDS = 10;

export const register = async (req, res) => {
  const { username, email, password } = req.body;

  try {
    // 1. Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User with that email already exists.' });
    }

    // 2. Hash Password
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    const passwordHashed = await bcrypt.hash(password, salt);

    // 3. Create & Save User
    user = new User({
      username,
      email,
      password: passwordHashed,
      role: 'user'
    });
    await user.save();

    // 4. Generate JWT
    if (!JWT_SECRET) throw new Error('JWT_SECRET is not defined');
    
    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });

    res.status(201).json({
      token,
      user: { id: user.id, username, email, role: user.role }
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Username or email already taken.' });
    }
    console.error('Registration Error:', err.message);
    res.status(500).json({ message: 'Server error during registration.' });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    if (!JWT_SECRET) throw new Error('JWT_SECRET is not defined');

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });

    res.json({
      token,
      user: { id: user.id, username: user.username, email: user.email, role: user.role }
    });
  } catch (err) {
    console.error('Login Error:', err.message);
    res.status(500).json({ message: 'Server error during login.' });
  }
};

export const getUserDetails = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.json(user);
  } catch (err) {
    console.error('GetUserDetails Error:', err.message);
    res.status(500).json({ message: 'Server error retrieving user data.' });
  }
};
