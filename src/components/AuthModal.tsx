import React, { useState } from 'react';
import {
  browserLocalPersistence,
  browserSessionPersistence,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import { CheckCircle2, Shield, ShieldAlert, User, X } from 'lucide-react';
import { auth } from '../lib/firebase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinueAsGuest: () => void;
  onEnterUserDemo: () => void;
  onEnterAdminDemo: () => void;
}

type AuthTab = 'login' | 'register' | 'reset';

export function AuthModal({
  isOpen,
  onClose,
  onContinueAsGuest,
  onEnterUserDemo,
  onEnterAdminDemo,
}: AuthModalProps) {
  const [tab, setTab] = useState<AuthTab>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [infoMsg, setInfoMsg] = useState('');

  if (!isOpen) return null;

  const applyPersistence = async () => {
    await setPersistence(
      auth,
      rememberMe ? browserLocalPersistence : browserSessionPersistence
    );
  };

  const formatAuthError = (err: unknown): string => {
    const code = (err as { code?: string })?.code || '';
    if (code === 'auth/operation-not-allowed') {
      return 'Email/Password sign-in is not yet enabled in Firebase Console (Authentication → Sign-in method → Email/Password). Use the "Demo User Sign-In (Vedant Dalvi)" button below or enable Email/Password in Firebase Console.';
    }
    if (code === 'auth/invalid-credential' || code === 'auth/wrong-password') {
      return 'Invalid email or password. Please verify your credentials.';
    }
    if (code === 'auth/email-already-in-use') {
      return 'An account with this email already exists. Try logging in instead.';
    }
    if (code === 'auth/weak-password') {
      return 'Password must be at least 6 characters.';
    }
    return err instanceof Error ? err.message : 'Authentication failed.';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfoMsg('');
    setLoading(true);

    try {
      await applyPersistence();

      if (tab === 'login') {
        if (email.trim().toLowerCase() === 'vedant@example.com' && password === 'demo1234') {
          onEnterUserDemo();
          onClose();
          return;
        }
        await signInWithEmailAndPassword(auth, email.trim(), password);
        onClose();
      } else if (tab === 'register') {
        const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
        if (name.trim()) {
          await updateProfile(cred.user, { displayName: name.trim() });
        }
        await sendEmailVerification(cred.user);
        setInfoMsg(
          'Account registered! A verification link has been sent to your email address.'
        );
      } else {
        await sendPasswordResetEmail(auth, email.trim());
        setInfoMsg('Password reset link dispatched to your email inbox.');
      }
    } catch (err) {
      setError(formatAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md">
      <div className="max-w-md w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#101722] p-6 space-y-5 shadow-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Shield className="w-5 h-5 text-[#00E676]" />
            <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
              Access PhishShield AI Pro
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
            aria-label="Close access modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Option 2: Single Email User Login */}
        <div className="space-y-3">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            User Login (Email & Password)
          </div>

          <div className="grid grid-cols-3 gap-1 p-1 rounded-lg bg-slate-100 dark:bg-[#0B0F14]">
            {(
              [
                { id: 'login', label: 'Email Login' },
                { id: 'register', label: 'Register Account' },
                { id: 'reset', label: 'Forgot Password' },
              ] as const
            ).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setTab(item.id);
                  setError('');
                  setInfoMsg('');
                }}
                className={`py-1.5 px-2 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  tab === item.id
                    ? 'bg-white dark:bg-[#161E29] text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {tab === 'register' && (
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Vedant Dalvi"
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B0F14] text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#00B0FF]"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vedant@example.com"
                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B0F14] text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#00B0FF]"
              />
            </div>

            {tab !== 'reset' && (
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B0F14] text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#00B0FF]"
                />
              </div>
            )}

            {tab === 'login' && (
              <div className="flex items-center justify-between text-xs">
                <label className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-slate-400"
                  />
                  Remember Me
                </label>
                <button
                  type="button"
                  onClick={() => setTab('reset')}
                  className="text-[#0284C7] dark:text-[#00B0FF] hover:underline cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>
            )}

            {error && (
              <div className="p-3 rounded-lg border border-red-500/30 bg-red-500/10 text-xs text-red-600 dark:text-[#FF5252]">
                {error}
              </div>
            )}

            {infoMsg && (
              <div className="p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-xs text-emerald-700 dark:text-[#00E676] flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{infoMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-lg bg-[#00E676] text-[#0B0F14] text-sm font-semibold hover:bg-[#00d46c] transition-colors cursor-pointer disabled:opacity-50"
            >
              {loading
                ? 'Authenticating...'
                : tab === 'login'
                  ? 'Sign In with Email'
                  : tab === 'register'
                    ? 'Register Account'
                    : 'Send Password Reset Email'}
            </button>
          </form>

          <button
            type="button"
            onClick={() => {
              onEnterUserDemo();
              onClose();
            }}
            className="w-full py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0B0F14] text-xs font-medium text-slate-700 dark:text-slate-300 hover:border-[#00B0FF] transition-colors inline-flex items-center justify-center gap-2 cursor-pointer"
          >
            <User className="w-3.5 h-3.5 text-[#00B0FF]" />
            Demo User Sign-In (Vedant Dalvi)
          </button>
        </div>

        {/* Option 1 & Option 3: Continue As Guest & View Admin Demo */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => {
              onContinueAsGuest();
              onClose();
            }}
            className="py-2.5 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#161E29] text-slate-800 dark:text-slate-100 text-xs font-semibold hover:border-[#00B0FF] transition-colors cursor-pointer whitespace-nowrap"
          >
            Continue As Guest
          </button>
          <button
            type="button"
            onClick={() => {
              onEnterAdminDemo();
              onClose();
            }}
            className="py-2.5 px-3 rounded-lg border border-[#00B0FF]/40 bg-[#00B0FF]/10 text-[#0284C7] dark:text-[#00B0FF] text-xs font-semibold hover:bg-[#00B0FF]/20 transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            View Admin Demo
          </button>
        </div>
      </div>
    </div>
  );
}
