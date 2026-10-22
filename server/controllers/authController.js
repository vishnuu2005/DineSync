const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const generateToken = require('../utils/generateToken');

const setCookieToken = (res, token) => {
  const isProd = process.env.NODE_ENV === 'production';
  res.cookie('dinesync_token', token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'strict' : 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });
};

// @desc    Register a new customer
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { name, email, phone, password, confirmPassword } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({ message: 'Please fill in all required fields.' });
    }

    if (confirmPassword && password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match.' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const userExists = await User.findOne({ email: normalizedEmail });
    if (userExists) {
      return res.status(400).json({ message: 'An account with this email already exists. Please login.' });
    }

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      phone: phone.trim(),
      password,
      role: 'customer',
    });

    if (user) {
      const token = generateToken(user._id, user.role);
      setCookieToken(res, token);

      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        token,
      });
    } else {
      res.status(400).json({ message: 'Invalid user registration data.' });
    }
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error during registration.' });
  }
};

// @desc    Authenticate user & set token
// @route   POST /api/auth/login or /api/admin/auth/login or /api/chef/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password, requiredRole } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide both email and password.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    // Generic error message that doesn't reveal whether email or password was wrong
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const isPasswordValid = await user.matchPassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    // Role check if logging in via role-specific portal
    if (requiredRole && user.role !== requiredRole && user.role !== 'admin') {
      return res.status(403).json({
        message: `Access denied. This portal requires ${requiredRole.toUpperCase()} credentials.`,
      });
    }

    const token = generateToken(user._id, user.role);
    setCookieToken(res, token);

    // Audit log login
    await AuditLog.create({
      action: 'USER_LOGIN',
      performedBy: user._id,
      performedByName: user.name,
      role: user.role,
      targetType: 'Auth',
      targetId: user._id.toString(),
      details: { email: user.email, role: user.role },
      ipAddress: req.ip || '',
    });

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login authentication.' });
  }
};

// @desc    Logout user & clear cookie
// @route   POST /api/auth/logout or /api/admin/auth/logout
// @access  Public
const logoutUser = (req, res) => {
  res.clearCookie('dinesync_token');
  res.json({ message: 'Logged out successfully.' });
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: 'User not found.' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching user profile.' });
  }
};

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  getMe,
};
