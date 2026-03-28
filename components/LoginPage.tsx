
import React, { useState } from 'react';
import { LockClosedIcon, UserIcon, ShieldCheckIcon } from '@heroicons/react/24/solid';

interface LoginPageProps {
  onLogin: (username: string) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // محاكاة عملية التحقق من الهوية ببيانات alqadhisoft (حروف صغيرة)
    setTimeout(() => {
      if (username === 'alqadhisoft' && password === 'alqadhisoft') {
        onLogin(username);
      } else {
        setError('اسم المستخدم أو كلمة المرور غير صحيحة');
        setLoading(false);
      }
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-cairo overflow-hidden relative">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[100px]"></div>
      
      <div className="w-full max-w-md bg-slate-900/50 backdrop-blur-xl border border-white/10 p-8 rounded-[2.5rem] shadow-2xl relative z-10">
        <div className="flex flex-col items-center mb-10">
          <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-indigo-500/30 mb-6 rotate-3">
            <ShieldCheckIcon className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-2xl font-black text-white text-center">الأرشفة الذكية لمخازن مرور م. تعز</h1>
          <p className="text-indigo-400 text-sm font-bold mt-2 uppercase tracking-widest">إدارة مرور محافظة تعز</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-slate-400 text-xs font-bold mb-2 pr-2">اسم المستخدم</label>
            <div className="relative">
              <UserIcon className="w-5 h-5 text-slate-500 absolute top-3 right-4" />
              <input
                type="text"
                required
                className="w-full bg-slate-800/50 border border-white/5 rounded-2xl py-3 pr-12 pl-4 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all font-medium"
                placeholder="أدخل اسم المستخدم"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 text-xs font-bold mb-2 pr-2">كلمة المرور</label>
            <div className="relative">
              <LockClosedIcon className="w-5 h-5 text-slate-500 absolute top-3 right-4" />
              <input
                type="password"
                required
                className="w-full bg-slate-800/50 border border-white/5 rounded-2xl py-3 pr-12 pl-4 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all font-medium"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold p-3 rounded-xl text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-2xl shadow-xl shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <span>تسجيل الدخول للنظام</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-tighter">
            تنبيه: هذا النظام مخصص لموظفي إدارة المرور فقط
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
