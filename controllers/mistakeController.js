const { Op } = require('sequelize');
const { User } = require('../models/User');
const { Ticket } = require('../models/Ticket');
const { Question } = require('../models/Question');
const { UserMistake } = require('../models/UserMistake');

const toAnswerMap = (answers) => {
    if (!answers || typeof answers !== 'object' || Array.isArray(answers)) {
        return null;
    }

    const map = new Map();
    for (const [questionIdRaw, selectedOptionRaw] of Object.entries(answers)) {
        const questionId = Number(questionIdRaw);
        const selectedOption = Number(selectedOptionRaw);

        if (!Number.isInteger(questionId) || !Number.isInteger(selectedOption)) {
            return null;
        }

        map.set(questionId, selectedOption);
    }
    return map;
};

const upsertWrongMistake = async ({ userId, ticketId, questionId, selectedOption }) => {
    const now = new Date();
    const [mistake, created] = await UserMistake.findOrCreate({
        where: { userId, questionId },
        defaults: {
            userId,
            questionId,
            ticketId,
            wrongCount: 1,
            lastWrongAnswer: selectedOption,
            lastWrongAt: now
        }
    });

    if (!created) {
        await mistake.update({
            ticketId,
            wrongCount: mistake.wrongCount + 1,
            lastWrongAnswer: selectedOption,
            lastWrongAt: now
        });
    }
};

