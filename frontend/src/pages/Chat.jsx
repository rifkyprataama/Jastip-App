// File: frontend/src/pages/Chat.jsx
import { useState, useEffect } from "react";
import io from "socket.io-client";

// Koneksi ke Backend Socket
const socket = io.connect("http://localhost:3000");

export default function Chat() {
  const [pesan, setPesan] = useState("");
  const [listPesan, setListPesan] = useState([]);
  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    // Dengarkan pesan masuk dari server
    socket.on("receiveMessage", (data) => {
      setListPesan((listLama) => [...listLama, data]);
    });
  }, []);

  const kirimPesan = () => {
    if (pesan !== "") {
      const dataPesan = {
        pengirim: user.nama,
        isi: pesan,
        waktu: new Date().toLocaleTimeString(),
      };
      
      // Kirim ke Server via Socket
      socket.emit("sendMessage", dataPesan);
      setPesan("");
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "400px", margin: "0 auto" }}>
      <h2>Chat Room Jastip</h2>
      
      {/* Area Tampil Pesan */}
      <div style={{ height: "300px", border: "1px solid black", overflowY: "scroll", padding: "10px" }}>
        {listPesan.map((msg, index) => (
          <div key={index} style={{ marginBottom: "10px" }}>
            <strong>{msg.pengirim}: </strong>
            <span>{msg.isi}</span>
            <span style={{ fontSize: "10px", marginLeft: "10px", color: "gray" }}>{msg.waktu}</span>
          </div>
        ))}
      </div>

      {/* Input Pesan */}
      <div style={{ marginTop: "10px", display: "flex" }}>
        <input 
          type="text" 
          placeholder="Ketik pesan..." 
          value={pesan}
          onChange={(e) => setPesan(e.target.value)}
          style={{ flex: 1, padding: "10px" }}
        />
        <button onClick={kirimPesan} style={{ padding: "10px" }}>Kirim</button>
      </div>
    </div>
  );
}