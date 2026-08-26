import bcrypt from "bcryptjs";

export interface User {
  id: number;
  name: string;
  email: string;
  passwordHash: string;
}

const users: User[] = [
  {
    id: 1,
    name: "Артём",
    email: "artem@example.com",
    passwordHash: bcrypt.hashSync(
      "12345678",
      10,
    ),
  },
];

export function findUserByEmail(
  email: string,
) {
  return users.find(
    (user) =>
      user.email.toLowerCase() ===
      email.toLowerCase(),
  );
}

export function createUser(
  name: string,
  email: string,
  passwordHash: string,
) {
  const user: User = {
    id: users.length + 1,
    name,
    email,
    passwordHash,
  };

  users.push(user);

  return user;
}