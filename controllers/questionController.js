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