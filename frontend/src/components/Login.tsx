import React, { useState } from 'react';
import type { Settings } from '../types';
import { Mail, User, Lock, ArrowRight, ShieldCheck, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { authService } from '../services/auth';

interface LoginProps {
  settings: Settings;
  setSettings: (s: Settings) => void;
  onLoginSuccess: () => void;
}

export const Login: React.FC<LoginProps> = ({ settings, setSettings, onLoginSuccess }) => {
  // If user is already registered, default to signin, otherwise default to signup
  const isRegistered = !!settings.userGmail && !!settings.userPassword;
  const [mode, setMode] = useState<'signup' | 'signin' | 'forgot_email' | 'forgot_otp' | 'forgot_reset'>(
    isRegistered ? 'signin' : 'signup'
  );

  // Sign up & Sign in fields
  const [name, setName] = useState(settings.userName || '');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Forgot password flow fields
  const [forgotEmail, setForgotEmail] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [userOtpInput, setUserOtpInput] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Feedback states
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [otpNotification, setOtpNotification] = useState<string | null>(null);

  // Clear messages on mode switch
  const switchMode = (newMode: typeof mode) => {
    setError('');
    setSuccess('');
    setOtpNotification(null);
    setMode(newMode);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!name.trim()) {
      setError('Please enter your name.');
      return;
    }
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid Gmail / email address.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    const result = await authService.signUp(name, email, password, settings, setSettings);
    if (result.error) {
      setError(result.error);
      return;
    }

    setSuccess('Account created successfully! Logging you in...');
    setTimeout(() => {
      onLoginSuccess();
    }, 1200);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid Gmail / email address.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    const result = await authService.signIn(email, password, settings, setSettings);
    if (result.error) {
      setError(result.error);
      return;
    }

    setSuccess('Login successful! Welcome back.');
    setTimeout(() => {
      onLoginSuccess();
    }, 1000);
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setOtpNotification(null);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(forgotEmail.trim())) {
      setError('Please enter a valid Gmail / email address.');
      return;
    }

    const result = await authService.forgotPassword(forgotEmail, settings);
    if (result.error) {
      setError(result.error);
      return;
    }

    if (result.otp) {
      setGeneratedOtp(result.otp);
      setOtpNotification(`AURA security verification: Simulated OTP code [ ${result.otp} ] sent to ${forgotEmail}`);
    }
    setMode('forgot_otp');
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (userOtpInput.trim() === generatedOtp && generatedOtp !== '') {
      setSuccess('OTP verified successfully. Create your new password.');
      setOtpNotification(null);
      setTimeout(() => {
        setMode('forgot_reset');
        setSuccess('');
      }, 1000);
    } else {
      setError('Invalid OTP code. Please check and try again.');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    const result = await authService.resetPassword(forgotEmail, newPassword, settings, setSettings);
    if (result.error) {
      setError(result.error);
      return;
    }

    setSuccess('Password updated successfully! You can now sign in.');
    setTimeout(() => {
      setPassword('');
      setMode('signin');
      setSuccess('');
    }, 1500);
  };

  return (
    <div className="min-h-screen w-full bg-apple-black flex items-center justify-center relative px-4 select-none">
      {/* Background Radial Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,113,227,0.15)_0%,transparent_65%)] pointer-events-none" />

      {/* Simulated OTP Floating Alert Notification */}
      {otpNotification && (
        <div className="absolute top-8 left-1/2 transform -translate-x-1/2 w-full max-w-md z-50 animate-bounce">
          <div className="bg-apple-blue/20 border border-apple-blue backdrop-blur-md rounded-xl p-4 flex items-start gap-3 shadow-lg">
            <ShieldCheck className="w-5 h-5 text-apple-blue shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-white">Verification Code Sent</p>
              <p className="text-xs text-apple-gray mt-1 leading-relaxed">{otpNotification}</p>
            </div>
          </div>
        </div>
      )}

      {/* Login Card */}
      <div className="w-full max-w-md bg-white/[0.03] border border-white/10 backdrop-blur-2xl rounded-2xl p-8 shadow-2xl relative z-10 apple-transition">
        {/* Brand/Logo */}
        <div className="flex flex-col items-center mb-8">
          <img 
            src="/logo.png" 
            className="w-16 h-16 rounded-full object-cover border-2 border-white/10 shadow-lg mb-3" 
            alt="AURA Logo" 
          />
          <h1 className="text-2xl font-bold tracking-wider text-white">AURA</h1>
          <p className="text-[10px] text-apple-gray uppercase tracking-widest mt-1">
            Understanding, Revision & Assistance
          </p>
        </div>

        {/* Message Alert Banners */}
        {error && (
          <div className="mb-4 bg-red-500/10 border border-red-500/20 text-red-300 text-xs px-3.5 py-2.5 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="mb-4 bg-green-500/10 border border-green-500/20 text-green-300 text-xs px-3.5 py-2.5 rounded-lg flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Form Container */}
        {mode === 'signup' && (
          <form onSubmit={handleSignUp} className="space-y-4">
            <h2 className="text-lg font-semibold text-white/90">Create Account</h2>
            
            <div>
              <label className="block text-xs font-medium text-apple-gray mb-1.5">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-apple-gray/50" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full bg-apple-black/40 border border-white/10 rounded-lg py-2 pl-10 pr-4 text-white text-sm focus:outline-none focus:ring-1 focus:ring-apple-blue focus:border-apple-blue placeholder:text-apple-gray/30"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-apple-gray mb-1.5">Gmail Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-apple-gray/50" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@gmail.com"
                  className="w-full bg-apple-black/40 border border-white/10 rounded-lg py-2 pl-10 pr-4 text-white text-sm focus:outline-none focus:ring-1 focus:ring-apple-blue focus:border-apple-blue placeholder:text-apple-gray/30"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-apple-gray mb-1.5">Create Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-apple-gray/50" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  className="w-full bg-apple-black/40 border border-white/10 rounded-lg py-2 pl-10 pr-4 text-white text-sm focus:outline-none focus:ring-1 focus:ring-apple-blue focus:border-apple-blue placeholder:text-apple-gray/30"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full mt-6 bg-gradient-to-r from-apple-blue to-purple-600 hover:from-apple-blue/90 hover:to-purple-600/90 text-white rounded-lg py-2.5 font-semibold text-sm flex items-center justify-center gap-2 apple-transition shadow-lg"
            >
              Sign Up <ArrowRight className="w-4 h-4" />
            </button>

            <div className="pt-4 border-t border-white/5 flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={() => switchMode('signin')}
                className="text-apple-blue hover:underline"
              >
                Sign In
              </button>
            </div>
          </form>
        )}

        {mode === 'signin' && (
          <form onSubmit={handleSignIn} className="space-y-4">
            <h2 className="text-lg font-semibold text-white/90">Sign In</h2>

            <div>
              <label className="block text-xs font-medium text-apple-gray mb-1.5">Gmail Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-apple-gray/50" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@gmail.com"
                  className="w-full bg-apple-black/40 border border-white/10 rounded-lg py-2 pl-10 pr-4 text-white text-sm focus:outline-none focus:ring-1 focus:ring-apple-blue focus:border-apple-blue placeholder:text-apple-gray/30"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-apple-gray mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-apple-gray/50" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your password"
                  className="w-full bg-apple-black/40 border border-white/10 rounded-lg py-2 pl-10 pr-4 text-white text-sm focus:outline-none focus:ring-1 focus:ring-apple-blue focus:border-apple-blue placeholder:text-apple-gray/30"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full mt-6 bg-gradient-to-r from-apple-blue to-purple-600 hover:from-apple-blue/90 hover:to-purple-600/90 text-white rounded-lg py-2.5 font-semibold text-sm flex items-center justify-center gap-2 apple-transition shadow-lg"
            >
              Sign In <ArrowRight className="w-4 h-4" />
            </button>

            <div className="pt-4 border-t border-white/5 flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={() => switchMode('signup')}
                className="text-apple-gray hover:text-white hover:underline text-left"
              >
                Sign Up
              </button>
              <button
                type="button"
                onClick={() => switchMode('forgot_email')}
                className="text-apple-blue hover:underline text-right"
              >
                Forgot Password?
              </button>
            </div>
          </form>
        )}

        {mode === 'forgot_email' && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <h2 className="text-lg font-semibold text-white/90">Reset Password</h2>
            <p className="text-xs text-apple-gray leading-relaxed mb-4">
              Enter your registered Gmail address below, and we will send a verification code to reset your password.
            </p>

            <div>
              <label className="block text-xs font-medium text-apple-gray mb-1.5">Gmail Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-apple-gray/50" />
                <input
                  type="email"
                  required
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="name@gmail.com"
                  className="w-full bg-apple-black/40 border border-white/10 rounded-lg py-2 pl-10 pr-4 text-white text-sm focus:outline-none focus:ring-1 focus:ring-apple-blue focus:border-apple-blue placeholder:text-apple-gray/30"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full mt-6 bg-apple-blue hover:bg-apple-blue/90 text-white rounded-lg py-2.5 font-semibold text-sm flex items-center justify-center gap-2 apple-transition"
            >
              Send Verification Code
            </button>

            <div className="pt-4 border-t border-white/5 text-center text-xs">
              <button
                type="button"
                onClick={() => switchMode('signin')}
                className="text-apple-gray hover:text-white hover:underline"
              >
                Back to Sign In
              </button>
            </div>
          </form>
        )}

        {mode === 'forgot_otp' && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <h2 className="text-lg font-semibold text-white/90">Enter Verification Code</h2>
            <p className="text-xs text-apple-gray leading-relaxed mb-4">
              A 6-digit verification code was simulated and displayed in the alert notification at the top of your screen.
            </p>

            <div>
              <label className="block text-xs font-medium text-apple-gray mb-1.5">OTP Code</label>
              <div className="relative">
                <ShieldCheck className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-apple-gray/50" />
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={userOtpInput}
                  onChange={(e) => setUserOtpInput(e.target.value)}
                  placeholder="123456"
                  className="w-full bg-apple-black/40 border border-white/10 rounded-lg py-2 pl-10 pr-4 text-white text-sm focus:outline-none focus:ring-1 focus:ring-apple-blue focus:border-apple-blue placeholder:text-apple-gray/30 text-center tracking-widest font-semibold"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  const otp = Math.floor(100000 + Math.random() * 900000).toString();
                  setGeneratedOtp(otp);
                  setOtpNotification(`AURA security verification: Simulated OTP code [ ${otp} ] sent to ${forgotEmail}`);
                }}
                className="flex items-center justify-center gap-1.5 border border-white/10 rounded-lg px-4 text-xs font-medium hover:bg-white/5 hover:text-white text-apple-gray apple-transition shrink-0"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Resend
              </button>
              <button
                type="submit"
                className="w-full bg-apple-blue hover:bg-apple-blue/90 text-white rounded-lg py-2.5 font-semibold text-sm flex items-center justify-center gap-2 apple-transition"
              >
                Verify Code
              </button>
            </div>

            <div className="pt-4 border-t border-white/5 text-center text-xs">
              <button
                type="button"
                onClick={() => switchMode('signin')}
                className="text-apple-gray hover:text-white hover:underline"
              >
                Back to Sign In
              </button>
            </div>
          </form>
        )}

        {mode === 'forgot_reset' && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <h2 className="text-lg font-semibold text-white/90">Create New Password</h2>
            <p className="text-xs text-apple-gray leading-relaxed mb-4">
              Please enter your new secure password for this website.
            </p>

            <div>
              <label className="block text-xs font-medium text-apple-gray mb-1.5">New Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-apple-gray/50" />
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  className="w-full bg-apple-black/40 border border-white/10 rounded-lg py-2 pl-10 pr-4 text-white text-sm focus:outline-none focus:ring-1 focus:ring-apple-blue focus:border-apple-blue placeholder:text-apple-gray/30"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full mt-6 bg-gradient-to-r from-apple-blue to-purple-600 hover:from-apple-blue/90 hover:to-purple-600/90 text-white rounded-lg py-2.5 font-semibold text-sm flex items-center justify-center gap-2 apple-transition shadow-lg"
            >
              Reset Password
            </button>

            <div className="pt-4 border-t border-white/5 text-center text-xs">
              <button
                type="button"
                onClick={() => switchMode('signin')}
                className="text-apple-gray hover:text-white hover:underline"
              >
                Back to Sign In
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
