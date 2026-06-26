import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// In-memory OTP storage for simulation fallback
const otpStore = new Map();

// Connect to MongoDB
const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) {
  console.warn('WARNING: MONGODB_URI environment variable is not defined. Database features will be unavailable.');
} else {
  mongoose
    .connect(mongoUri)
    .then(() => console.log('Successfully connected to MongoDB database.'))
    .catch((err) => console.error('MongoDB database connection error:', err));
}

// User Schema & Model
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  gmail: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const User = mongoose.model('User', userSchema);

// Middleware to check if DB is connected
const checkDbConnection = (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ error: 'Database service is currently offline. Please try again later.' });
  }
  next();
};

// API Status Check
app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  });
});

// Sign Up
app.post('/api/auth/signup', checkDbConnection, async (req, res) => {
  try {
    const { name, gmail, password } = req.body;

    if (!name || !gmail || !password) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    const emailKey = gmail.toLowerCase().trim();
    const existingUser = await User.findOne({ gmail: emailKey });
    if (existingUser) {
      return res.status(400).json({ error: 'An account with this email already exists.' });
    }

    const newUser = new User({
      name: name.trim(),
      gmail: emailKey,
      password: password,
    });

    await newUser.save();
    console.log(`[Auth] New user registered: ${emailKey}`);
    res.status(201).json({
      name: newUser.name,
      gmail: newUser.gmail,
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Server error during sign up.' });
  }
});

// Sign In
app.post('/api/auth/signin', checkDbConnection, async (req, res) => {
  try {
    const { gmail, password } = req.body;

    if (!gmail || !password) {
      return res.status(400).json({ error: 'Gmail and password are required.' });
    }

    const emailKey = gmail.toLowerCase().trim();
    const user = await User.findOne({ gmail: emailKey });

    if (!user || user.password !== password) {
      return res.status(400).json({ error: 'Invalid Gmail address or password.' });
    }

    console.log(`[Auth] User signed in: ${emailKey}`);
    res.json({
      name: user.name,
      gmail: user.gmail,
    });
  } catch (error) {
    console.error('Signin error:', error);
    res.status(500).json({ error: 'Server error during sign in.' });
  }
});

// Update Profile
app.post('/api/auth/update-profile', checkDbConnection, async (req, res) => {
  try {
    const { currentGmail, name, gmail } = req.body;

    if (!currentGmail || !name || !gmail) {
      return res.status(400).json({ error: 'Current email, new name, and new email are required.' });
    }

    const currentEmailKey = currentGmail.toLowerCase().trim();
    const newEmailKey = gmail.toLowerCase().trim();

    const user = await User.findOne({ gmail: currentEmailKey });
    if (!user) {
      return res.status(404).json({ error: 'User profile not found.' });
    }

    // Check email uniqueness if email is changed
    if (newEmailKey !== currentEmailKey) {
      const duplicateUser = await User.findOne({ gmail: newEmailKey });
      if (duplicateUser) {
        return res.status(400).json({ error: 'The email address is already in use by another account.' });
      }
    }

    user.name = name.trim();
    user.gmail = newEmailKey;
    await user.save();

    console.log(`[Auth] Profile updated: ${currentEmailKey} -> ${newEmailKey}`);
    res.json({
      name: user.name,
      gmail: user.gmail,
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Server error during profile update.' });
  }
});

// Forgot Password (Simulate OTP generation)
app.post('/api/auth/forgot-password', checkDbConnection, async (req, res) => {
  try {
    const { gmail } = req.body;

    if (!gmail) {
      return res.status(400).json({ error: 'Gmail is required.' });
    }

    const emailKey = gmail.toLowerCase().trim();
    const user = await User.findOne({ gmail: emailKey });

    if (!user) {
      return res.status(404).json({ error: 'No account found registered with this Gmail.' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore.set(emailKey, otp);
    console.log(`[Security] Generated simulated OTP for ${emailKey}: ${otp}`);

    res.json({
      success: true,
      otp: otp, // Returned so the web app UI simulated pop-up can copy it directly
      message: 'OTP verification code sent.',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Server error initiating password reset.' });
  }
});

// Reset Password
app.post('/api/auth/reset-password', checkDbConnection, async (req, res) => {
  try {
    const { gmail, password } = req.body;

    if (!gmail || !password) {
      return res.status(400).json({ error: 'Gmail and new password are required.' });
    }

    const emailKey = gmail.toLowerCase().trim();
    const user = await User.findOne({ gmail: emailKey });

    if (!user) {
      return res.status(404).json({ error: 'User account not found.' });
    }

    user.password = password;
    await user.save();

    console.log(`[Auth] Password successfully reset for: ${emailKey}`);
    res.json({
      success: true,
      message: 'Password has been successfully updated.',
    });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ error: 'Server error resetting password.' });
  }
});

// Delete Account
app.post('/api/auth/delete-account', checkDbConnection, async (req, res) => {
  try {
    const { gmail } = req.body;

    if (!gmail) {
      return res.status(400).json({ error: 'Gmail is required.' });
    }

    const emailKey = gmail.toLowerCase().trim();
    const result = await User.deleteOne({ gmail: emailKey });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'User account not found.' });
    }

    console.log(`[Auth] User account deleted: ${emailKey}`);
    res.json({
      success: true,
      message: 'Account successfully deleted from database.',
    });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ error: 'Server error during account deletion.' });
  }
});

// Start Express Server
app.listen(PORT, () => {
  console.log(`AURA backend auth server running on port ${PORT}`);
});
