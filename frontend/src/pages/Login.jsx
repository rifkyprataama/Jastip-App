import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaEnvelope, FaLock, FaCube } from 'react-icons/fa';

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await axios.post("http://localhost:3000/api/login", { email, password });
      localStorage.setItem("token", res.data.token); 
      localStorage.setItem("user", JSON.stringify(res.data.user));
      
      toast.success(`Selamat Datang, ${res.data.user.nama}`, { theme: "dark" });
      setTimeout(() => navigate("/dashboard"), 1500);

    } catch (error) {
      toast.error("Login Gagal. Cek kredensial Anda.", { theme: "dark" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // BACKGROUND POLOS (Clean Dark)
    <div className="min-h-screen flex items-center justify-center bg-slate-950 font-sans">
      <ToastContainer position="top-center" theme="dark" />

      {/* Card Login Minimalis */}
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-8">
        
        <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-600 mb-4 text-white shadow-lg shadow-indigo-600/30">
                <FaCube className="text-xl" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Jastip Portal</h1>
            <p className="text-slate-500 text-sm mt-1">Silakan masuk untuk melanjutkan</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-slate-400 text-xs font-semibold mb-1 uppercase">Email</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                  <FaEnvelope />
                </div>
                <input
                  type="email"
                  required
                  className="w-full pl-10 pr-3 py-3 rounded-lg border border-slate-700 bg-slate-800/50 text-white placeholder-slate-600 focus:outline-none focus:bg-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  placeholder="name@company.com"
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                 <label className="block text-slate-400 text-xs font-semibold uppercase">Password</label>
                 <a href="#" className="text-xs text-indigo-400 hover:text-indigo-300">Lupa?</a>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                  <FaLock />
                </div>
                <input
                  type="password"
                  required
                  className="w-full pl-10 pr-3 py-3 rounded-lg border border-slate-700 bg-slate-800/50 text-white placeholder-slate-600 focus:outline-none focus:bg-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  placeholder="••••••••"
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg shadow-lg shadow-indigo-500/20 transition-all active:scale-95 disabled:opacity-50 mt-2"
            >
              {isLoading ? "Memuat..." : "Masuk Dashboard"}
            </button>
        </form>

        <div className="mt-8 text-center border-t border-slate-800 pt-6">
             <p className="text-slate-500 text-sm">
                 Belum punya akun? 
                 <Link to="/register" className="text-indigo-400 font-semibold ml-1 hover:text-indigo-300 transition-colors">
                   Daftar
                 </Link>
             </p>
        </div>
      </div>
    </div>
  );
}