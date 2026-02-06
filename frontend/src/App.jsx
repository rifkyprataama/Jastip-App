// File: frontend/src/App.jsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
// Import halaman-halaman
import Login from "./pages/Login"; // (Kita akan perbaiki ini langkah berikutnya)
import Register from "./pages/Register"; // <-- IMPORT INI
import Dashboard from "./pages/Dashboard";
import Chat from "./pages/Chat";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        {/* Tambahkan Route Register */}
        <Route path="/register" element={<Register />} /> 
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/chat" element={<Chat />} />
      </Routes>
    </Router>
  );
}

export default App;