import {
  Router,
  type Request,
  type Response,
} from "express";

import bcrypt from "bcryptjs";

import {
  findUserByEmail,
  createUser,
} from "../data/users.js";

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

      // Проверяем обязательные поля.
      if (
        typeof email !== "string" ||
        typeof password !== "string" ||
        !email.trim() ||
        !password
      ) {
        return res.status(400).json({
          message:
            "Введите почту и пароль",
        });
      }

      const normalizedEmail =
        email.trim();

      // Ищем пользователя в SQLite.
      const user =
        findUserByEmail(
          normalizedEmail,
        );

      if (!user) {
        return res.status(401).json({
          message:
            "Неверная почта или пароль",
        });
      }

      // Проверяем пароль.
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

      // Успешная авторизация.
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

      // Проверяем типы и обязательные поля.
      if (
        typeof name !== "string" ||
        typeof email !== "string" ||
        typeof password !== "string" ||
        !name.trim() ||
        !email.trim() ||
        !password
      ) {
        return res.status(400).json({
          message:
            "Заполните все поля",
        });
      }

      const normalizedName =
        name.trim();

      const normalizedEmail =
        email.trim();

      // Проверяем длину пароля.
      if (password.length < 8) {
        return res.status(400).json({
          message:
            "Пароль должен содержать минимум 8 символов",
        });
      }

      // Проверяем существование пользователя
      // в SQLite.
      const existingUser =
        findUserByEmail(
          normalizedEmail,
        );

      if (existingUser) {
        return res.status(409).json({
          message:
            "Пользователь с такой почтой уже существует",
        });
      }

      // Хешируем пароль.
      const passwordHash =
        await bcrypt.hash(
          password,
          10,
        );

      let user;

      try {
        // Создаём пользователя в SQLite.
        user = createUser(
          normalizedName,
          normalizedEmail,
          passwordHash,
        );
      } catch (error) {
        /*
         * Даже если два запроса на регистрацию
         * одновременно пришли с одной почтой,
         * UNIQUE в SQLite не позволит создать
         * второго пользователя.
         */
        if (
          error instanceof Error &&
          error.message.includes(
            "UNIQUE constraint failed",
          )
        ) {
          return res.status(409).json({
            message:
              "Пользователь с такой почтой уже существует",
          });
        }

        throw error;
      }

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
