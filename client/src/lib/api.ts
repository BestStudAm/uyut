// Одна точка обращения к серверу. Голый fetch по компонентам не разводим:
// адрес API меняется в одном месте, и ошибки везде разбираются одинаково.

export const API_URL = "http://localhost:3001/api";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

// Сервер отвечает на кривую форму объектом errors: поле — текст ошибки.
export class ValidationError extends ApiError {
  constructor(
    message: string,
    public errors: Record<string, string>,
  ) {
    super(400, message);
  }
}

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  // Токенов в проекте пока нет, поэтому владельца передаём заголовком.
  // Когда появится JWT, поменяется только это место.
  userId?: number | null;
  signal?: AbortSignal;
}

async function request<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const {
    method = "GET",
    body,
    userId,
    signal,
  } = options;

  const headers: Record<string, string> = {};

  if (body !== undefined) {
    headers["Content-Type"] =
      "application/json";
  }

  if (userId) {
    headers["x-user-id"] = String(userId);
  }

  let response: Response;

  try {
    response = await fetch(
      `${API_URL}${path}`,
      {
        method,
        headers,
        signal,
        body:
          body === undefined
            ? undefined
            : JSON.stringify(body),
      },
    );
  } catch (cause) {
    if (
      cause instanceof DOMException &&
      cause.name === "AbortError"
    ) {
      throw cause;
    }

    throw new ApiError(
      0,
      "Сервер не отвечает. Проверьте, запущен ли он на порту 3001.",
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  let payload: unknown = null;

  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const data = (payload ?? {}) as {
      message?: string;
      errors?: Record<string, string>;
    };

    const message =
      data.message ??
      `Сервер ответил ошибкой ${response.status}`;

    if (response.status === 400 && data.errors) {
      throw new ValidationError(
        message,
        data.errors,
      );
    }

    throw new ApiError(response.status, message);
  }

  return payload as T;
}

export function apiGet<T>(
  path: string,
  signal?: AbortSignal,
): Promise<T> {
  return request<T>(path, { signal });
}

export function apiGetAs<T>(
  path: string,
  userId: number | null,
  signal?: AbortSignal,
): Promise<T> {
  return request<T>(path, { userId, signal });
}

export function apiSend<T>(
  path: string,
  options: RequestOptions,
): Promise<T> {
  return request<T>(path, options);
}
