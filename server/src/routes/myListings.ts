import {
  Router,
  type Request,
  type Response,
} from "express";

import {
  createListing,
  deleteListing,
  findListingById,
  findListingsByOwner,
  updateListing,
  type Amenity,
  type HousingType,
  type ListingStatus,
  type NewListing,
} from "../data/listings.js";

const router = Router();

// Токенов в проекте пока нет: вход возвращает только пользователя, без JWT.
// Поэтому владельца берём из заголовка. Это заглушка — когда Амир сделает токены,
// здесь меняется одна строка: id берётся из проверенного токена, а не с клиента.
function getUserId(req: Request) {
  const raw = req.header("x-user-id");
  const id = Number(raw);

  return Number.isInteger(id) && id > 0
    ? id
    : null;
}

const housingTypes: HousingType[] = [
  "apartment",
  "studio",
  "room",
  "house",
];

const amenityList: Amenity[] = [
  "wifi",
  "kitchen",
  "parking",
  "washer",
  "tv",
  "ac",
  "pets",
];

// Геокодера у нас нет, поэтому координаты берём по центру района и слегка
// разбрасываем, чтобы метки новых объявлений не ложились одна на другую.
const districtCoords: Record<
  string,
  [number, number]
> = {
  Центральный: [59.9331, 30.3609],
  Адмиралтейский: [59.9214, 30.3021],
  Василеостровский: [59.9402, 30.2633],
  Петроградский: [59.9628, 30.3102],
  Московский: [59.8674, 30.3203],
  Приморский: [59.9881, 30.2551],
  Выборгский: [60.0102, 30.3451],
  Фрунзенский: [59.8981, 30.3542],
  Калининский: [59.9998, 30.3956],
  Невский: [59.8853, 30.4371],
  Кировский: [59.8671, 30.2601],
  Курортный: [60.1702, 29.8702],
};

function coordsFor(district: string) {
  const base = districtCoords[district] ?? [
    59.9343, 30.3351,
  ];

  const jitter = () =>
    (Math.random() - 0.5) * 0.012;

  return {
    lat: Number(
      (base[0] + jitter()).toFixed(5),
    ),
    lng: Number(
      (base[1] + jitter()).toFixed(5),
    ),
  };
}

export interface ValidationResult {
  errors: Record<string, string>;
  value?: NewListing;
}

function positive(value: unknown) {
  const parsed = Number(value);

  return Number.isFinite(parsed) && parsed > 0
    ? parsed
    : null;
}

// Черновик можно сохранить с чем угодно, а вот к публикации требования жёстче:
// они те же, что нарисованы в макете в блоке «Перед публикацией».
export function validateListing(
  body: Record<string, unknown>,
): ValidationResult {
  const errors: Record<string, string> = {};

  const status: ListingStatus =
    body.status === "draft"
      ? "draft"
      : "published";

  const title = String(
    body.title ?? "",
  ).trim();
  const district = String(
    body.district ?? "",
  ).trim();
  const address = String(
    body.address ?? "",
  ).trim();
  const description = String(
    body.description ?? "",
  ).trim();

  const type = housingTypes.includes(
    body.type as HousingType,
  )
    ? (body.type as HousingType)
    : "apartment";

  const amenities = Array.isArray(body.amenities)
    ? (body.amenities as unknown[]).filter(
        (item): item is Amenity =>
          amenityList.includes(item as Amenity),
      )
    : [];

  const photos = Array.isArray(body.photos)
    ? (body.photos as unknown[])
        .filter(
          (item): item is string =>
            typeof item === "string",
        )
        .slice(0, 8)
    : [];

  const rules = Array.isArray(body.rules)
    ? (body.rules as unknown[])
        .filter(
          (item): item is string =>
            typeof item === "string",
        )
        .map((item) => item.trim())
        .filter(Boolean)
    : [];

  const price = positive(body.pricePerNight);
  const guests = positive(body.guests);
  const rooms = positive(body.rooms);
  const area = positive(body.area);

  if (!title) {
    errors.title = "Придумайте название";
  } else if (title.length > 120) {
    errors.title =
      "Название длиннее 120 символов";
  }

  if (!district) {
    errors.district = "Выберите район";
  }

  if (status === "published") {
    if (!price) {
      errors.pricePerNight =
        "Укажите цену за ночь";
    }

    if (!guests) {
      errors.guests =
        "Укажите, сколько гостей поместится";
    }

    if (!rooms) {
      errors.rooms = "Укажите число комнат";
    }

    if (!area) {
      errors.area = "Укажите площадь";
    }

    if (description.length < 100) {
      errors.description =
        "Описание короче 100 символов";
    }

    if (photos.length < 3) {
      errors.photos =
        "Нужно минимум три фотографии";
    }

    if (!address) {
      errors.address = "Укажите адрес";
    }
  }

  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  return {
    errors,
    value: {
      title,
      city: "Санкт-Петербург",
      district,
      type,
      pricePerNight: price ?? 0,
      guests: guests ?? 1,
      rooms: rooms ?? 1,
      area: area ?? 0,
      amenities,
      status,
      photos,
      description,
      rules,
      address,
      ...coordsFor(district),
    },
  };
}

