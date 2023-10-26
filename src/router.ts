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
  getQuizWithAnswers, // Added the new handler for retrieving quiz with answers
} from "./handlers/quizHandler";

const router = Router();

//-------user Routes
router.get("/users", getUsers);
router.get("/profile", getProfile);
router.put("/profile/update", updateProfile);
router.put("/profile/update-password", changePassword);

// Quiz Routes
router.post("/quizzes", createQuiz); // Create a new quiz
router.get("/quizzes", getQuizzes); // Get all quizzes for the logged-in test administrator
router.get("/quizzes/:quizId/answers", getQuizAnswers); // Get answers for a specific quiz
router.get("/quizzes/:quizId", getQuizWithAnswers); // Get a quiz with its participant answers
router.put("/quizzes/:quizId", updateQuiz); // Update a quiz
router.put("/quizzes/:quizId/publish", publishQuiz); // Publish a quiz
router.put("/quizzes/:quizId/unpublish", unpublishQuiz); // Unpublish a quiz
router.delete("/quizzes/:quizId", deleteQuiz); // Delete a quiz

export default router;
