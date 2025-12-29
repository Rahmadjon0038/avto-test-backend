const authorizeAdmin = (req, res, next) => {
    // req.user bizga 'protect' middleware-dan keladi
    if (req.user && req.user.role === 'admin') {
        next(); // Foydalanuvchi admin bo'lsa, davom etishga ruxsat
    } else {
        // Agar admin bo'lmasa, 403 (Taqiqlangan) xatosini beramiz
        return res.status(403).json({ 
            message: "Kirish taqiqlangan: Ushbu amalni bajarish uchun admin huquqi kerak!" 
        });
    }
};

module.exports = { authorizeAdmin };