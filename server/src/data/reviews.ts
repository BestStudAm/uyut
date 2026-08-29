import { db } from "../db.js";

export interface Review {
  id: number;
  listingId: number;
  authorName: string;
  rating: number;
  text: string;
  createdAt: string;
}

interface ReviewRow {
  id: number;
  listing_id: number;
  author_name: string;
  rating: number;
  text: string;
  created_at: string;
}

function mapReview(row: ReviewRow): Review {
  return {
    id: row.id,
    listingId: row.listing_id,
    authorName: row.author_name,
    rating: row.rating,
    text: row.text,
    createdAt: row.created_at,
  };
}

export function findReviewsByListing(
  listingId: number,
): Review[] {
  const rows = db
    .prepare(
      `
        SELECT
          id,
          listing_id,
          author_name,
          rating,
          text,
          created_at
        FROM reviews
        WHERE listing_id = ?
        ORDER BY created_at DESC, id DESC
      `,
    )
    .all(listingId) as ReviewRow[];

  return rows.map(mapReview);
}

/**
 * Пересчитывает рейтинг и число отзывов у объявления по самим отзывам.
 * Держать эти поля отдельно и надеяться, что они не разъедутся, нельзя.
 */
export function refreshListingRating(
  listingId: number,
) {
  const stats = db
    .prepare(
      `
        SELECT
          COUNT(*) AS count,
          AVG(rating) AS average
        FROM reviews
        WHERE listing_id = ?
      `,
    )
    .get(listingId) as {
    count: number;
    average: number | null;
  };

  db.prepare(
    `
      UPDATE listings
      SET
        rating = ?,
        reviews_count = ?
      WHERE id = ?
    `,
  ).run(
    stats.average
      ? Number(stats.average.toFixed(1))
      : 0,
    stats.count,
    listingId,
  );
}

const authors = [
  "Марина",
  "Алексей",
  "Ольга",
  "Дмитрий",
  "Екатерина",
  "Павел",
  "Ирина",
  "Сергей",
  "Анна",
  "Никита",
];

const texts: [number, string][] = [
  [5, "Всё как на фото, хозяин встретил вовремя и всё показал. Очень тихо, несмотря на центр."],
  [5, "Отличная квартира, кухня полностью укомплектована. Приедем ещё раз."],
  [5, "Чисто, светло, рядом метро и продуктовый. Заселение прошло без вопросов."],
  [4, "Хорошее расположение, до метро правда пять минут. Из минусов только скрипучая дверь в ванной."],
  [4, "В целом понравилось. Немного шумно от дороги утром, но спать не мешало."],
  [4, "Всё чисто и аккуратно. Не хватило вешалок в прихожей, а так претензий нет."],
  [3, "Квартира нормальная, но фотографии выглядят посвежее, чем есть на самом деле."],
  [5, "Хозяин на связи, ответил на все вопросы до заезда. Рекомендую."],
  [4, "Уютно, тепло, хороший матрас. Wi-Fi работал стабильно всю неделю."],
  [5, "Идеально для короткой поездки. Рядом кофейни и набережная."],
];

// Простой генератор с зерном: при одинаковом id объявления отзывы получаются
// одни и те же. Иначе после каждого пересоздания базы данные бы прыгали.
function seeded(seed: number) {
  let value = seed * 9301 + 49297;

  return () => {
    value = (value * 9301 + 49297) % 233280;

    return value / 233280;
  };
}

function daysAgo(days: number) {
  const date = new Date();

  date.setDate(date.getDate() - days);

  return date.toISOString().slice(0, 19).replace("T", " ");
}

/**
 * Наполняет отзывы, если их ещё нет. Свои отзывы в этой версии не пишутся —
 * по плану отзывы только на чтение, поэтому данные приходят сидером.
 */
export function ensureReviewsSeeded() {
  const existing = db
    .prepare(
      `SELECT COUNT(*) AS count FROM reviews`,
    )
    .get() as { count: number };

  if (existing.count > 0) {
    return;
  }

  const listings = db
    .prepare(
      `
        SELECT id
        FROM listings
        WHERE status = 'published'
        ORDER BY id ASC
      `,
    )
    .all() as { id: number }[];

  const insert = db.prepare(
    `
      INSERT INTO reviews (
        listing_id,
        author_name,
        rating,
        text,
        created_at
      )
      VALUES (?, ?, ?, ?, ?)
    `,
  );

  const seedAll = db.transaction(() => {
    for (const listing of listings) {
      const random = seeded(listing.id);
      const count = 2 + Math.floor(random() * 3);

      const used = new Set<number>();
      const usedAuthors = new Set<number>();

      for (let i = 0; i < count; i += 1) {
        let index = Math.floor(
          random() * texts.length,
        );

        while (used.has(index)) {
          index = (index + 1) % texts.length;
        }

        used.add(index);

        // Имена тоже не повторяем: два отзыва от одного человека на одну
        // квартиру выглядят как накрутка.
        let authorIndex = Math.floor(
          random() * authors.length,
        );

        while (usedAuthors.has(authorIndex)) {
          authorIndex =
            (authorIndex + 1) % authors.length;
        }

        usedAuthors.add(authorIndex);

        const [rating, text] = texts[index];

        insert.run(
          listing.id,
          authors[authorIndex],
          rating,
          text,
          daysAgo(
            7 + Math.floor(random() * 120),
          ),
        );
      }

      refreshListingRating(listing.id);
    }
  });

  seedAll();
}
