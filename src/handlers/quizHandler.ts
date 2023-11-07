import { trimTextToToken } from "../helpers/trimTextToToken";
import prisma from "../modules/db";
import openAI from "../modules/openAI";

// generate questions

export const generateQuestions = async (req, res) => {
  try {
    const text = req.body.text;
    const number_of_questions = req.body.number_of_questions;
    const difficulty_level = req.body.difficulty_level;
    if (!text || !number_of_questions || !difficulty_level) {
      return res.status(400).json({ error: { message: "Missing parameters" } });
    }

    const trimmedText = trimTextToToken(text, 400);

    const prompt = `Generate ${number_of_questions} multiple choice questions, with difficulty level ${difficulty_level} on a scale of 1 to 5 from this text ${trimmedText}. 
    The response should strictly be in the following parsable JSON format:
    An array of questions, each question is an object containing a "text" key which holds the question itself. 
    Additionally, there's an "options" array within each question object. 
    The "options" array contains four objects, each representing a possible answer to the question,
    Every option object includes an "option" key for the text of the answer and an "is_correct" key, 
    which is a boolean value indicating whether the given option is the correct answer (true) or not (false), 
    the correct option should be randomized at different index of the options array for every question
    `;

    const result = await openAI.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-3.5-turbo",
    });

    const questions = JSON.parse(result.choices[0].message.content);
    if (questions) {
      return res.status(200).json({ data: questions });
    } else {
      return res
        .status(403)
        .json({ error: "too many requests, please try again" });
    }
  } catch (error) {
    console.log(error);
    res.json({
      error,
      message: "something went wrong, please try again later",
    });
  }
};

// Create a new quiz
export const createQuiz = async (req, res) => {
  try {
    const newQuiz = await prisma.quiz.create({
      data: {
        title: req.body.title,
        description: req.body.description,
        instructions: req.body.instructions,
        duration: parseInt(req.body.duration),
        date: req.body.date,
        is_completed: false,
        is_published: false,
        testAdministratorId: req.user.id,
        questions: {
          // Create questions and their options
          create: req.body.questions.map((question) => {
            return {
              text: question.text,
              options: {
                create: question.options,
              },
            };
          }),
        },
        participants: {
          // Create participants
          create: req.body.participants,
        },
      },
      include: {
        questions: {
          include: {
            options: true,
          },
        },
        participants: true,
      },
    });
    res.json({ data: newQuiz, message: "Quiz created successfully" });
  } catch (error) {
    console.log(error);
    res.status(403).json({ error });
  }
};

// Get all quizzes for the logged-in test administrator
export const getQuizzes = async (req, res) => {
  try {
    const quizzes = await prisma.quiz.findMany({
      where: {
        testAdministratorId: req.user.id, // Assuming you have user authentication
      },
      include: {
        participants: true,
        questions: {
          include: {
            options: true,
          },
        },
      },
    });
    res.json({ data: quizzes, message: "Quizzes fetched successfully" });
  } catch (error) {
    console.log(error);
    res.json({ error });
  }
};

// Get a quiz and its participant answers
export const getQuizWithAnswers = async (req, res) => {
  try {
    const quizId = parseInt(req.params.quizId);

    // Get the quiz
    const quiz = await prisma.quiz.findUnique({
      where: {
        id: quizId,
      },
      include: {
        questions: {
          include: {
            options: true,
          },
        },
      },
    });

    if (!quiz) {
      res.status(404).json({ message: "Quiz not found" });
      return;
    }

    // Get participant answers for the quiz
    const participantAnswers = await prisma.quizAnswer.findMany({
      where: {
        quiz_id: quizId,
      },
      include: {
        participant: true,
        question: true,
        option: true,
      },
    });

    res.json({
      quiz: quiz,
      participantAnswers: participantAnswers,
    });
  } catch (error) {
    console.log(error);
    res.json({ error });
  }
};

