import React, { useState } from 'react';
import {
  Lock,
  User,
  Shield,
  Eye,
  EyeOff,
  LogIn,
  Clock,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { authService, DEFAULT_USERS } from '../services/authService';
import type { UserAccount } from '../types/auth';
import { ROLE_LABELS } from '../types/auth';

interface LoginPageProps {
  onLoginSuccess: (user: UserAccount) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const registeredUsers = authService.getUsers() || DEFAULT_USERS;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim()) {
      setError('Masukkan username akun Anda.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const result = authService.login(username, password);
      setLoading(false);
      if (result.success && result.user) {
        onLoginSuccess(result.user);
      } else {
        setError(result.error || 'Login gagal.');
      }
    }, 250);
  };

  const handleQuickLogin = (user: UserAccount) => {
    setUsername(user.username);
    setPassword(user.password || 'password123');
    setError('');
    const loggedIn = authService.quickLogin(user.id);
    if (loggedIn) {
      onLoginSuccess(loggedIn);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans select-none">
      {/* Background Ambience & Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/20 via-slate-950 to-slate-950 pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b12_1px,transparent_1px),linear-gradient(to_bottom,#1e293b12_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      {/* Decorative Glow Orbs */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-xl space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 shadow-xl shadow-cyan-950 border border-cyan-400/30 p-2.5 mx-auto">
            <svg className="w-full h-full" viewBox="0 0 140 100" fill="none">
              <path d="M38 18L10 50L38 82L48 72L28 50L48 28L38 18Z" fill="#ffffff" />
              <path d="M50 28L32 50L50 72L58 64L46 50L58 36L50 28Z" fill="#38bdf8" />
            </svg>
          </div>

          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-wide">
              PT JEMBATAN DATA PANGRANGO
            </h1>
            <p className="text-xs font-semibold text-cyan-400 uppercase tracking-widest mt-0.5">
              NOC & Customer Support Portal • RFO Generator
            </p>
          </div>

          <div className="inline-flex items-center gap-2 bg-slate-900/90 border border-slate-800 px-3 py-1 rounded-full text-[11px] text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Sistem Otentikasi & Hak Akses Aktif (RBAC)</span>
          </div>
        </div>

        {/* Login Box */}
        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/80 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Lock className="w-4 h-4 text-cyan-400" />
                Masuk ke Akun Anda
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Nama pembuat RFO akan otomatis tersimpan sesuai akun login
              </p>
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 flex items-center gap-2.5 text-xs text-red-300 animate-shake">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Username Akun
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Contoh: admin, noc, atau cs"
                  className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all placeholder:text-slate-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password"
                  className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all placeholder:text-slate-600"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-950 transition-all cursor-pointer active:scale-98 disabled:opacity-50"
            >
              <LogIn className="w-4 h-4" />
              <span>{loading ? 'Memverifikasi...' : 'Masuk ke Portal RFO'}</span>
            </button>
          </form>

          {/* Quick Login / Akun Terdaftar */}
          <div className="border-t border-slate-800/80 pt-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Pilih Cepat Akun Terdaftar (1-Klik Masuk)
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                {registeredUsers.length} Akun
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {registeredUsers.map((user) => {
                const badge = ROLE_LABELS[user.role];
                return (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => handleQuickLogin(user)}
                    className="p-3 rounded-xl bg-slate-950/60 hover:bg-slate-800/70 border border-slate-800 hover:border-cyan-500/50 text-left transition-all group flex flex-col justify-between cursor-pointer space-y-1.5"
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-7 h-7 rounded-lg bg-gradient-to-tr ${
                            user.avatarColor || 'from-cyan-600 to-blue-600'
                          } flex items-center justify-center text-white text-xs font-bold shadow-sm`}
                        >
                          {user.name.charAt(0)}
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-xs font-bold text-white group-hover:text-cyan-300 truncate">
                            {user.name}
                          </p>
                          <p className="text-[10px] text-slate-400 truncate">
                            @{user.username}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase shrink-0 ${badge.badgeClass}`}
                      >
                        {badge.label}
                      </span>
                    </div>

                    <div className="text-[10px] text-slate-400 pt-0.5 border-t border-slate-800/60 flex items-center justify-between">
                      <span className="truncate">{user.position}</span>
                      <span className="text-cyan-400 font-semibold group-hover:underline text-[9px] shrink-0">
                        Masuk →
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center text-[11px] text-slate-500 flex items-center justify-center gap-3">
          <span className="flex items-center gap-1">
            <Shield className="w-3.5 h-3.5 text-cyan-500" />
            Keamanan Tingkat Sesi Lokal
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-cyan-500" />
            WIB (UTC+7)
          </span>
        </div>
      </div>
    </div>
  );
};
