import express from "express";
import { nanoid } from "nanoid";
import mongoose from "mongoose";
import Url from "./models/url.model.js";
import dotenv from "dotenv";
dotenv.config();

const MONGO_CONNECTION = process.env.MONGO_CONNECTION;

mongoose.connect(MONGO_CONNECTION, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error: "));
db.once("open", function () {
  console.log("Connected successfully");
});

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "Welcome to Shawtyfy URL Shortener API",
    description:
      "This API allows you to shorten long URLs and retrieve the original URLs using shortcodes.",
    endpoints: {
      shortenUrl: {
        method: "POST",
        path: "/shorten",
        description:
          "Shorten a long URL. Send a POST request with 'originalUrl' in the request body.",
      },
      retrieveUrl: {
        method: "GET",
        path: "/:shortUrl",
        description: "Retrieve the original URL associated with a short URL.",
      },
      getAllUrls: {
        method: "GET",
        path: "/all",
        description: "Get a list of all currently saved URLs.",
      },
    },
  });
});

app.post("/shorten", async (req, res) => {
  const { originalUrl } = req.body;

  if (!originalUrl) {
    return res.status(400).json({ error: "Original URL is required." });
  }
  // check if original url already exists, if yes then return the saved short url
  const url = await Url.findOne({ originalUrl });
  if (url) {
    return res.json(url);
  }

  const shortUrl = nanoid(8);
  const newUrl = new Url({
    originalUrl,
    shortUrl,
  });
  try {
    await newUrl.save();
    return res.json(newUrl);
  } catch (error) {
    response.status(500).send(error);
  }
});

app.get("/:shortUrl", async (req, res) => {
  const shortUrl = req.params.shortUrl;

  // should have followed the normal url convention but /shorturl just seems shorter in normal cases
  if (shortUrl == "all") {
    const urls = await Url.find(
      {},
      { originalUrl: 1, shortUrl: 1, visited: 1, _id: 0 }
    );
    return res.json(urls);
  }
  const url = await Url.findOne({ shortUrl });
  if (url == null) {
    return res.sendStatus(404);
  }

  await Url.updateOne({ shortUrl: shortUrl }, { $inc: { visited: 1 } });

  res.redirect(url.originalUrl);
});

export default app;
