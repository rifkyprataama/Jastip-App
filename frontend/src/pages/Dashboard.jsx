import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import io from "socket.io-client";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaHashtag, FaPlane, FaPaperPlane, FaUserCircle, FaSignOutAlt, FaPlus, FaTimes, FaShoppingBag, FaBoxOpen } from 'react-icons/fa';
import { travelersData } from "../data/travelersData"; 

// Koneksi ke Backend
const socket = io.connect("http://localhost:3000");

const CHANNELS = [
    { id: "general-chat", label: "Obrolan Umum" },
    { id: "info-diskon", label: "Info Diskon & Sale" },
    { id: "request-barang", label: "Request Barang" }
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  
  const [viewMode, setViewMode] = useState("global"); 
  const [activeChannel, setActiveChannel] = useState("general-chat");

  const [messages, setMessages] = useState([]); 
  const [myOrders, setMyOrders] = useState([]); 
  const [currentMessage, setCurrentMessage] = useState("");
  const chatEndRef = useRef(null); 

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTraveler, setSelectedTraveler] = useState(null);
  const [formData, setFormData] = useState({ namaBarang: "", hargaEstimasi: "", catatan: "" });

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem("user"));
    if (!userData) { navigate("/"); return; }
    setUser(userData);

    socket.on("receiveMessage", (msg) => {
        if (msg.channel === activeChannel) {
            setMessages((prev) => [...prev, msg]);
            scrollToBottom();
        }
    });

    return () => socket.off("receiveMessage");
  }, [activeChannel]);

  // --- FUNGSI KHUSUS UNTUK REFRESH DATA PESANAN ---
  const fetchOrders = (userId) => {
      axios.get(`http://localhost:3000/api/requests/${userId}`)
           .then(res => setMyOrders(res.data))
           .catch(err => console.error("Gagal ambil pesanan:", err));
  };

  useEffect(() => {
      if (!user) return;

      if (viewMode === "global") {
          axios.get(`http://localhost:3000/api/chat/history?channel=${activeChannel}`)
               .then(res => { setMessages(res.data); scrollToBottom(); })
               .catch(err => console.error(err));
      } else if (viewMode === "orders") {
          // Panggil fungsi refresh saat mode berubah ke 'orders'
          fetchOrders(user.id);
      }
  }, [viewMode, activeChannel, user]);

  const scrollToBottom = () => {
    setTimeout(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, 100);
  };

  const handleLogout = () => {
      localStorage.clear();
      navigate("/");
  };

  const sendMessage = async (e) => {
      e.preventDefault();
      if (!currentMessage.trim()) return;

      await socket.emit("sendMessage", {
          senderId: user.id,
          content: currentMessage,
          channel: activeChannel
      });
      setCurrentMessage("");
  };

  const openRequestModal = (traveler) => {
      setSelectedTraveler(traveler);
      setIsModalOpen(true);
  };

  const submitRequest = async (e) => {
      e.preventDefault();
      if(!formData.namaBarang) return toast.warn("Nama barang wajib diisi!");

      try {
          // 1. Kirim Data ke Backend
          await axios.post("http://localhost:3000/api/request", {
              namaBarang: formData.namaBarang,
              hargaEstimasi: formData.hargaEstimasi,
              userID: user.id,
              notes: `Titip ke: ${selectedTraveler.nama}. ${formData.catatan}`
          });
          
          toast.success("✅ Berhasil Titip! Cek menu 'Pesanan Saya'", { theme: "dark" });
          setIsModalOpen(false);
          setFormData({ namaBarang: "", hargaEstimasi: "", catatan: "" });
          
          // 2. Pindah ke Halaman Pesanan
          setViewMode("orders"); 
          
          // 3. FORCE REFRESH DATA (SOLUSI BUG ANDA)
          // Kita paksa aplikasi mengambil data terbaru dari database
          fetchOrders(user.id);

      } catch (err) { 
          toast.error("Gagal mengirim request"); 
      }
  };

  return (
    <div className="flex h-screen bg-slate-900 text-white font-sans overflow-hidden">
      <ToastContainer position="top-center" theme="dark" />

      {/* SIDEBAR KIRI */}
      <div className="w-64 bg-slate-950 flex flex-col border-r border-slate-800 hidden md:flex">
        <div className="p-4 border-b border-slate-800 flex items-center gap-2">
            <div className="bg-indigo-600 p-1.5 rounded"><FaPlane className="text-white"/></div>
            <h1 className="font-bold text-lg tracking-wide">Jastip<span className="text-indigo-500">Hub</span></h1>
        </div>
        
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
            <div 
                onClick={() => setViewMode("orders")} 
                className={`flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer mb-6 transition-all ${
                    viewMode === 'orders' 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' 
                    : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                }`}
            >
                <FaShoppingBag className="text-lg"/> <span className="font-bold">Pesanan Saya</span>
            </div>

            <p className="text-xs font-bold text-slate-500 uppercase mb-2 px-2">Komunitas</p>
            {CHANNELS.map((ch) => (
                <div key={ch.id} 
                     onClick={() => { setViewMode("global"); setActiveChannel(ch.id); }} 
                     className={`flex items-center gap-2 px-3 py-2 rounded cursor-pointer transition-colors ${
                        viewMode === 'global' && activeChannel === ch.id 
                        ? 'bg-slate-800 text-white font-medium border-l-2 border-indigo-500' 
                        : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                     }`}>
                    <FaHashtag className={viewMode === 'global' && activeChannel === ch.id ? "text-indigo-400" : "text-slate-600"}/> 
                    <span>{ch.label}</span>
                </div>
            ))}
        </div>
        
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
                 <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center font-bold text-xs">
                    {user?.nama?.substring(0,2).toUpperCase()}
                 </div>
                 <div className="text-sm font-bold truncate w-24">{user?.nama}</div>
            </div>
            <button onClick={handleLogout} className="text-slate-500 hover:text-red-500 p-2"><FaSignOutAlt/></button>
        </div>
      </div>

      {/* TENGAH (MAIN CONTENT) */}
      <div className="flex-1 flex flex-col bg-slate-900 min-w-0">
        
        {viewMode === "global" && (
            <>
                <div className="h-14 border-b border-slate-800 flex items-center px-4 bg-slate-900 shadow-sm">
                    <FaHashtag className="text-slate-400 mr-2"/>
                    <h3 className="font-bold text-white">{CHANNELS.find(c => c.id === activeChannel)?.label}</h3>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-700">
                    {messages.map((msg, index) => {
                        const isMe = msg.sender?.nama === user?.nama;
                        return (
                            <div key={index} className={`flex gap-3 hover:bg-slate-800/30 p-1 rounded -mx-1`}>
                                <div className={`mt-1 w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${isMe ? 'bg-indigo-600' : 'bg-slate-600'}`}>
                                    <FaUserCircle className="text-xl text-white/80"/>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-baseline gap-2">
                                        <span className={`font-bold text-sm ${isMe ? 'text-indigo-400' : 'text-slate-200'}`}>{msg.sender?.nama}</span>
                                        <span className="text-[10px] text-slate-500">{new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                    </div>
                                    <p className="text-slate-300 text-sm">{msg.content}</p>
                                </div>
                            </div>
                        );
                    })}
                    <div ref={chatEndRef} />
                </div>

                <div className="p-4 bg-slate-900">
                    <form onSubmit={sendMessage} className="relative">
                        <input type="text" value={currentMessage} onChange={(e) => setCurrentMessage(e.target.value)} placeholder={`Kirim pesan ke #${activeChannel}`} className="w-full bg-slate-800 text-slate-200 rounded-lg pl-4 pr-12 py-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder-slate-500" />
                        <button type="submit" className="absolute right-3 top-3 text-slate-400 hover:text-indigo-400"><FaPaperPlane /></button>
                    </form>
                </div>
            </>
        )}

        {/* MODE PESANAN SAYA (Fix Button Issue) */}
        {viewMode === "orders" && (
            <div className="flex-1 overflow-y-auto p-8">
                <h2 className="text-2xl font-bold mb-2 flex items-center gap-3 text-white">
                    <FaBoxOpen className="text-indigo-500"/> Daftar Titipan Saya
                </h2>
                <p className="text-slate-400 mb-8 text-sm">Status akan berubah jika Traveler menyetujui. Pembayaran dilakukan nanti.</p>

                <div className="space-y-4">
                    {myOrders.length === 0 ? (
                        <div className="text-center py-16 bg-slate-800/50 rounded-2xl border border-slate-700 border-dashed">
                            <FaShoppingBag className="mx-auto text-4xl text-slate-600 mb-4"/>
                            <p className="text-slate-300 font-bold text-lg">Belum ada titipan aktif.</p>
                            
                            {/* PERBAIKAN: Hapus tombol bingung, ganti instruksi jelas */}
                            <p className="text-slate-500 mt-2 text-sm animate-pulse">
                                Silakan pilih Traveler dari daftar di sebelah kanan 👉<br/>
                                (Klik tombol "TITIP BARANG" pada kartu traveler)
                            </p>
                        </div>
                    ) : (
                        myOrders.map((order) => (
                            <div key={order.requestID} className="bg-slate-800 p-5 rounded-xl border border-slate-700 flex flex-col md:flex-row justify-between items-start md:items-center hover:border-indigo-500/50 transition-colors">
                                <div>
                                    <h4 className="font-bold text-lg text-white mb-1">{order.namaBarang}</h4>
                                    <p className="text-slate-400 text-sm mb-2">Estimasi: <span className="text-indigo-300">Rp {parseInt(order.hargaEstimasi).toLocaleString()}</span></p>
                                    <div className="flex gap-2">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                            order.status === 'Pending' ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' : 
                                            order.status === 'Approved' ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' : 
                                            'bg-green-500/10 text-green-500 border border-green-500/20'
                                        }`}>
                                            Status: {order.status}
                                        </span>
                                    </div>
                                </div>
                                <div className="mt-4 md:mt-0 text-right">
                                     <p className="text-xs text-slate-500">ID Request: #{order.requestID}</p>
                                     <p className="text-xs text-slate-500 mt-1">Pembayaran: COD / Nanti</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        )}
      </div>

      {/* KANAN (TRAVELER LIST) */}
      <div className="w-64 bg-slate-950 border-l border-slate-800 hidden lg:flex flex-col">
        <div className="p-4 border-b border-slate-800"><h3 className="font-bold text-slate-400 uppercase text-xs">Traveler Aktif</h3></div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {travelersData.map((traveler) => (
                <div key={traveler.id} className="group p-3 rounded bg-slate-900/50 hover:bg-slate-800 transition-all border border-transparent hover:border-slate-700 cursor-default">
                    <div className="flex items-center gap-3 mb-2">
                        <img src={traveler.avatar} className="w-8 h-8 rounded-full bg-slate-700 object-cover"/>
                        <div className="flex-1 min-w-0">
                            <div className="font-bold text-sm truncate text-slate-200">{traveler.nama}</div>
                            <div className="text-xs text-slate-500 flex items-center gap-1"><FaPlane className="text-[10px]"/> {traveler.tujuan}</div>
                        </div>
                    </div>
                    <button 
                        onClick={() => openRequestModal(traveler)}
                        className="w-full mt-1 bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold py-1.5 rounded transition-colors shadow-lg opacity-80 group-hover:opacity-100"
                    >
                        TITIP BARANG
                    </button>
                </div>
            ))}
        </div>
      </div>

      {/* MODAL */}
      {isModalOpen && selectedTraveler && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-800 w-full max-w-md rounded-2xl shadow-2xl border border-slate-700 p-6 animate-fade-in-up">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-xl font-bold text-white">Form Titipan</h3>
                        <p className="text-xs text-indigo-400 mt-0.5">Traveler: {selectedTraveler.nama} ({selectedTraveler.tujuan})</p>
                    </div>
                    <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white bg-slate-700 p-2 rounded-full"><FaTimes/></button>
                </div>
                
                <form onSubmit={submitRequest} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Nama Barang</label>
                        <input className="w-full bg-slate-900 border border-slate-600 p-3 rounded text-white focus:border-indigo-500 outline-none transition-colors" placeholder="Contoh: Tas Uniqlo" value={formData.namaBarang} onChange={e=>setFormData({...formData, namaBarang:e.target.value})} autoFocus/>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Estimasi Harga (Rp)</label>
                        <input className="w-full bg-slate-900 border border-slate-600 p-3 rounded text-white focus:border-indigo-500 outline-none transition-colors" type="number" placeholder="0" value={formData.hargaEstimasi} onChange={e=>setFormData({...formData, hargaEstimasi:e.target.value})}/>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Catatan / Link</label>
                        <textarea rows="3" className="w-full bg-slate-900 border border-slate-600 p-3 rounded text-white focus:border-indigo-500 outline-none text-sm transition-colors" placeholder="Warna hitam, ukuran L..." value={formData.catatan} onChange={e=>setFormData({...formData, catatan:e.target.value})}></textarea>
                    </div>
                    
                    <div className="bg-yellow-500/10 p-3 rounded border border-yellow-500/20 text-xs text-yellow-500 mt-2">
                        ⚠ <strong>Info Pembayaran:</strong> Pembayaran dilakukan nanti (COD/Transfer) setelah Traveler menyetujui & membelikan barang Anda.
                    </div>

                    <button className="w-full bg-indigo-600 p-3 rounded-lg font-bold hover:bg-indigo-500 text-white mt-2 shadow-lg flex items-center justify-center gap-2">
                        <FaPaperPlane/> Kirim Titipan
                    </button>
                </form>
            </div>
        </div>
      )}
    </div>
  );
}