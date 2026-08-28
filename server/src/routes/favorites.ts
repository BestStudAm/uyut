import { Router, type Request } from "express";

import { db } from "../db.js";
import { findListingById } from "../data/listings.js";

const router = Router();

/**
 * Сейчас сервер получает id пользователя
 * через заголовок X-User-Id.
 *
 * Позже заменим это на нормальную
 * серверную авторизацию / session.
 */
function getUserId(
  req: Request,
): number | undefined {
  const value = req.header(
    "X-User-Id",
  );

  if (!value) {
    return undefined;
  }

  const userId = Number(value);

  if (
    !Number.isInteger(userId) ||
    userId <= 0
  ) {
    return undefined;
  }

  return userId;
}

/**
 * GET /api/favorites
 *
 * Возвращает все избранные объявления
 * текущего пользователя.
 */
router.get(
  "/",
  (req, res) => {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        error: "UNAUTHORIZED",
        message:
          "Необходимо войти в аккаунт",
      });
    }

    const rows = db
      .prepare(
        `
          SELECT listing_id
          FROM favorites
          WHERE user_id = ?
          ORDER BY created_at DESC
        `,
      )
      .all(userId) as {
      listing_id: number;
    }[];

    return res.json({
      items: rows.map(
        (row) => row.listing_id,
      ),
    });
  },
);

/**
 * GET /api/favorites/:listingId
 *
 * Проверить, находится ли конкретное
 * объявление в избранном.
 */
router.get(
  "/:listingId",
  (req, res) => {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        error: "UNAUTHORIZED",
        message:
          "Необходимо войти в аккаунт",
      });
    }

    const listingId = Number(
      req.params.listingId,
    );

    if (
      !Number.isInteger(listingId) ||
      listingId <= 0
    ) {
      return res.status(400).json({
        error: "INVALID_LISTING_ID",
        message:
          "Некорректный id объявления",
      });
    }

    const row = db
      .prepare(
        `
          SELECT 1
          FROM favorites
          WHERE user_id = ?
            AND listing_id = ?
          LIMIT 1
        `,
      )
      .get(
        userId,
        listingId,
      );

    return res.json({
      isFavorite: Boolean(row),
    });
  },
);

/**
 * POST /api/favorites/:listingId
 *
 * Добавить объявление в избранное.
 */
router.post(
  "/:listingId",
  (req, res) => {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        error: "UNAUTHORIZED",
        message:
          "Необходимо войти в аккаунт",
      });
    }

    const listingId = Number(
      req.params.listingId,
    );

    if (
      !Number.isInteger(listingId) ||
      listingId <= 0
    ) {
      return res.status(400).json({
        error: "INVALID_LISTING_ID",
        message:
          "Некорректный id объявления",
      });
    }

    const listing =
      findListingById(listingId);

    if (!listing) {
      return res.status(404).json({
        error: "NOT_FOUND",
        message:
          "Объявление не найдено",
      });
    }

    db.prepare(
      `
        INSERT OR IGNORE INTO favorites (
          user_id,
          listing_id
        )
        VALUES (?, ?)
      `,
    ).run(
      userId,
      listingId,
    );

    return res.status(201).json({
      success: true,
      isFavorite: true,
      listingId,
    });
  },
);

/**
 * DELETE /api/favorites/:listingId
 *
 * Удалить объявление из избранного.
 */
router.delete(
  "/:listingId",
  (req, res) => {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        error: "UNAUTHORIZED",
        message:
          "Необходимо войти в аккаунт",
      });
    }

    const listingId = Number(
      req.params.listingId,
    );

    if (
      !Number.isInteger(listingId) ||
      listingId <= 0
    ) {
      return res.status(400).json({
        error: "INVALID_LISTING_ID",
        message:
          "Некорректный id объявления",
      });
    }

    db.prepare(
      `
        DELETE FROM favorites
        WHERE user_id = ?
          AND listing_id = ?
      `,
    ).run(
      userId,
      listingId,
    );

    return res.json({
      success: true,
      isFavorite: false,
      listingId,
    });
  },
);

export default router;