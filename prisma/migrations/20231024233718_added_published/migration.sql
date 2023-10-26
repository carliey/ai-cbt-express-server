/*
  Warnings:

  - Added the required column `is_published` to the `Quiz` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Quiz" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "instructions" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "date" TEXT NOT NULL,
    "is_completed" BOOLEAN NOT NULL,
    "is_published" BOOLEAN NOT NULL,
    "testAdministratorId" INTEGER,
    CONSTRAINT "Quiz_testAdministratorId_fkey" FOREIGN KEY ("testAdministratorId") REFERENCES "TestAdministrator" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Quiz" ("date", "description", "duration", "id", "instructions", "is_completed", "testAdministratorId", "title") SELECT "date", "description", "duration", "id", "instructions", "is_completed", "testAdministratorId", "title" FROM "Quiz";
DROP TABLE "Quiz";
ALTER TABLE "new_Quiz" RENAME TO "Quiz";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
