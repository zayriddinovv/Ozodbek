
// routes/auth.js
const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { authenticate, validate } = require('../middleware/auth');

const router = express.Router();

// Генерация JWT токена
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

// Валидация для регистрации
const registerValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Имя должно содержать от 2 до 50 символов'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Введите корректный email'),
  body('phone')
    .matches(/^[\+]?[1-9][\d]{0,15}$/)
    .withMessage('Введите корректный номер телефона'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Пароль должен содержать минимум 6 символов')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Пароль должен содержать как минимум одну заглавную букву, одну строчную букву и одну цифру')
];

// Валидация для входа
const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Введите корректный email'),
  body('password')
    .exists()
    .withMessage('Пароль обязателен')
];

// @route   POST /api/auth/register
// @desc    Регистрация пользователя
// @access  Public
router.post('/register', registerValidation, validate(registerValidation), async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    // Проверяем, существует ли пользователь
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Пользователь с таким email уже существует' });
    }

    // Создаем нового пользователя
    const user = new User({
      name,
      email,
      phone,
      password
    });

    await user.save();

    // Генерируем токен
    const token = generateToken(user._id);

    res.status(201).json({
      message: 'Пользователь успешно зарегистрирован',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// @route   POST /api/auth/login
// @desc    Вход пользователя
// @access  Public
router.post('/login', loginValidation, validate(loginValidation), async (req, res) => {
  try {
    const { email, password } = req.body;

    // Ищем пользователя
    const user = await User.findOne({ email });
    if (!user || !user.isActive) {
      return res.status(400).json({ message: 'Неверные учетные данные' });
    }

    // Проверяем пароль
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Неверные учетные данные' });
    }

    // Генерируем токен
    const token = generateToken(user._id);

    res.json({
      message: 'Успешный вход',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// @route   GET /api/auth/profile
// @desc    Получение профиля пользователя
// @access  Private
router.get('/profile', authenticate, async (req, res) => {
  try {
    res.json({
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        phone: req.user.phone,
        role: req.user.role,
        createdAt: req.user.createdAt
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// @route   PUT /api/auth/profile
// @desc    Обновление профиля пользователя
// @access  Private
router.put('/profile', authenticate, [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Имя должно содержать от 2 до 50 символов'),
  body('phone')
    .optional()
    .matches(/^[\+]?[1-9][\d]{0,15}$/)
    .withMessage('Введите корректный номер телефона')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, phone } = req.body;
    const updateData = {};

    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      message: 'Профиль успешно обновлен',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

module.exports = router;