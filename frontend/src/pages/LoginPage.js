import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { login, seedData } from '../lib/api';
import { GraduationCap, Sparkles, LayoutDashboard, Palette, Users } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@demo.com');
  const [password, setPassword] = useState('demo123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await login(email, password);
      localStorage.setItem('cms_token', response.token);
      localStorage.setItem('cms_user', JSON.stringify(response.user));

      // Seed demo data
      try {
        await seedData();
      } catch (seedErr) {
        // Ignore if already seeded
      }

      navigate('/dashboard');
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSkipLogin = async () => {
    // Bypass login - create demo user directly
    const demoUser = {
      id: 'demo-user-1',
      email: 'admin@demo.com',
      name: 'Demo Admin',
      role: 'admin'
    };
    localStorage.setItem('cms_token', 'demo-token-bypass');
    localStorage.setItem('cms_user', JSON.stringify(demoUser));

    // Try to seed demo data (non-blocking)
    try {
      await seedData();
    } catch (seedErr) {
      // Ignore if already seeded or if backend is not available
    }

    navigate('/dashboard');
  };

  const features = [
    { icon: LayoutDashboard, title: 'Drag & Drop Editor', desc: 'Build pages visually' },
    { icon: Palette, title: 'Custom Branding', desc: 'Match your school identity' },
    { icon: Users, title: 'Multi-Tenant', desc: 'Manage multiple schools' },
  ];

  return (
    <div className="login-page">
      {/* Left Side - Branding */}
      <div className="login-left">
        <div className="max-w-md">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-amber-400 rounded-xl flex items-center justify-center">
              <GraduationCap className="w-7 h-7 text-slate-900" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">CleverBox</h1>
              <p className="text-blue-200 text-sm">School Website CMS</p>
            </div>
          </div>

          <h2 className="text-4xl lg:text-5xl font-bold leading-tight mb-6">
            Beautiful School Websites,
            <span className="text-amber-400"> Made Simple</span>
          </h2>

          <p className="text-blue-100 text-lg mb-10 leading-relaxed">
            Create stunning, professional school websites with our intuitive drag-and-drop builder.
            No coding required.
          </p>

          <div className="space-y-4">
            {features.map((feature, idx) => (
              <div
                key={idx}
                className="flex items-center gap-4 p-4 rounded-xl bg-white/10 backdrop-blur-sm animate-slide-in-left"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <div className="w-10 h-10 bg-amber-400/20 rounded-lg flex items-center justify-center">
                  <feature.icon className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <p className="font-semibold">{feature.title}</p>
                  <p className="text-sm text-blue-200">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="login-right">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 text-blue-600 text-sm font-medium mb-4">
              <Sparkles className="w-4 h-4" />
              Demo Mode
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">Welcome Back</h3>
            <p className="text-slate-500">Sign in to manage your school websites</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-700">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@school.edu"
                className="h-12"
                data-testid="login-email-input"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-700">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="h-12"
                data-testid="login-password-input"
              />
            </div>

            {error && (
              <p className="text-red-500 text-sm text-center" data-testid="login-error">{error}</p>
            )}

            <Button
              type="submit"
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl"
              disabled={loading}
              data-testid="login-submit-btn"
            >
              {loading ? 'Signing In...' : 'Sign In to Dashboard'}
            </Button>
          </form>

          <div className="mt-4">
            <Button
              type="button"
              onClick={handleSkipLogin}
              variant="outline"
              className="w-full h-12 border-2 border-blue-200 text-blue-600 hover:bg-blue-50 font-semibold rounded-xl"
            >
              Skip Login (Demo Mode)
            </Button>
          </div>

          <div className="mt-6 p-4 bg-slate-50 rounded-xl">
            <p className="text-sm text-slate-600 text-center">
              <strong>Demo Credentials:</strong><br />
              Email: admin@demo.com<br />
              Password: demo123<br />
              <span className="text-xs text-slate-400 mt-2 block">Or click "Skip Login" to bypass authentication</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
