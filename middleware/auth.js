// middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware для проверки токена
const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'Токен не предоставлен' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Недействительный токен' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Недействительный токен' });
  }
};

// Middleware для проверки роли администратора
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: 'Недостаточно прав для выполнения этого действия'
      });
    }
    next();
  };
};

// Middleware для валидации
const validate = (validations) => {
  return async (req, res, next) => {
    for (let validation of validations) {
      const result = await validation.run(req);
      if (result.errors.length) break;
    }

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    const extractedErrors = [];
    errors.array().map(err => extractedErrors.push({ [err.param]: err.msg }));

    return res.status(400).json({
      message: 'Ошибка валидации',
      errors: extractedErrors,
    });
  };
};

module.exports = { authenticate, authorize, validate };