import { Router } from "express";
import {
  changePassword,
  getProfile,
  getUsers,
  updateProfile,
} from "./handlers/testAdministratorHandler";
import {
  createQuiz,
  getQuizzes,
  getQuizAnswers,
  updateQuiz,
  publishQuiz,
  unpublishQuiz,
  deleteQuiz,
  getQuizWithAnswers,
  generateQuestions,
  getParticipantQuiz,
  getStats, // Added the new handler for retrieving quiz with answers
} from "./handlers/quizHandler";
import { extractText } from "./handlers/fileHandler";

const router = Router();

//-------user Routes
router.get("/users", getUsers);
router.get("/profile", getProfile);
router.put("/profile/update", updateProfile);
router.put("/profile/update-password", changePassword);

// Quiz Routes
router.get("/stats", getStats);
router.get("/quizzes", getQuizzes); // Get all quizzes for the logged-in test administrator
router.get("/quizzes/:quizId/answers", getQuizAnswers); // Get answers for a specific quiz
router.get("/quizzes/:quizId", getQuizWithAnswers); // Get a quiz with its participant answers
router.post("/generate-questions", generateQuestions); // Create a new quiz
router.post("/quizzes", createQuiz); // Create a new quiz
router.put("/quizzes/:quizId", updateQuiz); // Update a quiz
router.put("/quizzes/:quizId/publish", publishQuiz); // Publish a quiz
router.put("/quizzes/:quizId/unpublish", unpublishQuiz); // Unpublish a quiz
router.delete("/quizzes/:quizId", deleteQuiz); // Delete a quiz

//file routes

export default router;
