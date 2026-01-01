const { Ticket } = require('../models/Ticket');
const { User } = require('../models/User'); // Foydalanuvchini bazadan tekshirish uchun qo'shildi

// 1. Barcha biletlarni olish (Obuna va Qulf mantiqi bilan)
exports.getAllTickets = async (req, res) => {
    try {
        // MUHIM: Foydalanuvchining eng oxirgi obuna holatini bazadan qayta o'qiymiz
        const user = await User.findByPk(req.user.id);
        
        const tickets = await Ticket.findAll({ order: [['ticket_number', 'ASC']] });
        
        const now = new Date();
        
        // Obuna va Adminlikni tekshirish
        const hasActiveSubscription = user.subscriptionEnd && new Date(user.subscriptionEnd) > now;
        const isAdmin = user.role === 'admin';

        // Biletlarni qayta ishlash
        const processedTickets = tickets.map(ticket => {
            const ticketData = ticket.get({ plain: true });

            // Mantiq: Agar bilet demo bo'lsa YOKI foydalanuvchida obuna bo'lsa YOKI foydalanuvchi admin bo'lsa - OCHIQ
            if (ticketData.is_demo || hasActiveSubscription || isAdmin) {
                ticketData.is_locked = false;
            } else {
                ticketData.is_locked = true;
            }
            
            return ticketData;
        });

        res.json(processedTickets);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 2. Yangi bilet yaratish (Faqat Admin)
exports.createTicket = async (req, res) => {
    try {
        const { ticket_number, name, description, is_demo } = req.body;
        const newTicket = await Ticket.create({ ticket_number, name, description, is_demo });
        res.status(201).json(newTicket);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// 3. Biletni tahrirlash (Faqat Admin)
exports.updateTicket = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, is_demo, ticket_number } = req.body;
        
        const ticket = await Ticket.findByPk(id);
        if (!ticket) return res.status(404).json({ message: "Bilet topilmadi" });

        await ticket.update({ name, description, is_demo, ticket_number });
        res.json({ message: "Bilet muvaffaqiyatli yangilandi", ticket });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 4. Biletni o'chirish (Faqat Admin)
exports.deleteTicket = async (req, res) => {
    try {
        const { id } = req.params;
        const ticket = await Ticket.findByPk(id);
        if (!ticket) return res.status(404).json({ message: "Bilet topilmadi" });

        await ticket.destroy();
        res.json({ message: "Bilet o'chirib tashlandi" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};