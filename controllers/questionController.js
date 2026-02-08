// 3. Admin savolni o'chirishi
exports.deleteQuestion = async (req, res) => {
    try {
        const { id } = req.params;
        const question = await Question.findByPk(id);
        if (!question) return res.status(404).json({ message: "Savol topilmadi" });
        await question.destroy();
        res.json({ message: "Savol o'chirildi" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 4. Admin savolni tahrirlashi
exports.updateQuestion = async (req, res) => {
    try {
        const { id } = req.params;
        let { questionText, options, correctOption, explanation } = req.body;
        let image = req.file ? `/uploads/${req.file.filename}` : req.body.image;


        // options may come as a JSON string or array from form-data
        let parsedOptions = options;
        if (typeof options === 'string') {
            try {
                parsedOptions = JSON.parse(options.trim());
            } catch (e) {
                return res.status(400).json({ message: 'Options must be a valid JSON array.' });
            }
        } else if (options && !Array.isArray(options)) {
            return res.status(400).json({ message: 'Options must be a valid JSON array.' });
        }

        const question = await Question.findByPk(id);
        if (!question) return res.status(404).json({ message: "Savol topilmadi" });
        question.questionText = questionText ?? question.questionText;
        question.options = parsedOptions ?? question.options;
        question.correctOption = correctOption ?? question.correctOption;
        question.explanation = explanation ?? question.explanation;
        question.image = image ?? question.image;
        await question.save();
        res.json(question);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};
const { Question } = require('../models/Question');
const { Ticket } = require('../models/Ticket');
const { User } = require('../models/User');

// 1. Admin ma'lum bir biletga savol qo'shishi
exports.createQuestion = async (req, res) => {
    try {
        const { ticketId, questionText, options, correctOption, explanation } = req.body;
        let image = req.file ? `/uploads/${req.file.filename}` : null;


        // options may come as a JSON string or array from form-data
        let parsedOptions = options;
        if (typeof options === 'string') {
            try {
                parsedOptions = JSON.parse(options.trim());
            } catch (e) {
                return res.status(400).json({ message: 'Options must be a valid JSON array.' });
            }
        } else if (!Array.isArray(options)) {
            return res.status(400).json({ message: 'Options must be a valid JSON array.' });
        }

        // Bilet mavjudligini tekshiramiz
        const ticket = await Ticket.findByPk(ticketId);
        if (!ticket) return res.status(404).json({ message: "Bunday bilet topilmadi" });

        const newQuestion = await Question.create({
            ticketId,
            questionText,
            options: parsedOptions,
            correctOption,
            explanation,
            image
        });

        res.status(201).json(newQuestion);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// 2. User biletni bosganda uning ichidagi testlarni olish
exports.getQuestionsByTicket = async (req, res) => {
    try {
        const { ticketId } = req.params;

        // Biletni va uning qulf holatini tekshirish uchun user ma'lumotlarini bazadan olamiz
        const user = await User.findByPk(req.user.id);
        const ticket = await Ticket.findByPk(ticketId);

        if (!ticket) return res.status(404).json({ message: "Bilet topilmadi" });

        // Xavfsizlik: Bilet pullik bo'lsa va userda obuna bo'lmasa - ruxsat bermaymiz
        const now = new Date();
        const hasActiveSubscription = user.subscriptionEnd && new Date(user.subscriptionEnd) > now;
        const isAdmin = user.role === 'admin';

        if (!ticket.is_demo && !hasActiveSubscription && !isAdmin) {
            return res.status(403).json({ message: "Bu biletni ko'rish uchun obuna bo'lishingiz kerak!" });
        }

        const questions = await Question.findAll({ 
            where: { ticketId },
            order: [['id', 'ASC']] 
        });

        res.json({
            ticket_name: ticket.name,
            total_questions: questions.length,
            questions
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 5. JSON fayl orqali ko'plab savollarni import qilish
exports.importQuestionsFromJson = async (req, res) => {
    try {
        const { ticketId, questions } = req.body;

        // ticketId tekshirish
        if (!ticketId) {
            return res.status(400).json({ message: "ticketId majburiy" });
        }

        // Bilet mavjudligini tekshirish
        const ticket = await Ticket.findByPk(ticketId);
        if (!ticket) {
            return res.status(404).json({ message: "Bunday bilet topilmadi" });
        }

        // Savollar massivini tekshirish
        if (!questions || !Array.isArray(questions) || questions.length === 0) {
            return res.status(400).json({ message: "questions massivi majburiy va bo'sh bo'lmasligi kerak" });
        }

        const createdQuestions = [];
        const errors = [];

        for (let i = 0; i < questions.length; i++) {
            const q = questions[i];
            
            // Har bir savol uchun validatsiya
            if (!q.questionText) {
                errors.push({ index: i, error: "questionText majburiy" });
                continue;
            }
            if (!q.options || !Array.isArray(q.options) || q.options.length < 2) {
                errors.push({ index: i, error: "options kamida 2 ta variant bo'lishi kerak" });
                continue;
            }
            if (q.correctOption === undefined || q.correctOption < 0 || q.correctOption >= q.options.length) {
                errors.push({ index: i, error: "correctOption noto'g'ri" });
                continue;
            }

            try {
                const newQuestion = await Question.create({
                    ticketId,
                    questionText: q.questionText,
                    options: q.options,
                    correctOption: q.correctOption,
                    explanation: q.explanation || null,
                    image: q.image || null
                });
                createdQuestions.push(newQuestion);
            } catch (err) {
                errors.push({ index: i, error: err.message });
            }
        }

        res.status(201).json({
            message: `${createdQuestions.length} ta savol muvaffaqiyatli qo'shildi`,
            totalSent: questions.length,
            successCount: createdQuestions.length,
            errorCount: errors.length,
            createdQuestions,
            errors: errors.length > 0 ? errors : undefined
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 6. JSON fayl yuklash orqali import (multer bilan)
exports.importQuestionsFromFile = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "JSON fayl yuklanmadi" });
        }

        const fs = require('fs');
        const filePath = req.file.path;
        
        // Faylni o'qish
        const fileContent = fs.readFileSync(filePath, 'utf8');
        let jsonData;
        
        try {
            jsonData = JSON.parse(fileContent);
        } catch (e) {
            fs.unlinkSync(filePath); // Faylni o'chirish
            return res.status(400).json({ message: "Noto'g'ri JSON format" });
        }

        // Faylni o'chirish (endi kerak emas)
        fs.unlinkSync(filePath);

        const { ticketId, questions } = jsonData;

        // ticketId tekshirish
        if (!ticketId) {
            return res.status(400).json({ message: "JSON ichida ticketId majburiy" });
        }

        // Bilet mavjudligini tekshirish
        const ticket = await Ticket.findByPk(ticketId);
        if (!ticket) {
            return res.status(404).json({ message: "Bunday bilet topilmadi" });
        }

        // Savollar massivini tekshirish
        if (!questions || !Array.isArray(questions) || questions.length === 0) {
            return res.status(400).json({ message: "JSON ichida questions massivi majburiy" });
        }

        const createdQuestions = [];
        const errors = [];

        for (let i = 0; i < questions.length; i++) {
            const q = questions[i];
            
            if (!q.questionText) {
                errors.push({ index: i, error: "questionText majburiy" });
                continue;
            }
            if (!q.options || !Array.isArray(q.options) || q.options.length < 2) {
                errors.push({ index: i, error: "options kamida 2 ta variant bo'lishi kerak" });
                continue;
            }
            if (q.correctOption === undefined || q.correctOption < 0 || q.correctOption >= q.options.length) {
                errors.push({ index: i, error: "correctOption noto'g'ri" });
                continue;
            }

            try {
                const newQuestion = await Question.create({
                    ticketId,
                    questionText: q.questionText,
                    options: q.options,
                    correctOption: q.correctOption,
                    explanation: q.explanation || null,
                    image: q.image || null
                });
                createdQuestions.push(newQuestion);
            } catch (err) {
                errors.push({ index: i, error: err.message });
            }
        }

        res.status(201).json({
            message: `${createdQuestions.length} ta savol muvaffaqiyatli qo'shildi`,
            ticketId,
            ticketName: ticket.name,
            totalSent: questions.length,
            successCount: createdQuestions.length,
            errorCount: errors.length,
            errors: errors.length > 0 ? errors : undefined
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};