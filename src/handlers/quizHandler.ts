import prisma from "../modules/db";

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
        testAdministratorId: req.user.id, // Assuming you have user authentication
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
    res.json({ error });
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
