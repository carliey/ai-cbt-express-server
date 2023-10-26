/*
  Warnings:

  - Added the required column `password` to the `TestAdministrator` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_TestAdministrator" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "about" TEXT
);
INSERT INTO "new_TestAdministrator" ("about", "created_at", "email", "id", "name") SELECT "about", "created_at", "email", "id", "name" FROM "TestAdministrator";
DROP TABLE "TestAdministrator";
ALTER TABLE "new_TestAdministrator" RENAME TO "TestAdministrator";
CREATE UNIQUE INDEX "TestAdministrator_email_key" ON "TestAdministrator"("email");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
