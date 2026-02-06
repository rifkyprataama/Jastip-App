import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaUniversity, FaUser, FaEnvelope, FaLock, FaRocket } from 'react-icons/fa';

// Komponen Input (Clean Minimalist Style)
const InputField = ({ label, icon, ...props }) => (
  <div className="mb-4">
    <label className="block text-slate-400 text-xs font-semibold mb-1 uppercase tracking-wide">{label}</label>
    <div className="relative group">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 group-focus-within:text-indigo-400 transition-colors">
        {icon}
      </div>
      <input 
        {...props} 
        className="w-full pl-10 pr-3 py-3 rounded-lg border border-slate-700 bg-slate-800/50 text-white placeholder-slate-600 focus:outline-none focus:bg-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all" 
        required 
      />
    </div>
  </div>
);

export default function Register() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    nama: "", email: "", password: "",
    namaBank: "", noRekening: "", atasNama: ""
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await axios.post("http://localhost:3000/api/register", formData);
      toast.success("✨ Akun Berhasil Dibuat!", { theme: "dark" });
      setTimeout(() => navigate("/"), 2000);
    } catch (error) {
      toast.error(`❌ ${error.response?.data?.message || "Gagal Mendaftar"}`, { theme: "dark" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // BACKGROUND POLOS (Minimalis Dark Gradient)
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 font-sans">
      <ToastContainer position="top-right" theme="dark" />

      {/* Card Minimalis */}
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-8 relative overflow-hidden">
        
        {/* Aksen Cahaya Halus di Pojok (Opsional, agar tidak terlalu 'mati') */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl"></div>
        
        <div className="relative z-10">
            <div className="flex items-center gap-3 mb-8 border-b border-slate-800 pb-6">
                <div className="bg-indigo-600/20 p-3 rounded-lg text-indigo-400">
                    <FaRocket className="text-xl" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-white">Buat Akun Enterprise</h2>
                    <p className="text-slate-500 text-sm">Bergabung dalam jaringan Jastip Profesional</p>
                </div>
            </div>

            <form onSubmit={handleRegister}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Kiri */}
                    <div className="space-y-4">
                        <InputField label="Nama Lengkap" name="nama" type="text" value={formData.nama} placeholder="Nama Anda" icon={<FaUser/>} onChange={handleChange} />
                        <InputField label="Email Institusi" name="email" type="email" value={formData.email} placeholder="email@uin.ac.id" icon={<FaEnvelope/>} onChange={handleChange} />
                        <InputField label="Password" name="password" type="password" value={formData.password} placeholder="******" icon={<FaLock/>} onChange={handleChange} />
                    </div>

                    {/* Kanan (Rekening) */}
                    <div className="space-y-4">
                        <div className="bg-slate-800/30 p-4 rounded-xl border border-slate-700/50">
                            <p className="text-indigo-400 text-xs font-bold mb-4 uppercase flex items-center gap-2">
                                <FaUniversity/> Info Pencairan Dana
                            </p>
                            <InputField label="Nama Bank" name="namaBank" type="text" value={formData.namaBank} placeholder="BCA / Mandiri" icon={<FaUniversity/>} onChange={handleChange} />
                            <InputField label="No. Rekening" name="noRekening" type="text" value={formData.noRekening} placeholder="1234xxx" icon={<FaUniversity/>} onChange={handleChange} />
                            <InputField label="Atas Nama" name="atasNama" type="text" value={formData.atasNama} placeholder="Pemilik Rekening" icon={<FaUser/>} onChange={handleChange} />
                        </div>
                    </div>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-800 flex items-center justify-between">
                    <Link to="/" className="text-slate-500 text-sm hover:text-white transition-colors">
                        ← Kembali ke Login
                    </Link>
                    <button type="submit" disabled={isLoading} className="bg-white text-slate-900 hover:bg-indigo-50 font-bold py-3 px-8 rounded-lg transition-all shadow-lg shadow-white/5 active:scale-95 disabled:opacity-50">
                        {isLoading ? "Memproses..." : "Daftar Sekarang"}
                    </button>
                </div>
            </form>
        </div>
      </div>
    </div>
  );
}