const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const User = sequelize.define('User', {
    id: { 
        type: DataTypes.INTEGER, 
        autoIncrement: true, 
        primaryKey: true 
    },
    firstName: { 
        type: DataTypes.STRING, 
        allowNull: false 
    },
    lastName: { 
        type: DataTypes.STRING, 
        allowNull: false 
    },
    phone: { 
        type: DataTypes.STRING, 
        unique: true, 
        allowNull: false 
    },
    password: { 
        type: DataTypes.STRING, 
        allowNull: false 
    },
    role: { 
        type: DataTypes.ENUM('user', 'admin'), 
        defaultValue: 'user' 
    },
    isSubscribed: { 
        type: DataTypes.BOOLEAN, 
        defaultValue: false 
    },
    subscriptionStart: { type: DataTypes.DATE, allowNull: true },
    subscriptionEnd: { type: DataTypes.DATE, allowNull: true },
    refreshToken: { 
        type: DataTypes.TEXT, 
        allowNull: true 
    }
}, {
    timestamps: true
});

const initUserTable = async () => {
  try {
    // ❗️Agar jadval mavjud bo‘lmasa yaratadi, eskilar saqlanadi
    await User.sync();

    console.log('✅ Users jadvali mavjud bo‘lmasa yaratildi, eski ma’lumotlar saqlandi');
  } catch (error) {
    console.error('❌ User modelini yaratishda xato:', error);
  }
};



module.exports = { User, initUserTable };