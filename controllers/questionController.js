const { Question } = require('../models/Question');
const { Ticket } = require('../models/Ticket');
const { User } = require('../models/User');

// 1. Admin ma'lum bir biletga savol qo'shishi
exports.createQuestion = async (req, res) => {
    try {
        const { ticketId, questionText, options, correctOption, explanation, image } = req.body;

        // Bilet mavjudligini tekshiramiz
        const ticket = await Ticket.findByPk(ticketId);
        if (!ticket) return res.status(404).json({ message: "Bunday bilet topilmadi" });

        const newQuestion = await Question.create({
            ticketId,
            questionText,
            options,
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