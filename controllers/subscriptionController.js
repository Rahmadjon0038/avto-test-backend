const { User } = require('../models/User');

exports.activateSubscription = async (req, res) => {
    try {
        const { amount, paymentMethod } = req.body; // Summa va to'lov turi (Click/Payme)

        if (!amount || amount < 50000) {
            return res.status(400).json({ 
                message: "Obuna bo'lish uchun minimal summa 50,000 so'm!" 
            });
        }

        const user = await User.findByPk(req.user.id);
        if (!user) return res.status(404).json({ message: "Foydalanuvchi topilmadi" });

        const days = 30; // 50 ming so'm uchun 30 kun
        const startDate = new Date();
        let endDate = new Date();

        // Agar foydalanuvchining amaldagi obunasi bo'lsa, shuning ustiga qo'shamiz
        if (user.subscriptionEnd && new Date(user.subscriptionEnd) > startDate) {
            endDate = new Date(user.subscriptionEnd);
        }

        endDate.setDate(endDate.getDate() + days);

        // Bazani yangilash
        user.isSubscribed = true;
        user.subscriptionStart = startDate;
        user.subscriptionEnd = endDate;

        await user.save();

        res.json({
            message: `Muvaffaqiyatli to'lov! ${paymentMethod} orqali ${amount} so'm qabul qilindi. Obuna 30 kunga faollashtirildi.`,
            subscriptionEnd: user.subscriptionEnd
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};