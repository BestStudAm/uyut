import { describe, expect, it } from "vitest";

import { validateListing } from "./myListings.js";

const filled = {
  title: "Студия у канала",
  district: "Петроградский",
  type: "studio",
  pricePerNight: 4200,
  guests: 2,
  rooms: 1,
  area: 34,
  amenities: ["wifi", "kitchen"],
  photos: ["a", "b", "c"],
  description: "о".repeat(120),
  address: "набережная канала Грибоедова, 24",
  rules: ["Не курить"],
  status: "published",
};

describe("проверка формы объявления", () => {
  it("пропускает заполненное объявление", () => {
    const { errors, value } =
      validateListing(filled);

    expect(errors).toEqual({});
    expect(value?.title).toBe(
      "Студия у канала",
    );
    expect(value?.status).toBe("published");
  });

  it("не даёт опубликовать без трёх фотографий", () => {
    const { errors, value } = validateListing({
      ...filled,
      photos: ["a"],
    });

    expect(value).toBeUndefined();
    expect(errors.photos).toBeTruthy();
  });

  it("не даёт опубликовать с коротким описанием", () => {
    const { errors } = validateListing({
      ...filled,
      description: "Хорошая квартира",
    });

    expect(errors.description).toBeTruthy();
  });

  it("черновик сохраняется почти пустым, хватает названия и района", () => {
    const { errors, value } = validateListing({
      title: "Пока думаю",
      district: "Московский",
      status: "draft",
    });

    expect(errors).toEqual({});
    expect(value?.status).toBe("draft");
    expect(value?.pricePerNight).toBe(0);
  });

  it("требует название и район даже у черновика", () => {
    const { errors } = validateListing({
      status: "draft",
    });

    expect(errors.title).toBeTruthy();
    expect(errors.district).toBeTruthy();
  });

  it("выбрасывает выдуманные удобства и чужие поля", () => {
    const { value } = validateListing({
      ...filled,
      amenities: ["wifi", "телепорт"],
      id: 999,
      ownerId: 42,
    });

    expect(value?.amenities).toEqual(["wifi"]);
    expect(value).not.toHaveProperty("id");
    expect(value).not.toHaveProperty("ownerId");
  });

  it("ставит координаты по району, чтобы метка не улетела за город", () => {
    const { value } = validateListing(filled);

    expect(value?.lat).toBeGreaterThan(59.9);
    expect(value?.lat).toBeLessThan(60.0);
    expect(value?.lng).toBeGreaterThan(30.2);
    expect(value?.lng).toBeLessThan(30.4);
  });
});
