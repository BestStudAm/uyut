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

export async function apiGet<T>(
  path: string,
  signal?: AbortSignal,
): Promise<T> {
  let response: Response;

  try {
    response = await fetch(
      `${API_URL}${path}`,
      { signal },
    );
  } catch (error) {
    if (
      error instanceof DOMException &&
      error.name === "AbortError"
    ) {
      throw error;
    }

    throw new ApiError(
      0,
      "Сервер не отвечает. Проверьте, запущен ли он на порту 3001.",
    );
  }

  if (!response.ok) {
    throw new ApiError(
      response.status,
      `Сервер ответил ошибкой ${response.status}`,
    );
  }

  return (await response.json()) as T;
}