function requireOwner(
  req: Request,
  res: Response,
) {
  const userId = getUserId(req);

  if (!userId) {
    res.status(401).json({
      message:
        "Войдите, чтобы управлять объявлениями",
    });

    return null;
  }

  return userId;
}

router.get("/", (req, res) => {
  const userId = requireOwner(req, res);

  if (!userId) {
    return;
  }

  res.json({
    items: findListingsByOwner(userId),
  });
});

router.post("/", (req, res) => {
  const userId = requireOwner(req, res);

  if (!userId) {
    return;
  }

  const { errors, value } = validateListing(
    req.body ?? {},
  );

  if (!value) {
    res.status(400).json({
      message: "Проверьте поля формы",
      errors,
    });

    return;
  }

  res
    .status(201)
    .json(createListing(value, userId));
});

router.patch("/:id", (req, res) => {
  const userId = requireOwner(req, res);

  if (!userId) {
    return;
  }

  const listing = findListingById(
    Number(req.params.id),
  );

  if (!listing) {
    res.status(404).json({
      message: "Объявление не найдено",
    });

    return;
  }

  // Идентификатор в адресе не доказательство прав: сверяем владельца.
  if (listing.ownerId !== userId) {
    res.status(403).json({
      message: "Это не ваше объявление",
    });

    return;
  }

  // Смена только статуса — отдельный короткий путь для кнопок
  // «снять с публикации» и «опубликовать снова».
  const onlyStatus =
    Object.keys(req.body ?? {}).length === 1 &&
    typeof req.body?.status === "string";

  if (onlyStatus) {
    const status = req.body.status;

    if (
      status !== "published" &&
      status !== "hidden" &&
      status !== "draft"
    ) {
      res.status(400).json({
        message: "Неизвестный статус",
      });

      return;
    }

    res.json(
      updateListing(listing.id, { status }),
    );

    return;
  }

  const { errors, value } = validateListing(
    req.body ?? {},
  );

  if (!value) {
    res.status(400).json({
      message: "Проверьте поля формы",
      errors,
    });

    return;
  }

  res.json(
    updateListing(listing.id, {
      ...value,
      // Координаты пересчитываем только если сменился район.
      lat:
        listing.district === value.district
          ? listing.lat
          : value.lat,
      lng:
        listing.district === value.district
          ? listing.lng
          : value.lng,
    }),
  );
});

router.delete("/:id", (req, res) => {
  const userId = requireOwner(req, res);

  if (!userId) {
    return;
  }

  const listing = findListingById(
    Number(req.params.id),
  );

  if (!listing) {
    res.status(404).json({
      message: "Объявление не найдено",
    });

    return;
  }

  if (listing.ownerId !== userId) {
    res.status(403).json({
      message: "Это не ваше объявление",
    });

    return;
  }

  deleteListing(listing.id);

  res.status(204).end();
});

export default router;
