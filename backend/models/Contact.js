// models/Contact.js
const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Имя обязательно'],
    trim: true,
    maxlength: [50, 'Имя не должно превышать 50 символов']
  },
  email: {
    type: String,
    required: [true, 'Email обязателен'],
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Пожалуйста, введите корректный email'
    ]
  },
  phone: {
    type: String,
    required: [true, 'Телефон обязателен']
  },
  deviceType: {
    type: String,
    required: [true, 'Тип устройства обязателен'],
    enum: ['smartphone', 'tablet', 'laptop', 'smartwatch', 'other']
  },
  deviceModel: {
    type: String,
    required: [true, 'Модель устройства обязательна'],
    trim: true
  },
  problemDescription: {
    type: String,
    required: [true, 'Описание проблемы обязательно'],
    maxlength: [1000, 'Описание не должно превышать 1000 символов']
  },
  urgency: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['new', 'in_progress', 'completed', 'cancelled'],
    default: 'new'
  },
  estimatedCost: {
    type: Number,
    default: 0
  },
  notes: {
    type: String,
    maxlength: [500, 'Заметки не должны превышать 500 символов']
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Contact', contactSchema);