exports.submitTicketAnswers = async (req, res) => {
    try {
        const userId = req.user.id;
        const { ticketId, answers } = req.body;

        if (!ticketId) {
            return res.status(400).json({ message: 'ticketId majburiy' });
        }

        const answerMap = toAnswerMap(answers);
        if (!answerMap) {
            return res.status(400).json({ message: 'answers formati noto\'g\'ri. Masalan: { "12": 2, "14": 0 }' });
        }

        const user = await User.findByPk(userId);
        const ticket = await Ticket.findByPk(ticketId);
        if (!ticket) {
            return res.status(404).json({ message: 'Bilet topilmadi' });
        }

        const now = new Date();
        const hasActiveSubscription = user.subscriptionEnd && new Date(user.subscriptionEnd) > now;
        const isAdmin = user.role === 'admin';
        if (!ticket.is_demo && !hasActiveSubscription && !isAdmin) {
            return res.status(403).json({ message: "Bu biletni ishlash uchun obuna bo'lishingiz kerak!" });
        }

        const questions = await Question.findAll({
            where: { ticketId: ticket.id },
            attributes: ['id', 'questionText', 'options', 'correctOption', 'explanation'],
            order: [['id', 'ASC']]
        });

        if (!questions.length) {
            return res.status(400).json({ message: 'Bu bilet ichida savollar topilmadi' });
        }

        const ticketQuestionIds = new Set(questions.map((q) => q.id));
        for (const questionId of answerMap.keys()) {
            if (!ticketQuestionIds.has(questionId)) {
                return res.status(400).json({ message: `${questionId} ID li savol ushbu biletga tegishli emas` });
            }
        }

        const details = [];
        let correctCount = 0;
        let wrongCount = 0;
        let unansweredCount = 0;

        for (const question of questions) {
            const userAnswer = answerMap.has(question.id) ? answerMap.get(question.id) : null;

            if (userAnswer === null) {
                unansweredCount++;
                details.push({
                    questionId: question.id,
                    userAnswer: null,
                    correctAnswer: question.correctOption,
                    isCorrect: false,
                    status: 'unanswered'
                });
                continue;
            }

            const isCorrect = userAnswer === question.correctOption;
            if (isCorrect) {
                correctCount++;
            } else {
                wrongCount++;
                await upsertWrongMistake({
                    userId,
                    ticketId: ticket.id,
                    questionId: question.id,
                    selectedOption: userAnswer
                });
            }

            details.push({
                questionId: question.id,
                userAnswer,
                correctAnswer: question.correctOption,
                isCorrect,
                status: isCorrect ? 'correct' : 'wrong'
            });
        }

        const percentage = (correctCount / questions.length) * 100;

        res.status(200).json({
            message: 'Bilet natijasi hisoblandi',
            ticket: {
                id: ticket.id,
                name: ticket.name,
                ticket_number: ticket.ticket_number
            },
            summary: {
                totalQuestions: questions.length,
                answeredCount: answerMap.size,
                correctCount,
                wrongCount,
                unansweredCount,
                percentage: percentage.toFixed(1)
            },
            details
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getMyMistakes = async (req, res) => {
    try {
        const mistakes = await UserMistake.findAll({
            where: { userId: req.user.id },
            include: [
                {
                    model: Question,
                    as: 'question',
                    attributes: ['id', 'ticketId', 'questionText', 'image', 'options', 'correctOption', 'explanation'],
                    include: [
                        {
                            model: Ticket,
                            as: 'ticket',
                            attributes: ['id', 'ticket_number', 'name']
                        }
                    ]
                }
            ],
            order: [['lastWrongAt', 'DESC']]
        });

        const formattedMistakes = mistakes
            .filter((item) => item.question)
            .map((item) => ({
                id: item.id,
                wrongCount: item.wrongCount,
                lastWrongAnswer: item.lastWrongAnswer,
                lastWrongAt: item.lastWrongAt,
                question: {
                    id: item.question.id,
                    ticketId: item.question.ticketId,
                    ticket: item.question.ticket
                        ? {
                            id: item.question.ticket.id,
                            ticket_number: item.question.ticket.ticket_number,
                            name: item.question.ticket.name
                        }
                        : null,
                    questionText: item.question.questionText,
                    image: item.question.image,
                    options: item.question.options,
                    correctOption: item.question.correctOption,
                    explanation: item.question.explanation
                }
            }));

        res.status(200).json({
            message: 'Xato savollar ro\'yxati',
            total: formattedMistakes.length,
            mistakes: formattedMistakes
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.submitMistakePractice = async (req, res) => {
    try {
        const userId = req.user.id;
        const answerMap = toAnswerMap(req.body.answers);
        if (!answerMap || answerMap.size === 0) {
            return res.status(400).json({ message: 'answers majburiy. Masalan: { "12": 2, "14": 0 }' });
        }

        const questionIds = [...answerMap.keys()];
        const mistakes = await UserMistake.findAll({
            where: {
                userId,
                questionId: { [Op.in]: questionIds }
            },
            include: [
                {
                    model: Question,
                    as: 'question',
                    attributes: ['id', 'correctOption', 'questionText', 'options', 'explanation']
                }
            ]
        });

        if (!mistakes.length) {
            return res.status(404).json({ message: 'Berilgan savollar ichida xatolar bo\'limida mavjud savol topilmadi' });
        }

        let solvedCount = 0;
        let stillWrongCount = 0;
        const details = [];

        for (const mistake of mistakes) {
            if (!mistake.question) {
                continue;
            }

            const selectedOption = answerMap.get(mistake.questionId);
            const isCorrect = selectedOption === mistake.question.correctOption;

            if (isCorrect) {
                solvedCount++;
                await mistake.destroy();
            } else {
                stillWrongCount++;
                await mistake.update({
                    wrongCount: mistake.wrongCount + 1,
                    lastWrongAnswer: selectedOption,
                    lastWrongAt: new Date()
                });
            }

            details.push({
                questionId: mistake.questionId,
                selectedOption,
                correctAnswer: mistake.question.correctOption,
                isCorrect,
                status: isCorrect ? 'solved' : 'wrong'
            });
        }

        const remainingCount = await UserMistake.count({ where: { userId } });

        res.status(200).json({
            message: 'Xatolar bo\'limi javoblari tekshirildi',
            summary: {
                submittedCount: details.length,
                solvedCount,
                stillWrongCount,
                remainingCount
            },
            details
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
