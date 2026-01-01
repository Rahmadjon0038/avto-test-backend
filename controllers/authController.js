const { User } = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Token yordamchilari
const generateAccessToken = (id, role) => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '1d' });
};

const generateRefreshToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, { expiresIn: '15d' });
};

// 1. REGISTER
exports.register = async (req, res) => {
    try {
        const { firstName, lastName, phone, password } = req.body;
        const userExists = await User.findOne({ where: { phone } });
        if (userExists) return res.status(400).json({ message: "Bu telefon raqami band." });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        await User.create({ firstName, lastName, phone, password: hashedPassword });
        res.status(201).json({ message: "Muvaffaqiyatli ro'yxatdan o'tdingiz!" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// LOGIN qismini yangilaymiz
exports.login = async (req, res) => {
    try {
        const { phone, password } = req.body;
        const user = await User.findOne({ where: { phone } });

        if (user && (await bcrypt.compare(password, user.password))) {
            const accessToken = generateAccessToken(user.id, user.role);
            const refreshToken = generateRefreshToken(user.id);

            user.refreshToken = refreshToken;
            await user.save();

            res.json({
                role: user.role,
                accessToken,
                refreshToken,
                // Obuna ma'lumotlarini ham qo'shib yuboramiz
                subscriptionEnd: user.subscriptionEnd,
                isSubscribed: user.isSubscribed
            });
        } else {
            res.status(401).json({ message: "Telefon raqami yoki parol xato!" });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 3. GET ME - Foydalanuvchi profilini olish
exports.getMe = async (req, res) => {
    try {
        // req.user bizning protect middleware'dan keladi
        const user = await User.findByPk(req.user.id, {
            attributes: { exclude: ['password', 'refreshToken'] } // Maxfiy ma'lumotlarni bermaymiz
        });

        if (!user) return res.status(404).json({ message: "Foydalanuvchi topilmadi" });

        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 4. REFRESH TOKEN - Access tokenni yangilash
exports.refreshToken = async (req, res) => {
    try {
        const { token } = req.body;
        if (!token) return res.status(401).json({ message: "Refresh token talab qilinadi" });

        const user = await User.findOne({ where: { refreshToken: token } });
        if (!user) return res.status(403).json({ message: "Yaroqsiz refresh token" });

        jwt.verify(token, process.env.JWT_REFRESH_SECRET, (err, decoded) => {
            if (err) return res.status(403).json({ message: "Token muddati o'tgan" });
            
            const accessToken = generateAccessToken(user.id, user.role);
            res.json({ accessToken });
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};