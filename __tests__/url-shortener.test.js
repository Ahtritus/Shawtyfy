import request from "supertest";
import app from "../app";

describe("Test the GET / endpoint", () => {
  test("It should response the GET method", async () => {
    const response = await request(app)
      .get("/")
      .set("Content-Type", "application/json")
      .set("Accept", "application/json")
      .expect(200);

    expect(response.text).toEqual("Hello World!");
  });
});

describe("Test the POST /shorten endpoint", () => {
  test("should return a shortened URL when given a valid original URL", async () => {
    const originalUrl = "https://example.com/hello-world-123";

    const response = await request(app)
      .post("/shorten")
      .send({ originalUrl })
      .set("Content-Type", "application/json")
      .set("Accept", "application/json")
      .expect(200);

    expect(response.body).toHaveProperty("originalUrl", originalUrl);
    expect(response.body).toHaveProperty("shortUrl");
    expect(response.body.shortUrl).toMatch(
      /^shatwyfy\.vercel\.app\/\S{8}$/
    ); // Match a URL with 8 characters
    expect(response.body.originalUrl).toEqual(originalUrl);
  });

  test("should return a 400 Bad Request error when original URL is missing", async () => {
    const response = await request(app).post("/shorten").send();

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("error", "Original URL is required.");
  });
});