// Get answers for a quiz
export const getQuizAnswers = async (req, res) => {
  try {
    const quizId = parseInt(req.params.quizId);
    const answers = await prisma.quizAnswer.findMany({
      where: {
        quiz_id: quizId,
      },
    });
    res.json({ data: answers, message: "Quiz answers fetched successfully" });
  } catch (error) {
    console.log(error);
    res.json({ error });
  }
};

// Update a quiz
export const updateQuiz = async (req, res) => {
  try {
    const quizId = parseInt(req.params.quizId);
    const response = await prisma.quiz.update({
      where: {
        id: quizId,
      },
      data: {
        title: req.body.title,
        description: req.body.description,
        instructions: req.body.instructions,
        duration: req.body.duration,
        date: req.body.date,
      },
    });
    res.json({ data: response, message: "Quiz updated successfully" });
  } catch (error) {
    console.log(error);
    res.json({ error });
  }
};

// Publish a quiz
export const publishQuiz = async (req, res) => {
  try {
    const quizId = parseInt(req.params.quizId);
    const response = await prisma.quiz.update({
      where: {
        id: quizId,
      },
      data: {
        is_published: true,
      },
    });
    res.json({ data: response, message: "Quiz published successfully" });
  } catch (error) {
    console.log(error);
    res.json({ error });
  }
};

// Unpublish a quiz
export const unpublishQuiz = async (req, res) => {
  try {
    const quizId = parseInt(req.params.quizId);
    const response = await prisma.quiz.update({
      where: {
        id: quizId,
      },
      data: {
        is_published: false,
      },
    });
    res.json({ data: response, message: "Quiz unpublished successfully" });
  } catch (error) {
    console.log(error);
    res.json({ error });
  }
};

// Delete a quiz
export const deleteQuiz = async (req, res) => {
  try {
    const quizId = parseInt(req.params.quizId);
    await prisma.quiz.delete({
      where: {
        id: quizId,
      },
    });
    res.json({ message: "Quiz deleted successfully" });
  } catch (error) {
    console.log(error);
    res.json({ error });
  }
};

// Get quizzes statistics
export const getStats = async (req, res) => {
  try {
    // Get the test administrator's ID from the authenticated user
    const testAdministratorId = req.user.id; // Assuming you have user authentication

    // Calculate the statistics
    const totalTestsCreated = await prisma.quiz.count({
      where: {
        testAdministratorId,
      },
    });

    const totalTestsTaken = await prisma.quizResult.count({
      where: {
        quiz: {
          testAdministratorId,
        },
      },
    });

    const totalParticipantsCreated = await prisma.participant.count({
      where: {
        quizId: {
          not: null,
        },
      },
    });

    const totalParticipantsTakenTests = await prisma.quizAnswer.count({
      where: {
        participant: {
          quizId: {
            not: null,
          },
        },
      },
    });

    // const totalQuestionsCreated = await prisma.question.count({
    //   where: {
    //     quiz: {
    //       testAdministratorId,
    //     },
    //   },
    // });

    const totalQuestionsAnsweredCorrectly = await prisma.quizAnswer.count({
      where: {
        is_correct: true,
      },
    });

    // Additional statistics
    const totalTestsPublished = await prisma.quiz.count({
      where: {
        testAdministratorId,
        is_completed: true,
      },
    });

    const totalTestsUnpublished = await prisma.quiz.count({
      where: {
        testAdministratorId,
        is_completed: false,
      },
    });

    const totalParticipantsNotTakenTests = await prisma.participant.count({
      where: {
        quizId: null,
      },
    });

    res.json({
      totalTestsCreated,
      totalTestsTaken,
      totalParticipantsCreated,
      totalParticipantsTakenTests,
      //   totalQuestionsCreated,
      totalQuestionsAnsweredCorrectly,
      totalTestsPublished,
      totalTestsUnpublished,
      totalParticipantsNotTakenTests,
    });
  } catch (error) {
    console.log(error);
    res.json({ error });
  }
};
