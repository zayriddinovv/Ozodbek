const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Загружаем переменные окружения
dotenv.config();

// Импортируем маршруты
const authRoutes = require('./routes/auth');
const contactRoutes = require('./routes/contact');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Подключение к MongoDB Atlas
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('MongoDB Atlas подключен'))
  .catch(err => console.error('Ошибка подключения к MongoDB:', err));

// Маршруты
app.use('/api/auth', authRoutes);
app.use('/api/contact', contactRoutes);

// Базовый маршрут
app.get('/', (req, res) => {
  res.json({ message: 'Device Repair Service API работает!' });
});

// Обработка ошибок
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Что-то пошло не так!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});






