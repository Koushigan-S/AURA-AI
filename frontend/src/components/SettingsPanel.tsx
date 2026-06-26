import React from 'react';
import type { Settings } from '../types';
import { Key, Eye, EyeOff, BookOpen, Star, HelpCircle, Layers, Volume2, User, Mail, CheckCircle2, AlertCircle } from 'lucide-react';
import { authService } from '../services/auth';
import { validateApiKey } from '../services/gemini';

interface SettingsPanelProps {
  settings: Settings;
  setSettings: (s: Settings) => void;
  onDeleteAccount: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ settings, setSettings, onDeleteAccount }) => {
  const [showKey, setShowKey] = React.useState(false);
  const [profileName, setProfileName] = React.useState(settings.userName || '');
  const [profileGmail, setProfileGmail] = React.useState(settings.userGmail || '');
  const [profileError, setProfileError] = React.useState('');
  const [profileSuccess, setProfileSuccess] = React.useState('');
  const [profileLoading, setProfileLoading] = React.useState(false);

  const [apiKey, setApiKey] = React.useState(settings.geminiApiKey || '');
  const [apiKeyError, setApiKeyError] = React.useState('');
  const [apiKeySuccess, setApiKeySuccess] = React.useState('');
  const [keySaving, setKeySaving] = React.useState(false);

  const handleSaveApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiKeyError('');
    setApiKeySuccess('');

    if (!apiKey.trim()) {
      setApiKeyError('API Key cannot be empty.');
      return;
    }

    setKeySaving(true);
    try {
      const isValid = await validateApiKey(apiKey.trim());
      if (isValid) {
        updateSetting('geminiApiKey', apiKey.trim());
        setApiKeySuccess('Gemini API key saved and activated successfully!');
      } else {
        setApiKeyError('Invalid Gemini API Key or network error. Connection failed.');
      }
    } catch (err) {
      setApiKeyError('An error occurred while validating the API key.');
    } finally {
      setKeySaving(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!profileName.trim()) {
      setProfileError('Name cannot be empty.');
      return;
    }
    if (!emailRegex.test(profileGmail.trim())) {
      setProfileError('Please enter a valid Gmail / email address.');
      return;
    }

    setProfileLoading(true);
    try {
      const result = await authService.updateProfile(
        settings.userGmail || '',
        profileName,
        profileGmail,
        settings,
        setSettings
      );

      if (result.error) {
        setProfileError(result.error);
      } else {
        setProfileSuccess('Profile details updated successfully!');
      }
    } catch (err) {
      setProfileError('An unexpected server error occurred.');
    } finally {
      setProfileLoading(false);
    }
  };

  const updateSetting = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings({
      ...settings,
      [key]: value,
    });
  };

  return (
    <div className="w-full max-w-3xl mx-auto p-8 apple-glass apple-glass-light rounded-2xl border border-white/10 apple-transition">
      <div className="mb-8 border-b border-white/10 pb-6">
        <h2 className="text-3xl font-semibold text-white tracking-tight">System Configuration</h2>
        <p className="text-apple-gray text-sm mt-1">Configure AURA\'s AI engines and preferences. Your settings are stored locally in your browser.</p>
      </div>

      <div className="space-y-8">
        {/* User Profile Settings */}
        <form onSubmit={handleUpdateProfile} className="space-y-4 pb-6 border-b border-white/10">
          <h3 className="text-xs font-semibold text-white/95 uppercase tracking-wider">User Profile Configuration</h3>
          
          {profileError && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-300 text-xs px-3.5 py-2.5 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4.5 h-4.5 text-red-400 shrink-0" />
              <span>{profileError}</span>
            </div>
          )}
          {profileSuccess && (
            <div className="bg-green-500/10 border border-green-500/20 text-green-300 text-xs px-3.5 py-2.5 rounded-lg flex items-center gap-2">
              <CheckCircle2 className="w-4.5 h-4.5 text-green-400 shrink-0" />
              <span>{profileSuccess}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2 flex items-center gap-2">
                <User className="w-4 h-4 text-apple-blue" />
                Name
              </label>
              <input
                type="text"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                placeholder="Your Name"
                className="w-full bg-apple-black/45 border border-white/10 rounded-lg py-2.5 px-3 text-white text-sm focus:outline-none focus:ring-1 focus:ring-apple-blue focus:border-apple-blue placeholder:text-apple-gray/40"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2 flex items-center gap-2">
                <Mail className="w-4 h-4 text-apple-blue" />
                Gmail Address
              </label>
              <input
                type="email"
                value={profileGmail}
                onChange={(e) => setProfileGmail(e.target.value)}
                placeholder="your.email@gmail.com"
                className="w-full bg-apple-black/45 border border-white/10 rounded-lg py-2.5 px-3 text-white text-sm focus:outline-none focus:ring-1 focus:ring-apple-blue focus:border-apple-blue placeholder:text-apple-gray/40"
              />
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={profileLoading}
              className="py-2 px-5 bg-apple-blue hover:bg-apple-blue/90 disabled:bg-apple-blue/50 text-white rounded-lg text-xs font-semibold apple-transition flex items-center gap-2 shadow-sm"
            >
              {profileLoading ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>

        {/* Gemini API Key */}
        <div className="space-y-4 pb-6 border-b border-white/10">
          <h3 className="text-xs font-semibold text-white/95 uppercase tracking-wider">Gemini Integration</h3>

          {apiKeyError && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-300 text-xs px-3.5 py-2.5 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4.5 h-4.5 text-red-400 shrink-0" />
              <span>{apiKeyError}</span>
            </div>
          )}
          {apiKeySuccess && (
            <div className="bg-green-500/10 border border-green-500/20 text-green-300 text-xs px-3.5 py-2.5 rounded-lg flex items-center gap-2">
              <CheckCircle2 className="w-4.5 h-4.5 text-green-400 shrink-0" />
              <span>{apiKeySuccess}</span>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-white/90 mb-2 flex items-center gap-2">
              <Key className="w-4 h-4 text-apple-blue" />
              Gemini API Key
            </label>
            <div className="relative rounded-lg shadow-sm">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Paste your Gemini API key (e.g. AIzaSy...)"
                className="w-full bg-apple-black/45 border border-white/10 rounded-lg py-2.5 pl-3 pr-10 text-white text-sm focus:outline-none focus:ring-1 focus:ring-apple-blue focus:border-apple-blue placeholder:text-apple-gray/40 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-apple-gray hover:text-white"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-apple-gray mt-2 flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5" />
              No key? AURA runs in <span className="text-purple-400 font-medium">Offline Demo Mode</span> with fully loaded sample documents.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleSaveApiKey}
              disabled={keySaving || apiKey.trim() === '' || apiKey.trim() === settings.geminiApiKey}
              className="py-2 px-5 bg-apple-blue hover:bg-apple-blue/90 disabled:bg-white/5 disabled:text-white/35 disabled:border-white/5 disabled:cursor-not-allowed text-white rounded-lg text-xs font-semibold apple-transition flex items-center gap-2 shadow-sm"
            >
              {keySaving ? 'Verifying & Saving...' : apiKey.trim() === settings.geminiApiKey && settings.geminiApiKey !== '' ? 'API Key Saved & Active' : 'Save API Key'}
            </button>
          </div>
        </div>



        {/* Study Mode */}
        <div>
          <label className="block text-sm font-medium text-white/90 mb-3 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-purple-400" />
            Active Topic Mode
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Exam Mode */}
            <button
              onClick={() => updateSetting('topicMode', 'exam')}
              className={`p-4 rounded-xl border text-left apple-transition flex flex-col gap-2 ${
                settings.topicMode === 'exam'
                  ? 'border-apple-blue bg-apple-blue/10 text-white'
                  : 'border-white/10 bg-white/5 hover:bg-white/10 text-white/80'
              }`}
            >
              <span className="font-semibold text-sm flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" /> Exam Mode
              </span>
              <span className="text-xs text-apple-gray leading-relaxed">
                Concise study sheets, core flashcards, timelines, and intensive practice papers.
              </span>
            </button>

            {/* Story Mode */}
            <button
              onClick={() => updateSetting('topicMode', 'story')}
              className={`p-4 rounded-xl border text-left apple-transition flex flex-col gap-2 ${
                settings.topicMode === 'story'
                  ? 'border-apple-blue bg-apple-blue/10 text-white'
                  : 'border-white/10 bg-white/5 hover:bg-white/10 text-white/80'
              }`}
            >
              <span className="font-semibold text-sm flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-400" /> Story Mode
              </span>
              <span className="text-xs text-apple-gray leading-relaxed">
                Motifs, themes, characters, literary analysis. Automatic spoiler-protection enabled.
              </span>
            </button>

            {/* Concept Mode */}
            <button
              onClick={() => updateSetting('topicMode', 'concept')}
              className={`p-4 rounded-xl border text-left apple-transition flex flex-col gap-2 ${
                settings.topicMode === 'concept'
                  ? 'border-apple-blue bg-apple-blue/10 text-white'
                  : 'border-white/10 bg-white/5 hover:bg-white/10 text-white/80'
              }`}
            >
              <span className="font-semibold text-sm flex items-center gap-2">
                <Layers className="w-4 h-4 text-green-400" /> Concept Mode
              </span>
              <span className="text-xs text-apple-gray leading-relaxed">
                Deep-dives into logic, formula derivations, analogies, and interactive mind maps.
              </span>
            </button>
          </div>
        </div>

        {/* Feature Toggles */}
        <div className="border-t border-white/10 pt-6 space-y-4">
          <h3 className="text-sm font-semibold text-white/95 uppercase tracking-wider">Features Configuration</h3>

          <div className="flex items-center justify-between py-2 border-b border-white/5">
            <div>
              <span className="block text-sm font-medium text-white/90">AI-Powered Auto Highlighting</span>
              <span className="block text-xs text-apple-gray mt-0.5">Let AURA automatically highlight key content according to topic mode.</span>
            </div>
            <button
              onClick={() => updateSetting('enableAIHighlighting', !settings.enableAIHighlighting)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full apple-transition ${
                settings.enableAIHighlighting ? 'bg-apple-blue' : 'bg-white/10'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white apple-transition ${
                  settings.enableAIHighlighting ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-white/5">
            <div>
              <span className="block text-sm font-medium text-white/90">Adaptive Highlight Style Learning</span>
              <span className="block text-xs text-apple-gray mt-0.5">AURA learns your manual coloring preference (e.g. facts yellow, formula green).</span>
            </div>
            <button
              onClick={() => updateSetting('learnHighlightColors', !settings.learnHighlightColors)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full apple-transition ${
                settings.learnHighlightColors ? 'bg-apple-blue' : 'bg-white/10'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white apple-transition ${
                  settings.learnHighlightColors ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-white/5">
            <div>
              <span className="block text-sm font-medium text-white/90">Spoiler Protection</span>
              <span className="block text-xs text-apple-gray mt-0.5">Avoid summarizing critical plot points in story-based academic literature.</span>
            </div>
            <button
              onClick={() => updateSetting('spoilerProtection', !settings.spoilerProtection)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full apple-transition ${
                settings.spoilerProtection ? 'bg-apple-blue' : 'bg-white/10'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white apple-transition ${
                  settings.spoilerProtection ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between py-2">
            <div className="flex-1">
              <span className="block text-sm font-medium text-white/90">Voice Reader Speed</span>
              <span className="block text-xs text-apple-gray mt-0.5">Control the narration speed of explanations and highlights.</span>
            </div>
            <div className="flex items-center gap-3">
              <Volume2 className="w-4 h-4 text-apple-gray" />
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={settings.speechRate}
                onChange={(e) => updateSetting('speechRate', parseFloat(e.target.value))}
                className="w-24 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-apple-blue"
              />
              <span className="text-xs font-semibold text-white min-w-[2.5rem] text-right">{settings.speechRate}x</span>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="border-t border-red-500/20 pt-6 space-y-4">
          <h3 className="text-xs font-semibold text-red-500 uppercase tracking-wider flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500" /> Danger Zone
          </h3>
          <div className="p-4 bg-red-500/5 border border-red-500/10 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <span className="block text-sm font-semibold text-white">Delete Account</span>
              <span className="block text-xs text-apple-gray mt-1 max-w-md leading-relaxed">
                Permanently delete your account profile, uploaded documents, custom highlights, quizzes, and spaced-repetition flashcards.
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                const confirmed = window.confirm(
                  "WARNING: Are you absolutely sure you want to delete your account? This will permanently erase your profile and all your document data, flashcards, and quizzes. This action is irreversible!"
                );
                if (confirmed) {
                  onDeleteAccount();
                }
              }}
              className="w-full sm:w-auto py-2.5 px-4 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-semibold apple-transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer shrink-0 animate-pulse hover:animate-none"
            >
              Delete Account
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
