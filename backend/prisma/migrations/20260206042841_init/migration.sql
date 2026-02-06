-- CreateTable
CREATE TABLE "User" (
    "userID" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "noRekening" TEXT,
    "namaBank" TEXT,
    "atasNama" TEXT
);

-- CreateTable
CREATE TABLE "JastipRequest" (
    "requestID" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "namaBarang" TEXT NOT NULL,
    "hargaEstimasi" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "userID" INTEGER NOT NULL,
    CONSTRAINT "JastipRequest_userID_fkey" FOREIGN KEY ("userID") REFERENCES "User" ("userID") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Pembayaran" (
    "paymentID" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "jumlahBayar" REAL NOT NULL,
    "metodeBayar" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "tanggal" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userID" INTEGER NOT NULL,
    "requestID" INTEGER NOT NULL,
    CONSTRAINT "Pembayaran_userID_fkey" FOREIGN KEY ("userID") REFERENCES "User" ("userID") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Pembayaran_requestID_fkey" FOREIGN KEY ("requestID") REFERENCES "JastipRequest" ("requestID") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ChatSession" (
    "chatID" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "messageContent" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "senderID" INTEGER NOT NULL,
    "receiverID" INTEGER NOT NULL,
    CONSTRAINT "ChatSession_senderID_fkey" FOREIGN KEY ("senderID") REFERENCES "User" ("userID") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ChatSession_receiverID_fkey" FOREIGN KEY ("receiverID") REFERENCES "User" ("userID") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Pembayaran_requestID_key" ON "Pembayaran"("requestID");
