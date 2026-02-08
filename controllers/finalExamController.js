const { FinalExam } = require('../models/FinalExam');
const { Question } = require('../models/Question');
const { sequelize } = require('../config/db');

const TOTAL_QUESTIONS = 50;
const PASS_PERCENTAGE = 86; // 86% to'g'ri bo'lsa o'tadi (43/50)
const EXAM_DURATION_MINUTES = 60; // 1 soat
const EXAM_DURATION_MS = EXAM_DURATION_MINUTES * 60 * 1000; // millisekundlarda

/**
 * Vaqt tugaganda imtihonni avtomatik yakunlash
 */
const autoSubmitExam = async (exam) => {
    // To'g'ri javoblarni olish
    const questions = await Question.findAll({
        where: { id: exam.questionIds },
        attributes: ['id', 'correctOption']
    });

    // Natijani hisoblash
    let correctCount = 0;
    let wrongCount = 0;

    for (const question of questions) {
        const userAnswer = exam.answers[question.id];
        if (userAnswer !== undefined && userAnswer === question.correctOption) {
            correctCount++;
        } else {
            wrongCount++;
        }
    }

    // O'tdi yoki yo'q (86% dan yuqori)
    const percentage = (correctCount / exam.totalQuestions) * 100;
    const passed = percentage >= PASS_PERCENTAGE;

    // Imtihonni yangilash
    await exam.update({
        correctCount,
        wrongCount,
        status: 'completed',
        passed,
        completedAt: new Date()
    });

    return { correctCount, wrongCount, passed, percentage };
};

/**
 * Vaqt tugaganini tekshirish helper funksiyasi
 */
const checkExamExpired = async (exam, res) => {
    const now = new Date();
    if (now > new Date(exam.expiresAt)) {
        const result = await autoSubmitExam(exam);
        return {
            expired: true,
            response: {
                message: 'Imtihon vaqti tugadi. Natijalaringiz saqlandi.',
                result: {
                    examId: exam.id,
                    correctCount: result.correctCount,
                    wrongCount: result.wrongCount,
                    totalQuestions: exam.totalQuestions,
                    percentage: result.percentage.toFixed(1),
                    passed: result.passed
                }
            }
        };
    }
    return { expired: false };
};

/**
 * Yangi final imtihon boshlash
 * Barcha biletlardan tasodifiy 50 ta savol tanlanadi
 */
const startFinalExam = async (req, res) => {
    try {
        const userId = req.user.id;

        // Foydalanuvchining davom etayotgan imtihoni bormi tekshirish
        const existingExam = await FinalExam.findOne({
            where: { userId, status: 'pending' }
        });

        if (existingExam) {
            // Vaqt tugaganini tekshirish
            const now = new Date();
            if (now > new Date(existingExam.expiresAt)) {
                // Vaqt tugagan - imtihonni avtomatik yakunlash
                await autoSubmitExam(existingExam);
                return res.status(400).json({ 
                    message: 'Imtihon vaqti tugadi. Natijalaringiz saqlandi.',
                    examId: existingExam.id
                });
            }

            // Qolgan vaqtni hisoblash
            const remainingTime = Math.max(0, Math.floor((new Date(existingExam.expiresAt) - now) / 1000));

            // Davom etayotgan imtihon mavjud - savollarni qaytarish
            const questions = await Question.findAll({
                where: { id: existingExam.questionIds },
                attributes: ['id', 'ticketId', 'questionText', 'image', 'options']
            });

            // Savollarni tartibda qaytarish
            const orderedQuestions = existingExam.questionIds.map(id => 
                questions.find(q => q.id === id)
            );

            return res.status(200).json({
                message: 'Davom etayotgan imtihon topildi',
                exam: {
                    id: existingExam.id,
                    status: existingExam.status,
                    totalQuestions: existingExam.totalQuestions,
                    answeredCount: Object.keys(existingExam.answers).length,
                    startedAt: existingExam.startedAt,
                    expiresAt: existingExam.expiresAt,
                    remainingTime // sekundlarda
                },
                questions: orderedQuestions,
                answers: existingExam.answers
            });
        }

        // Bazadagi barcha savollardan tasodifiy 50 tasini olish
        const allQuestions = await Question.findAll({
            attributes: ['id'],
            order: sequelize.random()
        });

        if (allQuestions.length < TOTAL_QUESTIONS) {
            return res.status(400).json({ 
                message: `Bazada yetarli savol yo'q. Kerakli: ${TOTAL_QUESTIONS}, Mavjud: ${allQuestions.length}` 
            });
        }

        // 50 ta tasodifiy savol ID larini olish
        const randomQuestionIds = allQuestions
            .slice(0, TOTAL_QUESTIONS)
            .map(q => q.id);

        // Yangi imtihon yaratish
        const now = new Date();
        const expiresAt = new Date(now.getTime() + EXAM_DURATION_MS);
        
        const newExam = await FinalExam.create({
            userId,
            questionIds: randomQuestionIds,
            answers: {},
            totalQuestions: TOTAL_QUESTIONS,
            status: 'pending',
            startedAt: now,
            expiresAt
        });

        // Savollarni to'liq ma'lumotlar bilan olish
        const questions = await Question.findAll({
            where: { id: randomQuestionIds },
            attributes: ['id', 'ticketId', 'questionText', 'image', 'options']
        });

        // Savollarni tartibda qaytarish
        const orderedQuestions = randomQuestionIds.map(id => 
            questions.find(q => q.id === id)
        );

        res.status(201).json({
            message: 'Final imtihon boshlandi',
            exam: {
                id: newExam.id,
                status: newExam.status,
                totalQuestions: newExam.totalQuestions,
                answeredCount: 0,
                startedAt: newExam.startedAt,
                expiresAt: newExam.expiresAt,
                remainingTime: EXAM_DURATION_MINUTES * 60 // sekundlarda
            },
            questions: orderedQuestions
        });
    } catch (error) {
        console.error('Final imtihon boshlashda xato:', error);
        res.status(500).json({ message: 'Server xatosi', error: error.message });
    }
};

