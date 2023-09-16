import express from 'express';
import {nanoid} from 'nanoid';

const app = express();


app.use(express.json());

app.get("/", (req, res) => {
  res.status(200).send("Hello World!");
});

app.post('/shorten', async (req, res) => {
  debugger
  const { originalUrl } = req.body;

  if (!originalUrl) {
    return res.status(400).json({ error: 'Original URL is required.' });
  }

  const shortUrl = "shatwyfy.vercel.app/" + nanoid(8)

  const newUrl = {
    originalUrl,
    shortUrl,
  };


  res.json(newUrl);
});


export default app;
