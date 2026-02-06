import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import io from "socket.io-client";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaHashtag, FaPlane, FaPaperPlane, FaUserCircle, FaSignOutAlt, FaPlus, FaTimes } from 'react-icons/fa';
import { travelersData } from "../data/travelersData"; 

const socket = io.connect("http://localhost:3000");

// DAFTAR CHANNEL TETAP
const CHANNELS = [
    { id: "general-chat", label: "General Chat" },
    { id: "diskusi-jepang", label: "Diskusi Jepang" },
    { id: "diskusi-korea", label: "Diskusi Korea" },
    { id: "request-barang", label: "Request Barang" }
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  
  // STATE BARU: Channel Aktif
  const [activeChannel, setActiveChannel] = useState("general-chat");

  const [messages, setMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const chatEndRef = useRef(null); 

  // State Request Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTraveler, setSelectedTraveler] = useState(null);
  const [formData, setFormData] = useState({ namaBarang: "", hargaEstimasi: "", catatan: "" });

  // 1. Load User
  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem("user"));
    if (!userData) { navigate("/"); return; }
    setUser(userData);
  }, []);

  // 2. Load Chat History SAAT CHANNEL BERUBAH
  useEffect(() => {
    // Panggil API dengan parameter ?channel=...
    axios.get(`http://localhost:3000/api/chat/history?channel=${activeChannel}`)
        .then((res) => {
            setMessages(res.data);
            scrollToBottom();
        })
        .catch((err) => console.error(err));
  }, [activeChannel]); // <- Kuncinya disini: Re-run saat activeChannel ganti

  // 3. Listen Socket Realtime
  useEffect(() => {
    socket.on("receiveMessage", (newMessage) => {
        // HANYA TAMPILKAN jika pesan itu untuk channel yang sedang dibuka
        if (newMessage.channel === activeChannel) {
            setMessages((prev) => [...prev, newMessage]);
            scrollToBottom();
        }
    });
    return () => socket.off("receiveMessage");
  }, [activeChannel]); // <- Re-bind saat channel ganti

  const scrollToBottom = () => {
    setTimeout(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, 100);
  };

  const handleLogout = () => {
      localStorage.clear();
      navigate("/");
  };

  const sendMessage = async (e) => {
      e.preventDefault();
      if (currentMessage.trim() === "") return;

      const messageData = {
          senderId: user.id,
          content: currentMessage,
          channel: activeChannel // KIRIM CHANNEL KE SERVER
      };

      await socket.emit("sendMessage", messageData);
      setCurrentMessage("");
  };

  // --- LOGIC TITIP (REQUEST) ---
  const openRequestModal = (traveler) => {
      setSelectedTraveler(traveler);
      setIsModalOpen(true);
  };

  const submitRequest = async (e) => {
      e.preventDefault();
      if(!formData.namaBarang || !formData.hargaEstimasi) return toast.warn("Lengkapi data barang");

      try {
          await axios.post("http://localhost:3000/api/request", {
              namaBarang: formData.namaBarang,
              hargaEstimasi: formData.hargaEstimasi,
              userID: user.id,
              notes: `Titip ke: ${selectedTraveler.nama} (${selectedTraveler.tujuan}). ${formData.catatan}`
          });
          toast.success(`✅ Request terkirim ke ${selectedTraveler.nama}!`, { theme: "dark" });
          setIsModalOpen(false);
          setFormData({ namaBarang: "", hargaEstimasi: "", catatan: "" });
      } catch (err) {
          toast.error("Gagal kirim request", { theme: "dark" });
      }
  };

  return (
    <div className="flex h-screen bg-slate-900 text-white font-sans overflow-hidden">
      <ToastContainer position="top-center" theme="dark" />

      {/* KOLOM 1: CHANNEL LIST (KIRI) */}
      <div className="w-64 bg-slate-950 flex flex-col border-r border-slate-800 hidden md:flex">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h1 className="font-bold text-lg tracking-wide">Jastip<span className="text-indigo-500">Hub</span></h1>
            <button onClick={handleLogout} className="text-slate-500 hover:text-red-500"><FaSignOutAlt/></button>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
            <p className="text-xs font-bold text-slate-500 uppercase mb-2 px-2">Text Channels</p>
            
            {/* MAPPING CHANNEL DARI ARRAY */}
            {CHANNELS.map((ch) => (
                <div 
                    key={ch.id}
                    onClick={() => setActiveChannel(ch.id)} // GANTI CHANNEL SAAT KLIK
                    className={`flex items-center gap-2 px-3 py-2 rounded cursor-pointer transition-colors ${
                        activeChannel === ch.id 
                        ? 'bg-slate-800 text-white font-medium' // Style Aktif
                        : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200' // Style Tidak Aktif
                    }`}
                >
                    <FaHashtag className={activeChannel === ch.id ? "text-indigo-400" : "text-slate-500"}/> 
                    <span>{ch.id}</span>
                </div>
            ))}
        </div>
        
        {/* User Info Bawah */}
        <div className="p-3 bg-slate-950/50 border-t border-slate-800 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-xs">
                {user?.nama?.substring(0,2).toUpperCase()}
            </div>
            <div className="flex-1">
                <div className="text-sm font-bold truncate w-24">{user?.nama}</div>
                <div className="text-xs text-green-400">● Online</div>
            </div>
        </div>
      </div>

      {/* KOLOM 2: CHAT ROOM UTAMA (TENGAH) */}
      <div className="flex-1 flex flex-col bg-slate-900 min-w-0">
        <div className="h-14 border-b border-slate-800 flex items-center px-4 bg-slate-900 shadow-sm">
            <FaHashtag className="text-slate-400 mr-2"/>
            <h3 className="font-bold text-white">{activeChannel}</h3>
            <span className="ml-4 text-xs text-slate-400 border-l border-slate-700 pl-4 hidden sm:block">
                {CHANNELS.find(c => c.id === activeChannel)?.label}
            </span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-700">
            {messages.length === 0 ? (
                <div className="text-center text-slate-600 mt-10">Belum ada pesan di #{activeChannel}. Jadilah yang pertama!</div>
            ) : (
                messages.map((msg, index) => {
                    const isMe = msg.sender?.nama === user?.nama;
                    return (
                        <div key={index} className={`flex gap-3 hover:bg-slate-800/30 p-1 rounded -mx-1`}>
                            <div className="mt-1 flex-shrink-0">
                                 <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isMe ? 'bg-indigo-600' : 'bg-slate-600'}`}>
                                    <FaUserCircle className="text-2xl text-white/80"/>
                                 </div>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-baseline gap-2">
                                    <span className={`font-bold cursor-pointer ${isMe ? 'text-indigo-400' : 'text-white'}`}>
                                        {msg.sender?.nama || "Unknown"}
                                    </span>
                                    <span className="text-[10px] text-slate-500">
                                        {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </span>
                                </div>
                                <p className="text-slate-300 text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                            </div>
                        </div>
                    );
                })
            )}
            <div ref={chatEndRef} />
        </div>

        <div className="p-4 bg-slate-900">
            <form onSubmit={sendMessage} className="relative">
                <input 
                    type="text" 
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    placeholder={`Kirim pesan ke #${activeChannel}`}
                    className="w-full bg-slate-800 text-slate-200 rounded-lg pl-4 pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-500"
                />
                <button type="submit" className="absolute right-3 top-3 text-slate-400 hover:text-indigo-400 transition-colors">
                    <FaPaperPlane />
                </button>
            </form>
        </div>
      </div>

      {/* KOLOM 3: TRAVELER LIST & TITIP ACTION (KANAN) */}
      <div className="w-64 bg-slate-950 border-l border-slate-800 hidden lg:flex flex-col">
        <div className="p-4 border-b border-slate-800">
            <h3 className="font-bold text-slate-400 uppercase text-xs mb-1">Traveler Aktif — {travelersData.length}</h3>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
            {travelersData.map((traveler) => (
                <div key={traveler.id} className="group flex items-center gap-3 p-2 rounded hover:bg-slate-800 transition-all cursor-pointer">
                    <div className="relative">
                        <img src={traveler.avatar} alt="avatar" className="w-9 h-9 rounded-full object-cover bg-slate-700"/>
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-slate-950 rounded-full"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm text-slate-200 truncate">{traveler.nama}</div>
                        <div className="text-xs text-slate-500 truncate flex items-center gap-1">
                            <FaPlane className="text-[10px]"/> {traveler.tujuan}
                        </div>
                    </div>
                    {/* TOMBOL TITIP: Muncul saat Hover */}
                    <button 
                        onClick={() => openRequestModal(traveler)}
                        className="opacity-0 group-hover:opacity-100 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold px-2 py-1 rounded transition-opacity shadow-lg"
                    >
                        TITIP
                    </button>
                </div>
            ))}
        </div>
      </div>

      {/* MODAL FORM TITIP */}
      {isModalOpen && selectedTraveler && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-800 w-full max-w-md rounded-2xl shadow-2xl border border-slate-700 animate-fade-in-up">
                <div className="flex justify-between items-center p-5 border-b border-slate-700">
                    <div>
                        <h3 className="text-xl font-bold text-white">Titip Barang</h3>
                        <p className="text-xs text-indigo-400 mt-1">
                            Via traveler: <span className="font-bold text-white">{selectedTraveler.nama}</span> 
                        </p>
                    </div>
                    <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white bg-slate-700 p-2 rounded-full"><FaTimes /></button>
                </div>

                <form onSubmit={submitRequest} className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-400 mb-1 uppercase">Nama Barang</label>
                        <input type="text" className="w-full bg-slate-900 border border-slate-600 rounded p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Ex: Sepatu Nike" value={formData.namaBarang} onChange={(e) => setFormData({...formData, namaBarang: e.target.value})} autoFocus />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-400 mb-1 uppercase">Estimasi Harga (Rp)</label>
                        <input type="number" className="w-full bg-slate-900 border border-slate-600 rounded p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="0" value={formData.hargaEstimasi} onChange={(e) => setFormData({...formData, hargaEstimasi: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-400 mb-1 uppercase">Catatan</label>
                        <textarea rows="3" className="w-full bg-slate-900 border border-slate-600 rounded p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm" placeholder="Warna, Ukuran..." value={formData.catatan} onChange={(e) => setFormData({...formData, catatan: e.target.value})}></textarea>
                    </div>
                    <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-lg shadow-lg mt-2 flex items-center justify-center gap-2"><FaPlus /> Kirim Request</button>
                </form>
            </div>
        </div>
      )}

    </div>
  );
}