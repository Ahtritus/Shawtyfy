import request from "supertest";
import app from "../app";
import urlModel from "../models/url.model";
import mongoose from "mongoose";

let testUrl;

afterEach(async () => {
  if (testUrl) {
    await urlModel.deleteMany({ shortUrl: testUrl.shortUrl });
  }
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe("Test the GET / endpoint", () => {
  test("It should response the GET method", async () => {
    const response = await request(app)
      .get("/")
      .set("Content-Type", "application/json")
      .set("Accept", "application/json")
      .expect(200)

      // expect response.text is not null
      expect(response.text).not.toBeNull();

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

    testUrl = response.body;

    expect(response.body).toHaveProperty("originalUrl", originalUrl);
    expect(response.body).toHaveProperty("shortUrl");
    expect(response.body.shortUrl).toMatch(/^\S{8}$/); // Match a URL with 8 characters
    expect(response.body.originalUrl).toEqual(originalUrl);
  });

  test("should return the same shortened URL when given the same original URL", async () => {
    const originalUrl = "https://example.com/hello-world-123";

    const firstResponse = await request(app)
      .post("/shorten")
      .send({ originalUrl })
      .set("Content-Type", "application/json")
      .set("Accept", "application/json")
      .expect(200);

    expect(firstResponse.body.shortUrl).toMatch(/^\S{8}$/); // Match a URL with 8 characters
    expect(firstResponse.body.originalUrl).toEqual(originalUrl);

    const secondResponse = await request(app)
      .post("/shorten")
      .send({ originalUrl })
      .set("Content-Type", "application/json")
      .set("Accept", "application/json")
      .expect(200);

    expect(secondResponse.body.shortUrl).toEqual(firstResponse.body.shortUrl);
    expect(secondResponse.body.originalUrl).toEqual(originalUrl);
  });

  test("should return a 400 Bad Request error when original URL is missing", async () => {
    const response = await request(app).post("/shorten").send();

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("error", "Original URL is required.");
  });
});

describe("Test the /:shortUrl endpoint", () => {
  test("should return a 404 Not Found error when given a non-existent short URL", async () => {
    const response = await request(app).get("/invalid");
    expect(response.status).toEqual(404);
  });

  test("should return the original URL when given a valid short URL", async () => {
    testUrl = new urlModel({
      originalUrl: "https://www.example.com",
      shortUrl: "test1234",
    });
    const savedData = await testUrl.save();
    expect(savedData.visited).toEqual(0);

    const response = await request(app).get("/" + testUrl.shortUrl);
    expect(response.status).toEqual(302);
    
    const updatedUrl = await urlModel.findOne({ shortUrl: testUrl.shortUrl });
    expect(updatedUrl.visited).toEqual(1);

    const secondResponse = await request(app).get("/" + testUrl.shortUrl);
    expect(secondResponse.status).toEqual(302);
    
    const secondUpdatedUrl = await urlModel.findOne({ shortUrl: testUrl.shortUrl });
    expect(secondUpdatedUrl.visited).toEqual(2);
  });

  test("should return all URLs in the database", async () => {
    const updatedUrl = await urlModel.find()
    const originalSize = updatedUrl.length;

    testUrl = new urlModel({
      originalUrl: "https://www.example.com",
      shortUrl: "test1234",
    });
    await testUrl.save();

    const response = await request(app).get("/all");
    expect(response.status).toEqual(200);
    expect(response.body).toHaveLength(originalSize + 1);
  });
});
