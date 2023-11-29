import { error } from "console";
import { trimTextToToken } from "../helpers/trimTextToToken";
import prisma from "../modules/db";
import openAI from "../modules/openAI";
import { exclude } from "../helpers/exclude";
import { transporter } from "../modules/mailer";
import { createEmailTemplate } from "../helpers/emailTemplates";

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
    res.status(400).json({
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

// Submit or update a participant answer
export const submitAnswer = async (req, res) => {
  try {
    const { questionId, optionId, quizId, participantId } = req.body;
    if (!questionId || !optionId || !quizId || !participantId) {
      return res.status(400).json({ error: { message: "Missing parameters" } });
    }

    // Ensure the participant is associated with the quiz
    const participant = await prisma.participant.findUnique({
      where: {
        id: participantId,
        quizId: quizId,
      },
    });

    if (!participant) {
      return res
        .status(404)
        .json({ error: { message: "Participant not found for the quiz" } });
    }

    // Validate that the question and option exist
    const question = await prisma.question.findUnique({
      where: {
        id: questionId,
        quizId: quizId,
      },
    });

    if (!question) {
      return res
        .status(404)
        .json({ error: { message: "Question not found for the quiz" } });
    }

    const option = await prisma.option.findUnique({
      where: {
        id: optionId,
        questionId: questionId,
      },
    });

    if (!option) {
      return res
        .status(404)
        .json({ error: { message: "Option not found for the question" } });
    }

    // Check if the participant has already answered this question
    const existingAnswer = await prisma.quizAnswer.findFirst({
      where: {
        quiz_id: quizId,
        participant_id: participantId,
        question_id: questionId,
      },
    });

    let submittedAnswer;

    if (existingAnswer) {
      // If the participant has already answered, update the existing answer
      submittedAnswer = await prisma.quizAnswer.update({
        where: {
          id: existingAnswer.id,
        },
        data: {
          option_id: optionId,
          is_correct: option.is_correct,
        },
        include: {
          participant: true,
          question: true,
          option: true,
        },
      });
    } else {
      // If the participant has not answered, create a new answer
      submittedAnswer = await prisma.quizAnswer.create({
        data: {
          quiz_id: quizId,
          participant_id: participantId,
          question_id: questionId,
          option_id: optionId,
          is_correct: option.is_correct,
        },
        include: {
          participant: true,
          question: true,
          option: true,
        },
      });
    }

    res.status(200).json({
      data: submittedAnswer,
      message: "Answer submitted or updated successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: { message: "Internal server error" } });
  }
};

// Create a quiz result for a participant
export const createQuizResult = async (req, res) => {
  try {
    const { quizId, participantId } = req.body;

    if (!quizId || !participantId) {
      return res.status(400).json({ error: { message: "Missing parameters" } });
    }
    // Ensure the participant is associated with the quiz
    const participant = await prisma.participant.findUnique({
      where: {
        id: participantId,
        quizId: quizId,
      },
    });

    if (!participant) {
      return res
        .status(404)
        .json({ error: { message: "Participant not found for the quiz" } });
    }

    // Check if the quiz result already exists
    const existingQuizResult = await prisma.quizResult.findFirst({
      where: {
        quizId: quizId,
        participant_id: participantId,
      },
    });

    if (existingQuizResult) {
      return res.status(400).json({
        error: { message: "Quiz result already exists for the participant" },
      });
    }

    // Calculate the total correct answers for the participant
    const tatalQuestionsAttempted = await prisma.quizAnswer.count({
      where: {
        participant_id: participantId,
        quiz_id: quizId,
      },
    });

    // Calculate the total correct answers for the participant
    const totalCorrectAnswers = await prisma.quizAnswer.count({
      where: {
        participant_id: participantId,
        quiz_id: quizId,
        is_correct: true,
      },
    });

    // Create the quiz result
    const quizResult = await prisma.quizResult.create({
      data: {
        quizId: quizId,
        participant_id: participantId,
        correct_answers: totalCorrectAnswers,
        questions_attempted: tatalQuestionsAttempted,
      },
      include: {
        participant: true,
        quiz: true,
      },
    });

    res
      .status(200)
      .json({ data: quizResult, message: "Quiz result created successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: { message: "Internal server error" } });
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
        results: {
          include: {
            participant: true,
          },
        },
      },
    });
    res
      .status(200)
      .json({ data: quizzes, message: "Quizzes fetched successfully" });
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

// Get a particular quiz for a particular participant
export const getParticipantQuiz = async (req, res) => {
  const quiz_id = req.query.quiz_id;
  const participant_id = req.query.participant_id;

  if (!participant_id && !quiz_id) {
    return res.status(403).json({ error: "missing url parameters" });
  }

  try {
    const parsed_quiz_id = parseInt(quiz_id);
    const parsed_participant_id = parseInt(participant_id);

    const has_submitted = await prisma.quizResult.findFirst({
      where: {
        participant_id: parsed_participant_id,
        quizId: parsed_quiz_id,
      },
    });

    if (has_submitted) {
      return res
        .status(405)
        .json({ error: { message: "User has submitted this quiz" } });
    }

    const participant = await prisma.participant.findUnique({
      where: {
        id: parsed_participant_id,
        quizId: parsed_quiz_id,
      },
      include: {
        Quiz: {
          include: {
            questions: {
              include: {
                options: true,
              },
            },
            TestAdministrator: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    res.status(200).json({
      data: participant,
      message: "Quiz fetched successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(403).json({ error });
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

    const quiz = await prisma.quiz.findFirst({
      where: {
        id: quizId,
      },
      include: {
        participants: true,
        TestAdministrator: true,
      },
    });

    quiz.participants.forEach(async (participant) => {
      const link = `http://localhost:5173/quiz/${quizId}/${participant.id}`;
      const html = createEmailTemplate({
        participant_name: participant.name,
        quiz_administrator: quiz.TestAdministrator.name,
        quiz_date: quiz.date,
        quiz_link: link,
        quiz_name: quiz.title,
      });

      //send the email template
      await transporter.sendMail({
        from: "Enhanced Apptitude Test <ladancbt@gmail.com>", // sender address
        to: participant.email, // list of receivers
        subject: "Apptitude Test Invitation", // Subject line
        //   text: "Hello world?", // plain text body
        html: html, // html body
      });
    });

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
