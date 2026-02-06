// File: backend/src/server.js
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require("socket.io");
const { PrismaClient } = require('@prisma/client'); // Import Prisma
const systemController = require('./controllers/systemController');

const app = express();
const server = http.createServer(app);
const prisma = new PrismaClient(); // Inisialisasi DB

const io = new Server(server, {
    cors: { origin: "*" }
});

app.use(cors());
app.use(express.json());

// --- ROUTES API ---
app.post('/api/register', systemController.register);
app.post('/api/login', systemController.postLogin);
app.post('/api/request', systemController.simpanRequest);

// 1. UPDATE API HISTORY (Terima parameter ?channel=xxx)
app.get('/api/chat/history', async (req, res) => {
    const channelName = req.query.channel || "general-chat"; // Default ke general
    try {
        const messages = await prisma.globalMessage.findMany({
            where: { channel: channelName }, // FILTER DISINI
            include: { sender: { select: { nama: true } } },
            orderBy: { createdAt: 'asc' },
            take: 50
        });
        res.json(messages);
    } catch (error) {
        res.status(500).json({ error: "Gagal memuat chat" });
    }
});

// 2. UPDATE SOCKET IO
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('sendMessage', async (data) => {
        // data sekarang punya field 'channel'
        console.log("Pesan masuk:", data);

        try {
            // Simpan dengan Channel
            const savedMessage = await prisma.globalMessage.create({
                data: {
                    content: data.content,
                    senderId: data.senderId,
                    channel: data.channel // SIMPAN CHANNELNYA
                },
                include: { sender: { select: { nama: true } } }
            });

            // Kirim balik ke semua orang (sertakan channel agar frontend bisa filter)
            const messageToEmit = {
                id: savedMessage.id,
                content: savedMessage.content,
                sender: { nama: savedMessage.sender.nama },
                createdAt: savedMessage.createdAt,
                channel: savedMessage.channel // PENTING
            };
            
            io.emit('receiveMessage', messageToEmit);

        } catch (error) {
            console.error("Gagal menyimpan pesan:", error);
        }
    });
});

server.listen(3000, () => {
    console.log('✅ Server Enterprise berjalan di http://localhost:3000');
});