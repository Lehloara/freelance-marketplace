const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { db } = require('../config/firebase');

exports.register = async (req, res) => {
  try {
    const { email, password, fullName, role } = req.body;
    if (!email || !password || !fullName) {
      return res.status(400).json({ success: false, message: 'Email, password, and fullName are required.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    }
    const snapshot = await db.collection('users').where('email', '==', email).get();
    if (!snapshot.empty) {
      return res.status(400).json({ success: false, message: 'User already exists with this email.' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      email,
      password: hashedPassword,
      fullName,
      role: role || 'freelancer',
      avatarUrl: '',
      bio: '',
      skills: [],
      rating: 0,
      createdAt: new Date().toISOString(),
    };
    const docRef = await db.collection('users').add(newUser);
    const userId = docRef.id;
    const token = jwt.sign(
      { id: userId, email, role: newUser.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    const { password: _, ...userWithoutPassword } = newUser;
    res.status(201).json({
      success: true,
      message: 'User registered successfully.',
      token,
      user: { ...userWithoutPassword, id: userId },
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ success: false, message: err.message || 'Registration failed.' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }
    const snapshot = await db.collection('users').where('email', '==', email).get();
    if (snapshot.empty) return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    const doc = snapshot.docs[0];
    const user = doc.data();
    const userId = doc.id;
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }
    const token = jwt.sign(
      { id: userId, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    const { password: _, ...userWithoutPassword } = user;
    res.json({
      success: true,
      message: 'Login successful.',
      token,
      user: { ...userWithoutPassword, id: userId },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: err.message || 'Login failed.' });
  }
};

exports.getMe = async (req, res) => {
  try {
    const doc = await db.collection('users').doc(req.user.id).get();
    if (!doc.exists) return res.status(404).json({ success: false, message: 'User not found.' });
    const user = doc.data();
    const { password: _, ...userWithoutPassword } = user;
    res.json({ success: true, user: { ...userWithoutPassword, id: req.user.id } });
  } catch (err) {
    console.error('GetMe error:', err);
    res.status(500).json({ success: false, message: err.message || 'Failed to fetch user.' });
  }
};