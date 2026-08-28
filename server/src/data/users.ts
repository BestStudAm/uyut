import bcrypt from "bcryptjs";

import { db } from "../db.js";

export interface User {
  id: number;
  name: string;
  email: string;
  passwordHash: string;
}

interface UserRow {
  id: number;
  name: string;
  email: string;
  password_hash: string;
}

function mapUser(row: UserRow): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    passwordHash: row.password_hash,
  };
}

export function findUserByEmail(
  email: string,
): User | undefined {
  const row = db
    .prepare(
      `
        SELECT
          id,
          name,
          email,
          password_hash
        FROM users
        WHERE email = ?
        LIMIT 1
      `,
    )
    .get(email.trim()) as
    | UserRow
    | undefined;

  if (!row) {
    return undefined;
  }

  return mapUser(row);
}

export function findUserById(
  id: number,
): User | undefined {
  const row = db
    .prepare(
      `
        SELECT
          id,
          name,
          email,
          password_hash
        FROM users
        WHERE id = ?
        LIMIT 1
      `,
    )
    .get(id) as
    | UserRow
    | undefined;

  if (!row) {
    return undefined;
  }

  return mapUser(row);
}

export function createUser(
  name: string,
  email: string,
  passwordHash: string,
): User {
  const normalizedName = name.trim();
  const normalizedEmail = email.trim();

  const result = db
    .prepare(
      `
        INSERT INTO users (
          name,
          email,
          password_hash
        )
        VALUES (?, ?, ?)
      `,
    )
    .run(
      normalizedName,
      normalizedEmail,
      passwordHash,
    );

  const user = findUserById(
    Number(result.lastInsertRowid),
  );

  if (!user) {
    throw new Error(
      "Не удалось создать пользователя",
    );
  }

  return user;
}

/*
 * Создаём тестового пользователя только если
 * его ещё нет в базе.
 *
 * Артём:
 * artem@example.com
 * 12345678
 */
export function ensureDemoUser() {
  const existing =
    findUserByEmail(
      "artem@example.com",
    );

  if (existing) {
    return existing;
  }

  const passwordHash =
    bcrypt.hashSync(
      "12345678",
      10,
    );

  return createUser(
    "Артём",
    "artem@example.com",
    passwordHash,
  );
}
