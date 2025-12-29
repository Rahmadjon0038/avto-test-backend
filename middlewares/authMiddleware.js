const jwt = require('jsonwebtoken');
const {User} = require('../models/User');

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Tokenni ajratib olish (Bearer <token>)
            token = req.headers.authorization.split(' ')[1];

            // Tokenni tekshirish
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Foydalanuvchini bazadan topish (parolsiz)
            req.user = await User.findByPk(decoded.id, {
                attributes: { exclude: ['password'] }
            });

            if (!req.user) {
                return res.status(401).json({ message: "Foydalanuvchi topilmadi" });
            }

            next();
        } catch (error) {
            console.error(error);
            res.status(401).json({ message: "Token yaroqsiz yoki muddati o'tgan" });
        }
    }

    if (!token) {
        res.status(401).json({ message: "Token topilmadi, ruxsat berilmadi" });
    }
};

module.exports = { protect };