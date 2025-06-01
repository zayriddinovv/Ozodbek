// routes/contact.js
const express = require('express');
const { body, validationResult } = require('express-validator');
const nodemailer = require('nodemailer');
const Contact = require('../models/Contact');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Настройка nodemailer - ИСПРАВЛЕНО: createTransport вместо createTransporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Валидация для создания заявки
const contactValidation = [
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
  body('deviceType')
    .isIn(['smartphone', 'tablet', 'laptop', 'smartwatch', 'other'])
    .withMessage('Выберите корректный тип устройства'),
  body('deviceModel')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Модель устройства обязательна'),
  body('problemDescription')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Описание проблемы должно содержать от 10 до 1000 символов'),
  body('urgency')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Выберите корректный уровень срочности')
];

// @route   POST /api/contact
// @desc    Создание новой заявки на ремонт
// @access  Public
router.post('/', contactValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Ошибка валидации',
        errors: errors.array()
      });
    }

    const {
      name,
      email,
      phone,
      deviceType,
      deviceModel,
      problemDescription,
      urgency
    } = req.body;

    // Создаем новую заявку
    const contact = new Contact({
      name,
      email,
      phone,
      deviceType,
      deviceModel,
      problemDescription,
      urgency: urgency || 'medium'
    });

    await contact.save();

    // Отправляем email подтверждение
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Подтверждение заявки на ремонт',
        html: `
          <h2>Спасибо за обращение!</h2>
          <p>Ваша заявка на ремонт успешно получена.</p>
          <p><strong>Детали заявки:</strong></p>
          <ul>
            <li>Имя: ${name}</li>
            <li>Устройство: ${deviceModel} (${deviceType})</li>
            <li>Проблема: ${problemDescription}</li>
            <li>Срочность: ${urgency}</li>
          </ul>
          <p>Мы свяжемся с вами в ближайшее время.</p>
        `
      });
    } catch (emailError) {
      console.error('Ошибка отправки email:', emailError);
    }

    res.status(201).json({
      message: 'Заявка успешно создана',
      contact: {
        id: contact._id,
        name: contact.name,
        deviceType: contact.deviceType,
        deviceModel: contact.deviceModel,
        status: contact.status,
        createdAt: contact.createdAt
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// @route   GET /api/contact
// @desc    Получение всех заявок (только для админов)
// @access  Private/Admin
router.get('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status;
    const urgency = req.query.urgency;

    const query = {};
    if (status) query.status = status;
    if (urgency) query.urgency = urgency;

    const contacts = await Contact.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Contact.countDocuments(query);

    res.json({
      contacts,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// @route   GET /api/contact/:id
// @desc    Получение конкретной заявки
// @access  Private/Admin
router.get('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);

    if (!contact) {
      return res.status(404).json({ message: 'Заявка не найдена' });
    }

    res.json(contact);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// @route   PUT /api/contact/:id
// @desc    Обновление статуса заявки
// @access  Private/Admin
router.put('/:id', authenticate, authorize('admin'), [
  body('status')
    .optional()
    .isIn(['new', 'in_progress', 'completed', 'cancelled'])
    .withMessage('Выберите корректный статус'),
  body('estimatedCost')
    .optional()
    .isNumeric()
    .withMessage('Стоимость должна быть числом'),
  body('notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Заметки не должны превышать 500 символов')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { status, estimatedCost, notes } = req.body;
    const updateData = {};

    if (status) updateData.status = status;
    if (estimatedCost !== undefined) updateData.estimatedCost = estimatedCost;
    if (notes) updateData.notes = notes;

    const contact = await Contact.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!contact) {
      return res.status(404).json({ message: 'Заявка не найдена' });
    }

    res.json({
      message: 'Заявка успешно обновлена',
      contact
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// @route   DELETE /api/contact/:id
// @desc    Удаление заявки
// @access  Private/Admin
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const contact = await Contact.findByIdAndDelete(req.params.id);

    if (!contact) {
      return res.status(404).json({ message: 'Заявка не найдена' });
    }
    res.json({ message: 'Заявка успешно удалена' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

module.exports = router;