/**
 * Savolga javob berish
 */
const answerQuestion = async (req, res) => {
    try {
        const userId = req.user.id;
        const { examId, questionId, selectedOption } = req.body;

        // Imtihonni topish
        const exam = await FinalExam.findOne({
            where: { id: examId, userId, status: 'pending' }
        });

        if (!exam) {
            return res.status(404).json({ message: 'Faol imtihon topilmadi' });
        }

        // Vaqt tugaganini tekshirish
        const expiredCheck = await checkExamExpired(exam, res);
        if (expiredCheck.expired) {
            return res.status(400).json(expiredCheck.response);
        }

        // Savol imtihon ichida bormi tekshirish
        if (!exam.questionIds.includes(questionId)) {
            return res.status(400).json({ message: 'Bu savol imtihonda mavjud emas' });
        }

        // Javobni saqlash
        const updatedAnswers = { ...exam.answers, [questionId]: selectedOption };
        await exam.update({ answers: updatedAnswers });

        // Qolgan vaqtni hisoblash
        const remainingTime = Math.max(0, Math.floor((new Date(exam.expiresAt) - new Date()) / 1000));

        res.status(200).json({
            message: 'Javob saqlandi',
            answeredCount: Object.keys(updatedAnswers).length,
            totalQuestions: exam.totalQuestions,
            remainingTime
        });
    } catch (error) {
        console.error('Javob saqlashda xato:', error);
        res.status(500).json({ message: 'Server xatosi', error: error.message });
    }
};

/**
 * Bir nechta savollarga birdan javob berish
 */
const answerMultipleQuestions = async (req, res) => {
    try {
        const userId = req.user.id;
        const { examId, answers } = req.body; // answers: { questionId: selectedOption, ... }

        const exam = await FinalExam.findOne({
            where: { id: examId, userId, status: 'pending' }
        });

        if (!exam) {
            return res.status(404).json({ message: 'Faol imtihon topilmadi' });
        }

        // Vaqt tugaganini tekshirish
        const expiredCheck = await checkExamExpired(exam, res);
        if (expiredCheck.expired) {
            return res.status(400).json(expiredCheck.response);
        }

        // Barcha javoblarni saqlash
        const updatedAnswers = { ...exam.answers, ...answers };
        await exam.update({ answers: updatedAnswers });

        // Qolgan vaqtni hisoblash
        const remainingTime = Math.max(0, Math.floor((new Date(exam.expiresAt) - new Date()) / 1000));

        res.status(200).json({
            message: 'Javoblar saqlandi',
            answeredCount: Object.keys(updatedAnswers).length,
            totalQuestions: exam.totalQuestions,
            remainingTime
        });
    } catch (error) {
        console.error('Javoblar saqlashda xato:', error);
        res.status(500).json({ message: 'Server xatosi', error: error.message });
    }
};

/**
 * Imtihonni yakunlash va natijani hisoblash
 */
