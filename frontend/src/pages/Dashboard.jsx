import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import io from "socket.io-client";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaHashtag, FaPlane, FaPaperPlane, FaUserCircle, FaSignOutAlt, FaPlus, FaTimes, FaShoppingBag, FaBoxOpen, FaInbox } from 'react-icons/fa';

const socket = io.connect("http://localhost:3000");

const CHANNELS = [
    { id: "general-chat", label: "Obrolan Umum" },
    { id: "request-barang", label: "Request Barang" }
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [myID, setMyID] = useState(null); // ID yang sudah dipastikan aman
  
  const [viewMode, setViewMode] = useState("global"); 
  const [activeChannel, setActiveChannel] = useState("general-chat");

  const [usersList, setUsersList] = useState([]); 
  const [messages, setMessages] = useState([]); 
  const [myOrders, setMyOrders] = useState([]); 
  const [incomingOrders, setIncomingOrders] = useState([]); 

  const [currentMessage, setCurrentMessage] = useState("");
  const chatEndRef = useRef(null); 

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null); 
  const [formData, setFormData] = useState({ namaBarang: "", hargaEstimasi: "", catatan: "" });

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem("user"));
    if (!userData) { navigate("/"); return; }
    
    // Cek ID User (userID atau id)
    const safeID = userData.userID || userData.id;
    
    if (!safeID) {
        console.error("ID User hilang / format salah. Auto logout.");
        localStorage.clear();
        navigate("/");
        return;
    }

    setUser(userData);
    setMyID(safeID);

    // Ambil Daftar User (Filter diri sendiri)
    axios.get("http://localhost:3000/api/users")
        .then(res => {
            const others = res.data.filter(u => (u.userID || u.id) !== safeID);
            setUsersList(others);
        });

    socket.on("receiveMessage", (msg) => {
        if (msg.channel === activeChannel) {
            setMessages((prev) => [...prev, msg]);
            scrollToBottom();
        }
    });
    return () => socket.off("receiveMessage");
  }, [activeChannel, navigate]);

  // LOAD DATA SESUAI MODE
  useEffect(() => {
      if (!myID) return;

      if (viewMode === "global") {
          axios.get(`http://localhost:3000/api/chat/history?channel=${activeChannel}`)
               .then(res => { setMessages(res.data); scrollToBottom(); });
      } else if (viewMode === "orders") {
          axios.get(`http://localhost:3000/api/requests/${myID}`)
               .then(res => setMyOrders(res.data));
      } else if (viewMode === "incoming") {
          axios.get(`http://localhost:3000/api/incoming-requests/${myID}`)
               .then(res => setIncomingOrders(res.data));
      }
  }, [viewMode, activeChannel, myID]);

  const scrollToBottom = () => { setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100); };
  
  const sendMessage = async (e) => {
      e.preventDefault();
      if (!currentMessage.trim()) return;
      await socket.emit("sendMessage", { senderId: myID, content: currentMessage, channel: activeChannel });
      setCurrentMessage("");
  };

  const submitRequest = async (e) => {
      e.preventDefault();
      if (!selectedUser) return;
      
      const targetTravelerID = selectedUser.userID || selectedUser.id;

      try {
          await axios.post("http://localhost:3000/api/request", {
              namaBarang: formData.namaBarang,
              hargaEstimasi: formData.hargaEstimasi,
              userID: myID,
              travelerID: targetTravelerID, 
              notes: formData.catatan
          });
          toast.success("✅ Berhasil Titip!", { theme: "dark" });
          setIsModalOpen(false);
          setFormData({ namaBarang: "", hargaEstimasi: "", catatan: "" });
          setViewMode("orders"); 
      } catch (err) { 
          console.error(err);
          toast.error("Gagal request. Cek console."); 
      }
  };

  // --- FUNGSI BARU: UPDATE STATUS (TERIMA/TOLAK) ---
  const handleStatusUpdate = async (requestID, newStatus) => {
      try {
          await axios.put(`http://localhost:3000/api/request/${requestID}/status`, {
              status: newStatus
          });
          
          const statusText = newStatus === 'Approved' ? 'Diterima' : 'Ditolak';
          toast.success(`Status berhasil diubah menjadi: ${statusText}`, { theme: "dark" });
          
          // Refresh data list agar tampilan langsung berubah
          if (myID) {
             axios.get(`http://localhost:3000/api/incoming-requests/${myID}`)
               .then(res => setIncomingOrders(res.data));
          }

      } catch (error) {
          toast.error("Gagal mengubah status.");
          console.error(error);
      }
  };

  return (
    <div className="flex h-screen bg-slate-900 text-white font-sans overflow-hidden">
      <ToastContainer position="top-center" theme="dark" />

      {/* SIDEBAR KIRI */}
      <div className="w-64 bg-slate-950 flex flex-col border-r border-slate-800 hidden md:flex">
        <div className="p-4 border-b border-slate-800"><h1 className="font-bold text-lg">Jastip<span className="text-indigo-500">Hub</span></h1></div>
        
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
            <div onClick={() => setViewMode("orders")} className={`flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer mb-2 ${viewMode === 'orders' ? 'bg-indigo-600' : 'hover:bg-slate-900 text-slate-400'}`}>
                <FaShoppingBag/> <span className="font-bold">Pesanan Saya</span>
            </div>
            <div onClick={() => setViewMode("incoming")} className={`flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer mb-6 ${viewMode === 'incoming' ? 'bg-emerald-600' : 'hover:bg-slate-900 text-slate-400'}`}>
                <FaInbox/> <span className="font-bold">Titipan Masuk</span>
            </div>
            <p className="text-xs font-bold text-slate-500 uppercase px-2 mb-2">Komunitas</p>
            {CHANNELS.map((ch) => (
                <div key={ch.id} onClick={() => { setViewMode("global"); setActiveChannel(ch.id); }} className={`flex items-center gap-2 px-3 py-2 rounded cursor-pointer ${viewMode === 'global' && activeChannel === ch.id ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-900'}`}>
                    <FaHashtag/> <span>{ch.label}</span>
                </div>
            ))}
        </div>
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex justify-between items-center">
             <span className="font-bold text-sm truncate w-24">{user?.nama}</span>
             <button onClick={()=>{localStorage.clear(); navigate("/")}}><FaSignOutAlt className="text-slate-500 hover:text-red-500"/></button>
        </div>
      </div>

      {/* CONTENT TENGAH */}
      <div className="flex-1 flex flex-col bg-slate-900 min-w-0">
        {viewMode === "global" && (
            <>
                <div className="h-14 border-b border-slate-800 flex items-center px-4 bg-slate-900"><h3 className="font-bold">#{activeChannel}</h3></div>
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((msg, i) => (
                        <div key={i} className="flex gap-3">
                             <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center font-bold text-xs">{msg.sender?.nama?.[0]}</div>
                             <div>
                                 <span className="font-bold text-sm text-indigo-400">{msg.sender?.nama}</span>
                                 <p className="text-slate-300 text-sm">{msg.content}</p>
                             </div>
                        </div>
                    ))}
                    <div ref={chatEndRef} />
                </div>
                <form onSubmit={sendMessage} className="p-4 bg-slate-900 relative">
                    <input className="w-full bg-slate-800 p-3 rounded text-white" value={currentMessage} onChange={e=>setCurrentMessage(e.target.value)} placeholder="Tulis pesan..." />
                    <button className="absolute right-6 top-6 text-slate-400"><FaPaperPlane/></button>
                </form>
            </>
        )}

        {/* PESANAN SAYA (OUTGOING) */}
        {viewMode === "orders" && (
            <div className="p-8 overflow-y-auto">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2"><FaShoppingBag/> Pesanan Saya</h2>
                {myOrders.length === 0 ? <p className="text-slate-500">Belum ada pesanan. Pilih user di kanan untuk menitip.</p> : 
                    myOrders.map(o => (
                        <div key={o.requestID} className="bg-slate-800 p-4 rounded mb-3 border border-slate-700">
                            <h4 className="font-bold text-lg">{o.namaBarang}</h4>
                            <p className="text-sm text-slate-400">Titip ke: <span className="text-indigo-400 font-bold">{o.traveler?.nama || "Unknown"}</span></p>
                            <p className="text-sm">Estimasi: Rp {o.hargaEstimasi.toLocaleString()}</p>
                            <span className={`text-xs px-2 py-1 rounded mt-2 inline-block font-bold ${
                                o.status === 'Approved' ? 'bg-emerald-500/20 text-emerald-500' :
                                o.status === 'Rejected' ? 'bg-red-500/20 text-red-500' :
                                'bg-yellow-500/20 text-yellow-500'
                            }`}>{o.status}</span>
                        </div>
                    ))
                }
            </div>
        )}

        {/* TITIPAN MASUK (INCOMING) - UPDATED DENGAN TOMBOL */}
        {viewMode === "incoming" && (
            <div className="p-8 overflow-y-auto">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-emerald-400"><FaInbox/> Titipan Masuk</h2>
                {incomingOrders.length === 0 ? <p className="text-slate-500">Belum ada yang menitip ke Anda.</p> : 
                    incomingOrders.map(o => (
                        <div key={o.requestID} className="bg-slate-800 p-4 rounded mb-3 border border-emerald-500/30">
                            <h4 className="font-bold text-lg">{o.namaBarang}</h4>
                            <p className="text-sm text-slate-400">Dari: <span className="text-emerald-400 font-bold">{o.user?.nama}</span></p>
                            <p className="text-sm text-slate-300 mb-2">Catatan: {o.notes || "-"}</p>
                            
                            {/* LOGIKA TOMBOL: Muncul hanya jika status 'Pending' */}
                            {o.status === 'Pending' ? (
                                <div className="mt-3 flex gap-3">
                                    <button 
                                        onClick={() => handleStatusUpdate(o.requestID, 'Approved')}
                                        className="text-xs bg-emerald-600 hover:bg-emerald-500 px-4 py-2 rounded font-bold text-white transition-colors"
                                    >
                                        Terima
                                    </button>
                                    <button 
                                        onClick={() => handleStatusUpdate(o.requestID, 'Rejected')}
                                        className="text-xs bg-red-600 hover:bg-red-500 px-4 py-2 rounded font-bold text-white transition-colors"
                                    >
                                        Tolak
                                    </button>
                                </div>
                            ) : (
                                // Jika sudah ada keputusan, tampilkan label status saja
                                <div className={`mt-2 text-xs font-bold px-3 py-1 rounded w-fit ${
                                    o.status === 'Approved' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                                }`}>
                                    Status: {o.status === 'Approved' ? 'Diterima' : 'Ditolak'}
                                </div>
                            )}
                        </div>
                    ))
                }
            </div>
        )}
      </div>

      {/* SIDEBAR KANAN (User Lain) */}
      <div className="w-64 bg-slate-950 border-l border-slate-800 hidden lg:flex flex-col">
        <div className="p-4 border-b border-slate-800"><h3 className="font-bold text-slate-400 text-xs">USER AKTIF ({usersList.length})</h3></div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {usersList.length === 0 ? <p className="text-xs text-slate-500 text-center mt-4">Tidak ada user lain.</p> :
             usersList.map((u) => (
                <div key={u.userID || u.id} className="bg-slate-900/50 p-3 rounded flex items-center justify-between group hover:bg-slate-800">
                    <div className="flex items-center gap-2 overflow-hidden">
                        <div className="w-8 h-8 rounded-full bg-indigo-900 flex items-center justify-center font-bold text-xs shrink-0">{u.nama[0]}</div>
                        <div className="truncate text-sm font-bold">{u.nama}</div>
                    </div>
                    <button onClick={() => { setSelectedUser(u); setIsModalOpen(true); }} className="bg-indigo-600 hover:bg-indigo-500 text-[10px] px-2 py-1 rounded font-bold opacity-0 group-hover:opacity-100 transition-opacity">TITIP</button>
                </div>
            ))}
        </div>
      </div>

      {/* MODAL FORM */}
      {isModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
            <div className="bg-slate-800 p-6 rounded-xl w-full max-w-md border border-slate-700">
                <h3 className="text-xl font-bold mb-4">Titip ke {selectedUser.nama}</h3>
                <input className="w-full bg-slate-900 p-3 rounded mb-3 text-white border border-slate-600" placeholder="Nama Barang" value={formData.namaBarang} onChange={e=>setFormData({...formData, namaBarang:e.target.value})}/>
                <input className="w-full bg-slate-900 p-3 rounded mb-3 text-white border border-slate-600" type="number" placeholder="Harga" value={formData.hargaEstimasi} onChange={e=>setFormData({...formData, hargaEstimasi:e.target.value})}/>
                <textarea className="w-full bg-slate-900 p-3 rounded mb-3 text-white border border-slate-600" placeholder="Catatan" value={formData.catatan} onChange={e=>setFormData({...formData, catatan:e.target.value})}/>
                <div className="flex gap-2">
                    <button onClick={submitRequest} className="flex-1 bg-indigo-600 py-3 rounded font-bold">Kirim</button>
                    <button onClick={()=>setIsModalOpen(false)} className="flex-1 bg-slate-700 py-3 rounded font-bold">Batal</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}