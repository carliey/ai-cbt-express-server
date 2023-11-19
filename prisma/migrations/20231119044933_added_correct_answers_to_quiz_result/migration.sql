/*
  Warnings:

  - Added the required column `correct_answers` to the `QuizResult` table without a default value. This is not possible if the table is not empty.
  - Added the required column `questions_attempted` to the `QuizResult` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_QuizResult" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "participant_id" INTEGER NOT NULL,
    "quizId" INTEGER NOT NULL,
    "correct_answers" INTEGER NOT NULL,
    "questions_attempted" INTEGER NOT NULL,
    CONSTRAINT "QuizResult_participant_id_fkey" FOREIGN KEY ("participant_id") REFERENCES "Participant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "QuizResult_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "Quiz" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_QuizResult" ("id", "participant_id", "quizId") SELECT "id", "participant_id", "quizId" FROM "QuizResult";
DROP TABLE "QuizResult";
ALTER TABLE "new_QuizResult" RENAME TO "QuizResult";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
