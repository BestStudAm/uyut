import {
  Router,
  type Request,
  type Response,
} from "express";

import bcrypt from "bcryptjs";

import {
  findUserByEmail,
  createUser,
} from "../db.js";

const router = Router();

router.post(
  "/login",
  async (
    req: Request,
    res: Response,
  ) => {
    try {
      const { email, password } =
        req.body;

      // Проверяем, что данные пришли
      if (!email || !password) {
        return res.status(400).json({
          message:
            "Введите почту и пароль",
        });
      }

      // Ищем пользователя
      const user =
        findUserByEmail(email);

      if (!user) {
        return res.status(401).json({
          message:
            "Неверная почта или пароль",
        });
      }

      // Проверяем пароль
      const passwordValid =
        await bcrypt.compare(
          password,
          user.passwordHash,
        );

      if (!passwordValid) {
        return res.status(401).json({
          message:
            "Неверная почта или пароль",
        });
      }

      // Успешная авторизация
      return res.json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      });
    } catch (error) {
      console.error(
        "Login error:",
        error,
      );

      return res.status(500).json({
        message: "Ошибка сервера",
      });
    }
  },
);

router.post(
  "/register",
  async (
    req: Request,
    res: Response,
  ) => {
    try {
      const {
        name,
        email,
        password,
      } = req.body;

      // Проверяем обязательные поля
      if (
        !name ||
        !email ||
        !password
      ) {
        return res.status(400).json({
          message:
            "Заполните все поля",
        });
      }

      // Проверяем длину пароля
      if (password.length < 8) {
        return res.status(400).json({
          message:
            "Пароль должен содержать минимум 8 символов",
        });
      }

      // Проверяем, существует ли пользователь
      const existingUser =
        findUserByEmail(email);

      if (existingUser) {
        return res.status(409).json({
          message:
            "Пользователь с такой почтой уже существует",
        });
      }

      // Хешируем пароль
      const passwordHash =
        await bcrypt.hash(
          password,
          10,
        );

      // Создаём пользователя
      const user = createUser(
        name.trim(),
        email.trim(),
        passwordHash,
      );

      return res.status(201).json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      });
    } catch (error) {
      console.error(
        "Register error:",
        error,
      );

      return res.status(500).json({
        message:
          "Ошибка сервера",
      });
    }
  },
);

export default router;