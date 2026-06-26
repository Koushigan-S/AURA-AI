import type { Settings } from '../types';

export interface AuthResponse {
  name: string;
  gmail: string;
  error?: string;
}

export interface OtpResponse {
  success: boolean;
  otp?: string;
  error?: string;
}

export interface ResetResponse {
  success: boolean;
  error?: string;
}

const API_BASE = import.meta.env.VITE_API_URL || '/api';

/**
 * Check if the backend Express auth server is online and database is connected.
 */
export async function checkServerOnline(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/status`, { signal: AbortSignal.timeout(1500) });
    if (!res.ok) return false;
    const data = await res.json();
    return data.status === 'online' && data.database === 'connected';
  } catch (e) {
    return false;
  }
}

/**
 * Authentication service wrapper with automatic localStorage fallback when backend is offline.
 */
export const authService = {
  /**
   * User Sign Up
   */
  async signUp(
    name: string,
    gmail: string,
    password: string,
    settings: Settings,
    setSettings: (s: Settings) => void
  ): Promise<AuthResponse> {
    const isOnline = await checkServerOnline();
    const emailKey = gmail.toLowerCase().trim();

    if (isOnline) {
      try {
        const res = await fetch(`${API_BASE}/auth/signup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, gmail: emailKey, password }),
        });
        const data = await res.json();
        if (!res.ok) {
          return { name: '', gmail: '', error: data.error || 'Failed to sign up.' };
        }
        
        // Sync local settings to keep current profile info cached
        setSettings({
          ...settings,
          userName: name.trim(),
          userGmail: emailKey,
          userPassword: password, // kept locally for offline fallback authentication
        });

        return { name: data.name, gmail: data.gmail };
      } catch (err) {
        console.warn('Signup server call failed, falling back to local storage', err);
      }
    }

    // Local fallback
    setSettings({
      ...settings,
      userName: name.trim(),
      userGmail: emailKey,
      userPassword: password,
    });
    return { name: name.trim(), gmail: emailKey };
  },

  /**
   * User Sign In
   */
  async signIn(
    gmail: string,
    password: string,
    settings: Settings,
    setSettings: (s: Settings) => void
  ): Promise<AuthResponse> {
    const isOnline = await checkServerOnline();
    const emailKey = gmail.toLowerCase().trim();

    if (isOnline) {
      try {
        const res = await fetch(`${API_BASE}/auth/signin`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ gmail: emailKey, password }),
        });
        const data = await res.json();
        if (!res.ok) {
          return { name: '', gmail: '', error: data.error || 'Invalid credentials.' };
        }

        // Sync local settings to match the signed-in user
        setSettings({
          ...settings,
          userName: data.name,
          userGmail: data.gmail,
          userPassword: password,
          // Restore the stored API key from the server if present
          ...(data.geminiApiKey ? { geminiApiKey: data.geminiApiKey } : {}),
        });

        return { name: data.name, gmail: data.gmail };
      } catch (err) {
        console.warn('Signin server call failed, falling back to local storage', err);
      }
    }

    // Local fallback check
    const localGmail = (settings.userGmail || '').toLowerCase().trim();
    const localPassword = settings.userPassword || '';

    if (localGmail === emailKey && localPassword === password && localGmail !== '') {
      return { name: settings.userName || 'Student', gmail: localGmail };
    }

    return {
      name: '',
      gmail: '',
      error: localGmail === '' 
        ? 'No user accounts are registered on this device.' 
        : 'Invalid Gmail or password.',
    };
  },

  /**
   * Update Profile Details (Name, Email)
   */
  async updateProfile(
    currentGmail: string,
    name: string,
    gmail: string,
    settings: Settings,
    setSettings: (s: Settings) => void
  ): Promise<AuthResponse> {
    const isOnline = await checkServerOnline();
    const currentEmailKey = currentGmail.toLowerCase().trim();
    const newEmailKey = gmail.toLowerCase().trim();

    if (isOnline) {
      try {
        const res = await fetch(`${API_BASE}/auth/update-profile`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ currentGmail: currentEmailKey, name, gmail: newEmailKey }),
        });
        const data = await res.json();
        if (!res.ok) {
          return { name: '', gmail: '', error: data.error || 'Failed to update profile.' };
        }

        setSettings({
          ...settings,
          userName: data.name,
          userGmail: data.gmail,
        });

        return { name: data.name, gmail: data.gmail };
      } catch (err) {
        console.warn('Profile update server call failed, falling back to local storage', err);
      }
    }

    // Local fallback update
    setSettings({
      ...settings,
      userName: name.trim(),
      userGmail: newEmailKey,
    });
    return { name: name.trim(), gmail: newEmailKey };
  },

  /**
   * Request OTP verification code
   */
  async forgotPassword(gmail: string, settings: Settings): Promise<OtpResponse> {
    const isOnline = await checkServerOnline();
    const emailKey = gmail.toLowerCase().trim();

    if (isOnline) {
      try {
        const res = await fetch(`${API_BASE}/auth/forgot-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ gmail: emailKey }),
        });
        const data = await res.json();
        if (!res.ok) {
          return { success: false, error: data.error || 'Failed to request OTP.' };
        }
        return { success: true, otp: data.otp };
      } catch (err) {
        console.warn('Forgot password server call failed, falling back to local simulation', err);
      }
    }

    // Local fallback
    const localGmail = (settings.userGmail || '').toLowerCase().trim();
    if (localGmail !== emailKey || localGmail === '') {
      return { success: false, error: 'No account found registered with this Gmail.' };
    }

    // Generate simulated code
    const simulatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    return { success: true, otp: simulatedOtp };
  },

  /**
   * Reset Password
   */
  async resetPassword(
    gmail: string,
    password: string,
    settings: Settings,
    setSettings: (s: Settings) => void
  ): Promise<ResetResponse> {
    const isOnline = await checkServerOnline();
    const emailKey = gmail.toLowerCase().trim();

    if (isOnline) {
      try {
        const res = await fetch(`${API_BASE}/auth/reset-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ gmail: emailKey, password }),
        });
        const data = await res.json();
        if (!res.ok) {
          return { success: false, error: data.error || 'Failed to reset password.' };
        }

        setSettings({
          ...settings,
          userPassword: password,
        });

        return { success: true };
      } catch (err) {
        console.warn('Password reset server call failed, falling back to local update', err);
      }
    }

    // Local fallback update
    setSettings({
      ...settings,
      userPassword: password,
    });
    return { success: true };
  },

  /**
   * Delete User Account
   */
  async deleteAccount(gmail: string): Promise<boolean> {
    const isOnline = await checkServerOnline();
    if (isOnline) {
      try {
        const res = await fetch(`${API_BASE}/auth/delete-account`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ gmail: gmail.toLowerCase().trim() }),
        });
        return res.ok;
      } catch (err) {
        console.warn('Delete account server call failed', err);
      }
    }
    return true;
  },
  /**
   * Save Gemini API Key to backend
   */
  async saveApiKey(gmail: string, geminiApiKey: string): Promise<{ success: boolean; error?: string }> {
    const isOnline = await checkServerOnline();
    if (isOnline) {
      try {
        const res = await fetch(`${API_BASE}/auth/save-api-key`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ gmail: gmail.toLowerCase().trim(), geminiApiKey }),
        });
        const data = await res.json();
        if (!res.ok) {
          return { success: false, error: data.error || 'Failed to save API key.' };
        }
        return { success: true };
      } catch (err) {
        console.warn('Save API key server call failed, key saved locally only.', err);
      }
    }
    // Offline: key is already saved in localStorage via settings, so treat as success
    return { success: true };
  },
};