const submitFinalExam = async (req, res) => {
    try {
        const userId = req.user.id;
        const { examId, answers } = req.body;

        const exam = await FinalExam.findOne({
            where: { id: examId, userId, status: 'pending' }
        });

        if (!exam) {
            return res.status(404).json({ message: 'Faol imtihon topilmadi' });
        }

        // Javoblarni saqlash (agar yuborilgan bo'lsa)
        const finalAnswers = answers ? { ...exam.answers, ...answers } : exam.answers;

        // To'g'ri javoblarni olish
        const questions = await Question.findAll({
            where: { id: exam.questionIds },
            attributes: ['id', 'correctOption']
        });

        // Natijani hisoblash
        let correctCount = 0;
        let wrongCount = 0;
        let unansweredCount = 0;
        const results = [];

        for (const question of questions) {
            const userAnswer = finalAnswers[question.id];
            
            if (userAnswer === undefined || userAnswer === null) {
                // Javob berilmagan - noto'g'ri hisoblanadi
                unansweredCount++;
                wrongCount++;
                results.push({
                    questionId: question.id,
                    userAnswer: null,
                    correctAnswer: question.correctOption,
                    isCorrect: false,
                    status: 'unanswered'
                });
            } else {
                const isCorrect = userAnswer === question.correctOption;
                if (isCorrect) {
                    correctCount++;
                } else {
                    wrongCount++;
                }
                results.push({
                    questionId: question.id,
                    userAnswer,
                    correctAnswer: question.correctOption,
                    isCorrect,
                    status: isCorrect ? 'correct' : 'wrong'
                });
            }
        }

        // O'tdi yoki yo'q (86% dan yuqori)
        const percentage = (correctCount / exam.totalQuestions) * 100;
        const passed = percentage >= PASS_PERCENTAGE;

        // Imtihonni yangilash
        await exam.update({
            answers: finalAnswers,
            correctCount,
            wrongCount,
            status: 'completed',
            passed,
            completedAt: new Date()
        });

        res.status(200).json({
            message: passed ? '🎉 Tabriklaymiz! Imtihondan o\'tdingiz!' : '😔 Afsuski, imtihondan o\'ta olmadingiz',
            result: {
                examId: exam.id,
                correctCount,
                wrongCount,
                unansweredCount,
                totalQuestions: exam.totalQuestions,
                percentage: percentage.toFixed(1),
                passed,
                requiredPercentage: PASS_PERCENTAGE,
                startedAt: exam.startedAt,
                completedAt: new Date()
            },
            details: results
        });
    } catch (error) {
        console.error('Imtihon yakunlashda xato:', error);
        res.status(500).json({ message: 'Server xatosi', error: error.message });
    }
};

/**
 * Foydalanuvchining imtihon tarixini olish
 */
const getExamHistory = async (req, res) => {
    try {
        const userId = req.user.id;

        const exams = await FinalExam.findAll({
            where: { userId },
            order: [['createdAt', 'DESC']],
            attributes: [
                'id', 'correctCount', 'wrongCount', 'totalQuestions', 
                'status', 'passed', 'startedAt', 'completedAt', 'createdAt'
            ]
        });

        const history = exams.map(exam => ({
            id: exam.id,
            correctCount: exam.correctCount,
            wrongCount: exam.wrongCount,
            totalQuestions: exam.totalQuestions,
            percentage: exam.status === 'completed' 
                ? ((exam.correctCount / exam.totalQuestions) * 100).toFixed(1) 
                : null,
            status: exam.status,
            passed: exam.passed,
            startedAt: exam.startedAt,
            completedAt: exam.completedAt
        }));

        res.status(200).json({
            message: 'Imtihon tarixi',
            total: history.length,
            passedCount: history.filter(e => e.passed).length,
            history
        });
    } catch (error) {
        console.error('Tarix olishda xato:', error);
        res.status(500).json({ message: 'Server xatosi', error: error.message });
    }
};

/**
 * Bitta imtihon natijasini ko'rish
 */
const getExamResult = async (req, res) => {
    try {
        const userId = req.user.id;
        const { examId } = req.params;

        const exam = await FinalExam.findOne({
            where: { id: examId, userId }
        });

        if (!exam) {
            return res.status(404).json({ message: 'Imtihon topilmadi' });
        }

        // Savollarni to'liq ma'lumotlar bilan olish
        const questions = await Question.findAll({
            where: { id: exam.questionIds },
            attributes: ['id', 'ticketId', 'questionText', 'image', 'options', 'correctOption', 'explanation']
        });

        // Savollarni tartibda va natijalar bilan qaytarish
        const detailedResults = exam.questionIds.map(id => {
            const question = questions.find(q => q.id === id);
            const userAnswer = exam.answers[id];
            return {
                question,
                userAnswer,
                isCorrect: userAnswer === question.correctOption
            };
        });

        res.status(200).json({
            exam: {
                id: exam.id,
                correctCount: exam.correctCount,
                wrongCount: exam.wrongCount,
                totalQuestions: exam.totalQuestions,
                percentage: ((exam.correctCount / exam.totalQuestions) * 100).toFixed(1),
                status: exam.status,
                passed: exam.passed,
                startedAt: exam.startedAt,
                completedAt: exam.completedAt
            },
            questions: detailedResults
        });
    } catch (error) {
        console.error('Natija olishda xato:', error);
        res.status(500).json({ message: 'Server xatosi', error: error.message });
    }
};

/**
 * Davom etayotgan imtihonni bekor qilish
 */
const cancelExam = async (req, res) => {
    try {
        const userId = req.user.id;
        const { examId } = req.params;

        const exam = await FinalExam.findOne({
            where: { id: examId, userId, status: 'pending' }
        });

        if (!exam) {
            return res.status(404).json({ message: 'Faol imtihon topilmadi' });
        }

        await exam.destroy();

        res.status(200).json({ message: 'Imtihon bekor qilindi' });
    } catch (error) {
        console.error('Imtihon bekor qilishda xato:', error);
        res.status(500).json({ message: 'Server xatosi', error: error.message });
    }
};

module.exports = {
    startFinalExam,
    submitFinalExam,
    getExamHistory,
    getExamResult,
    cancelExam
};
