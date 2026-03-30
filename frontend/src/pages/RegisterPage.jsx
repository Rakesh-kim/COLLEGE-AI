import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../api/apiService';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { RiEyeLine, RiEyeOffLine, RiLockLine, RiMailLine, RiUser3Line } from 'react-icons/ri';

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const validate = () => {
    if (!form.name.trim()) { toast.error('Please enter your full name.'); return false; }
    if (!form.email.includes('@')) { toast.error('Please enter a valid email.'); return false; }
    if (form.password.length < 8) { toast.error('Password must be at least 8 characters.'); return false; }
    if (form.password !== form.confirm) { toast.error('Passwords do not match.'); return false; }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await authAPI.register({
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });
      login(res.data.token, res.data.user);
      toast.success('Account created! Let\'s get you registered 🎉');
      navigate('/chat');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  // Password strength indicator
  const strength = form.password.length === 0 ? 0
    : form.password.length < 8 ? 1
    : /[A-Z]/.test(form.password) && /[0-9]/.test(form.password) && /[^a-zA-Z0-9]/.test(form.password) ? 3
    : 2;
  const strengthLabels = ['', 'Weak', 'Medium', 'Strong'];
  const strengthColors = ['', 'bg-red-500', 'bg-amber-500', 'bg-emerald-500'];

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-slide-up">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-600 text-3xl mb-4 shadow-lg shadow-primary-600/30">🎓</div>
          <h1 className="text-2xl font-bold text-white">Create Account</h1>
          <p className="text-slate-400 mt-1 text-sm">Join the smart hostel registration system</p>
        </div>

        <div className="glass-card p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="section-label mb-2 block">Full Name</label>
              <div className="relative">
                <RiUser3Line className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-lg" />
                <input type="text" name="name" value={form.name} onChange={handleChange}
                  placeholder="John Doe" className="input-field pl-10" autoComplete="name" />
              </div>
            </div>
            <div>
              <label className="section-label mb-2 block">Email Address</label>
              <div className="relative">
                <RiMailLine className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-lg" />
                <input type="email" name="email" value={form.email} onChange={handleChange}
                  placeholder="student@college.edu" className="input-field pl-10" autoComplete="email" />
              </div>
            </div>
            <div>
              <label className="section-label mb-2 block">Password</label>
              <div className="relative">
                <RiLockLine className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-lg" />
                <input type={showPass ? 'text' : 'password'} name="password" value={form.password}
                  onChange={handleChange} placeholder="Min 8 characters" className="input-field pl-10 pr-10" />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-lg">
                  {showPass ? <RiEyeOffLine /> : <RiEyeLine />}
                </button>
              </div>
              {form.password && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex gap-1 flex-1">
                    {[1,2,3].map(i => (
                      <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= strength ? strengthColors[strength] : 'bg-white/10'}`} />
                    ))}
                  </div>
                  <span className="text-xs text-slate-400">{strengthLabels[strength]}</span>
                </div>
              )}
            </div>
            <div>
              <label className="section-label mb-2 block">Confirm Password</label>
              <div className="relative">
                <RiLockLine className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-lg" />
                <input type={showPass ? 'text' : 'password'} name="confirm" value={form.confirm}
                  onChange={handleChange} placeholder="Repeat password" className="input-field pl-10" />
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-3 mt-2">
              {loading
                ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Creating account…</span>
                : 'Create Account'}
            </button>
          </form>
          <p className="text-center text-sm text-slate-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-400 hover:text-primary-300 font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
