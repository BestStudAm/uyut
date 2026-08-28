import {
  Router,
  type Request,
} from "express";

import { db } from "../db.js";
import { findListingById } from "../data/listings.js";

const router = Router();

type BookingRow = {
  id: number;
  user_id: number;
  listing_id: number;
  check_in: string;
  check_out: string;
  guests: number;
  status: string;
  created_at: string;
};

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

function isValidDate(
  value: unknown,
): value is string {
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value)
  ) {
    return false;
  }

  const date = new Date(
    `${value}T00:00:00`,
  );

  return !Number.isNaN(
    date.getTime(),
  );
}

function mapBooking(
  row: BookingRow,
) {
  return {
    id: row.id,
    userId: row.user_id,
    listingId: row.listing_id,
    checkIn: row.check_in,
    checkOut: row.check_out,
    guests: row.guests,
    status: row.status,
    createdAt: row.created_at,
  };
}

/**
 * GET /api/bookings
 *
 * Все бронирования текущего пользователя.
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
          SELECT
            id,
            user_id,
            listing_id,
            check_in,
            check_out,
            guests,
            status,
            created_at
          FROM bookings
          WHERE user_id = ?
          ORDER BY created_at DESC
        `,
      )
      .all(userId) as BookingRow[];

    return res.json({
      items: rows.map(mapBooking),
    });
  },
);

/**
 * GET /api/bookings/:id
 *
 * Получить конкретную бронь.
 */
router.get(
  "/:id",
  (req, res) => {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        error: "UNAUTHORIZED",
        message:
          "Необходимо войти в аккаунт",
      });
    }

    const bookingId = Number(
      req.params.id,
    );

    if (
      !Number.isInteger(bookingId) ||
      bookingId <= 0
    ) {
      return res.status(400).json({
        error: "INVALID_BOOKING_ID",
        message:
          "Некорректный id бронирования",
      });
    }

    const row = db
      .prepare(
        `
          SELECT
            id,
            user_id,
            listing_id,
            check_in,
            check_out,
            guests,
            status,
            created_at
          FROM bookings
          WHERE id = ?
            AND user_id = ?
          LIMIT 1
        `,
      )
      .get(
        bookingId,
        userId,
      ) as BookingRow | undefined;

    if (!row) {
      return res.status(404).json({
        error: "NOT_FOUND",
        message:
          "Бронирование не найдено",
      });
    }

    return res.json({
      booking: mapBooking(row),
    });
  },
);

/**
 * POST /api/bookings
 *
 * Создать бронирование.
 */
router.post(
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

    const {
      listingId,
      checkIn,
      checkOut,
      guests,
    } = req.body;

    const numericListingId =
      Number(listingId);

    const numericGuests =
      Number(guests);

    if (
      !Number.isInteger(
        numericListingId,
      ) ||
      numericListingId <= 0
    ) {
      return res.status(400).json({
        error: "INVALID_LISTING_ID",
        message:
          "Некорректное объявление",
      });
    }

    if (
      !isValidDate(checkIn) ||
      !isValidDate(checkOut)
    ) {
      return res.status(400).json({
        error: "INVALID_DATES",
        message:
          "Укажите корректные даты заезда и выезда",
      });
    }

    if (
      checkOut <= checkIn
    ) {
      return res.status(400).json({
        error: "INVALID_DATE_RANGE",
        message:
          "Дата выезда должна быть позже даты заезда",
      });
    }

    if (
      !Number.isInteger(
        numericGuests,
      ) ||
      numericGuests < 1
    ) {
      return res.status(400).json({
        error: "INVALID_GUESTS",
        message:
          "Количество гостей должно быть не меньше 1",
      });
    }

    const listing =
      findListingById(
        numericListingId,
      );

    if (!listing) {
      return res.status(404).json({
        error: "LISTING_NOT_FOUND",
        message:
          "Объявление не найдено",
      });
    }

    if (
      listing.status !==
      "published"
    ) {
      return res.status(400).json({
        error: "LISTING_UNAVAILABLE",
        message:
          "Это объявление сейчас недоступно для бронирования",
      });
    }

    if (
      numericGuests >
      listing.guests
    ) {
      return res.status(400).json({
        error: "TOO_MANY_GUESTS",
        message:
          `Максимальное количество гостей: ${listing.guests}`,
      });
    }

    /*
     * Проверяем пересечение дат.
     *
     * Бронь A пересекается с бронью B,
     * если:
     *
     * A.check_in < B.check_out
     * И
     * A.check_out > B.check_in
     */
    const conflictingBooking =
      db
        .prepare(
          `
            SELECT id
            FROM bookings
            WHERE listing_id = ?
              AND status = 'active'
              AND check_in < ?
              AND check_out > ?
            LIMIT 1
          `,
        )
        .get(
          numericListingId,
          checkOut,
          checkIn,
        ) as
        | { id: number }
        | undefined;

    if (conflictingBooking) {
      return res.status(409).json({
        error: "DATES_UNAVAILABLE",
        message:
          "На эти даты объявление уже забронировано",
      });
    }

    const result = db
      .prepare(
        `
          INSERT INTO bookings (
            user_id,
            listing_id,
            check_in,
            check_out,
            guests,
            status
          )
          VALUES (?, ?, ?, ?, ?, 'active')
        `,
      )
      .run(
        userId,
        numericListingId,
        checkIn,
        checkOut,
        numericGuests,
      );

    const booking = db
      .prepare(
        `
          SELECT
            id,
            user_id,
            listing_id,
            check_in,
            check_out,
            guests,
            status,
            created_at
          FROM bookings
          WHERE id = ?
          LIMIT 1
        `,
      )
      .get(
        Number(
          result.lastInsertRowid,
        ),
      ) as BookingRow;

    return res.status(201).json({
      booking: mapBooking(
        booking,
      ),
    });
  },
);

/**
 * DELETE /api/bookings/:id
 *
 * Отменить своё бронирование.
 *
 * Саму запись не удаляем —
 * меняем статус на cancelled.
 */
router.delete(
  "/:id",
  (req, res) => {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        error: "UNAUTHORIZED",
        message:
          "Необходимо войти в аккаунт",
      });
    }

    const bookingId = Number(
      req.params.id,
    );

    if (
      !Number.isInteger(bookingId) ||
      bookingId <= 0
    ) {
      return res.status(400).json({
        error: "INVALID_BOOKING_ID",
        message:
          "Некорректный id бронирования",
      });
    }

    const booking = db
      .prepare(
        `
          SELECT
            id,
            status
          FROM bookings
          WHERE id = ?
            AND user_id = ?
          LIMIT 1
        `,
      )
      .get(
        bookingId,
        userId,
      ) as
      | {
          id: number;
          status: string;
        }
      | undefined;

    if (!booking) {
      return res.status(404).json({
        error: "NOT_FOUND",
        message:
          "Бронирование не найдено",
      });
    }

    if (
      booking.status ===
      "cancelled"
    ) {
      return res.status(400).json({
        error: "ALREADY_CANCELLED",
        message:
          "Бронирование уже отменено",
      });
    }

    db.prepare(
      `
        UPDATE bookings
        SET status = 'cancelled'
        WHERE id = ?
          AND user_id = ?
      `,
    ).run(
      bookingId,
      userId,
    );

    return res.json({
      success: true,
      status: "cancelled",
    });
  },
);

export default router;