'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { authService } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('1. Attempting login...');

      const response = await authService.login({ email, password });
      console.log('2. Login response:', response);

      // Store user info in localStorage (for UI purposes)
      localStorage.setItem('user', JSON.stringify({
        email: response.email,
        role: response.role,
        weddingId: response.weddingId,
      }));
      console.log('3. User stored in localStorage');

      // Redirect based on role
      if (response.role === 'SUPER_ADMIN') {
        console.log('4. Redirecting to super-admin');
        router.push('/super-admin');
      } else if (response.role === 'COUPLE_ADMIN') {
        console.log('4. Redirecting to couple-admin');
        router.push('/couple-admin');
      } else {
        setError('Unknown user role');
      }
    } catch (err: any) {
      console.error('❌ Login error:', err); // ✅ Add this to see the actual error
      setError(err.response?.data?.message || err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 via-pink-50 to-orange-50">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="text-6xl mb-4"
          >
            💍
          </motion.div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent mb-2">
            Welcome Back
          </h1>
          <p className="text-gray-600">Sign in to manage your weddings</p>
        </div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-6"
          >
            <p className="text-red-700 text-sm font-medium">❌ {error}</p>
          </motion.div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-gray-900 focus:border-rose-400 focus:outline-none transition-colors"
              placeholder="username"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-gray-900 focus:border-rose-400 focus:outline-none transition-colors"
              placeholder="••••••••"
              required
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-4 rounded-lg font-semibold text-white transition-all ${loading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-rose-500 to-pink-500 hover:shadow-lg hover:scale-105'
              }`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Signing in...
              </span>
            ) : (
              'Sign In'
            )}
          </button>

          {/* <button
            type="button"
            onClick={async () => {
              try {
                console.log('🔍 DEBUG: Starting test');

                const response = await fetch('/api/auth/login', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  credentials: 'include',
                  body: JSON.stringify({
                    email: 'admin@wedding-cms.com',
                    password: 'Admin123!',
                  }),
                });

                console.log('🔍 DEBUG: Response status:', response.status);
                const data = await response.json();
                console.log('🔍 DEBUG: Response data:', data);
                console.log('🔍 DEBUG: data.role:', data.role);
                console.log('🔍 DEBUG: data.email:', data.email);

                // Test the actual authService
                const authResponse = await authService.login({
                  email: 'admin@wedding-cms.com',
                  password: 'Admin123!',
                });
                console.log('🔍 DEBUG: AuthService response:', authResponse);

              } catch (err) {
                console.error('🔍 DEBUG: Error:', err);
                if (err instanceof Error) {
                  console.error('🔍 DEBUG: Error stack:', err.stack);
                }
              }
            }}
            className="w-full py-2 bg-blue-500 text-white rounded mt-4"
          >
            🔍 Debug Test Login
          </button> */}
        </form>

        {/* Footer */}
        {/* <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Demo credentials:
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Email: admin@wedding-cms.com
          </p>
          <p className="text-xs text-gray-400">
            Password: Admin123!
          </p>
        </div> */}
      </motion.div>
    </div>
  );
}