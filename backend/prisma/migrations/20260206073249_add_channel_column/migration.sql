-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_GlobalMessage" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "channel" TEXT NOT NULL DEFAULT 'general-chat',
    "senderId" INTEGER NOT NULL,
    CONSTRAINT "GlobalMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User" ("userID") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_GlobalMessage" ("content", "createdAt", "id", "senderId") SELECT "content", "createdAt", "id", "senderId" FROM "GlobalMessage";
DROP TABLE "GlobalMessage";
ALTER TABLE "new_GlobalMessage" RENAME TO "GlobalMessage";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
