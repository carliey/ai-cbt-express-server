-- CreateTable
CREATE TABLE "TestAdministrator" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "about" TEXT
);

-- CreateIndex
CREATE UNIQUE INDEX "TestAdministrator_email_key" ON "TestAdministrator"("email");
