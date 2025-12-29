const { Ticket } = require('../models/Ticket');

// 1. Barcha biletlarni olish
exports.getAllTickets = async (req, res) => {
    try {
        const tickets = await Ticket.findAll({ order: [['ticket_number', 'ASC']] });
        res.json(tickets);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


exports.createTicket = async (req, res) => {
    try {
        const { ticket_number, name, description, is_demo } = req.body; // description qo'shildi
        const newTicket = await Ticket.create({ ticket_number, name, description, is_demo });
        res.status(201).json(newTicket);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.updateTicket = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, is_demo, ticket_number } = req.body; // description qo'shildi
        
        const ticket = await Ticket.findByPk(id);
        if (!ticket) return res.status(404).json({ message: "Bilet topilmadi" });

        await ticket.update({ name, description, is_demo, ticket_number });
        res.json({ message: "Bilet muvaffaqiyatli yangilandi", ticket });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 4. Biletni o'chirish (Admin uchun)
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