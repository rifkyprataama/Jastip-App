// File: backend/src/controllers/systemController.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();
// KUNCI RAHASIA SERVER (Harusnya di .env, tapi untuk sekarang kita taruh sini dulu)
const JWT_SECRET = "rahasia_perusahaan_jastip_enterprise_2026";

// --- REGISTER PROFESIONAL (FIX FINAL) ---
exports.register = async (req, res) => {
  try {
    // 1. TERIMA DATA
    // Pastikan nama variabel ini SAMA PERSIS dengan yang dikirim Frontend (Register.jsx)
    const { email, password, nama, noRekening, namaBank, atasNama } = req.body;

    // DEBUG: Cek di terminal backend apakah data sampai?
    console.log("📢 Data Register Masuk:", { email, nama, noRekening, namaBank, atasNama });

    // 2. Validasi Input
    if (!email || !password || !nama) {
      return res.status(400).json({ message: "Data utama (Nama, Email, Password) wajib diisi!" });
    }

    // 3. Cek Email Duplikat
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ message: "Email sudah terdaftar. Silakan Login saja." });
    }

    // 4. Enkripsi Password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 5. Simpan ke Database
    // PENTING: Pastikan di file 'prisma/schema.prisma' nama kolomnya juga 'atasNama', BUKAN 'atasNamaRekening'
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        nama,
        noRekening: noRekening || null, // Opsional
        namaBank: namaBank || null,     // Opsional
        atasNama: atasNama || null      // Pastikan sinkron dengan schema.prisma
      }
    });

    // 6. Sukses
    console.log("✅ User Berhasil Dibuat ID:", user.userID);
    res.status(201).json({ message: "Registrasi Berhasil! Silakan Login.", userId: user.userID });

  } catch (error) {
    console.error("❌ Register Error:", error); // Lihat error detail di terminal
    
    // Cek jika errornya dari Prisma (Kolom tidak ditemukan)
    if (error.code === 'P2002') {
        return res.status(409).json({ message: "Data unik sudah ada (Email)." });
    }
    
    res.status(500).json({ message: "Gagal mendaftar. Cek log server backend." });
  }
};

// --- LOGIN PROFESIONAL (Menggunakan JWT) ---
exports.postLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Cari User
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: "Kredensial tidak valid." });
    }

    // 2. Bandingkan Password Hash
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Kredensial tidak valid." });
    }

    // 3. Buat Token JWT (KTP Digital)
    const token = jwt.sign({ id: user.userID, email: user.email }, JWT_SECRET, {
      expiresIn: '1d' // Token berlaku 1 hari
    });

    // 4. Kirim Respon Sukses dengan Data Non-Sensitif
    res.json({
      message: "Otentikasi Berhasil",
      token, // Frontend harus menyimpan token ini
      user: {
        id: user.userID,
        nama: user.nama,
        email: user.email,
        hasBankDetails: !!user.noRekening // Flag untuk frontend tahu user sudah isi rekening atau belum
      }
    });

  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Terjadi kesalahan server." });
  }
};

// ...(Fungsi simpanRequest dan lainnya tetap sama dulu)...
exports.simpanRequest = async (req, res) => {
    // (Kode lama Anda untuk simpanRequest biarkan dulu di sini)
    const { namaBarang, hargaEstimasi, userID } = req.body;
    try {
      const request = await prisma.jastipRequest.create({
        data: {
          namaBarang,
          hargaEstimasi: parseFloat(hargaEstimasi),
          userID: parseInt(userID),
          status: "Pending"
        }
      });
      res.json({ message: "Request berhasil disimpan", data: request });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
};