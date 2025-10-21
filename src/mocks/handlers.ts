import { http, HttpResponse } from "msw";

type LoginPayload = {
  email?: string;
  password?: string;
};

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const handlers = [
  http.post<never, LoginPayload>("/api/login", async ({ request }) => {
    await delay(800);

    const { email, password } = (await request.json()) as LoginPayload;

    if (email === "server@error.com") {
      return new HttpResponse(
        JSON.stringify({
          message: "Внутренняя ошибка сервера. Пожалуйста, попробуйте позже.",
        }),
        { status: 500 }
      );
    }

    if (email === "rate@limit.com") {
      return new HttpResponse(
        JSON.stringify({
          message: "Вы превысили лимит запросов. Попробуйте через 60 секунд.",
        }),
        { status: 429 }
      );
    }

    if (email === "user@fail.com" || password === "wrongpassword") {
      return new HttpResponse(
        JSON.stringify({
          message: "Неверный адрес электронной почты или пароль.",
        }),
        { status: 401 }
      );
    }

    if (email === "test@test.com" && password === "12345678") {
      return new HttpResponse(
        JSON.stringify({ token: "mock-jwt-token-123", user: { email } }),
        { status: 200 }
      );
    }

    return new HttpResponse(
      JSON.stringify({
        message: "Произошла ошибка при входе. Пожалуйста, попробуйте позже.",
      }),
      { status: 404 }
    );
  }),
  http.post<never, { tfaCode: number }>("/api/tfa", async ({ request }) => {
    await delay(800);

    const { tfaCode } = (await request.json()) as { tfaCode: number };

    if (tfaCode === 123456) {
      return new HttpResponse(
        JSON.stringify({
          token: "mock-jwt-token-123",
          user: { email: "test@test.com" },
        }),
        { status: 200 }
      );
    }

    return new HttpResponse(
      JSON.stringify({ message: "Неверный код двухфакторной аутентификации." }),
      { status: 401 }
    );
  }),
];
