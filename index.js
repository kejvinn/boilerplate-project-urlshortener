require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const bodyParser = require("body-parser");
const crypto = require("crypto");
const axios = require("axios");
const dns = require("dns");
const { URL } = require("url");
// Basic Configuration
const port = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: false }));

app.use(cors());

app.use("/public", express.static(`${process.cwd()}/public`));

app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

app.post("/api/shorturl", function (req, res) {
  const { url } = req.body;
  let hostname;

  // Step 1: Validate URL format and protocol
  try {
    const parsedUrl = new URL(url);
    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
      return res.json({ error: "invalid url" });
    }
    hostname = parsedUrl.hostname;
  } catch (err) {
    return res.json({ error: "invalid url" });
  }

  dns.lookup(hostname, (err) => {
    if (err) {
      return res.json({ error: "invalid url" });
    }

    const shortUrl = generateShortUrl();
    axios
      .post("http://localhost:4000/shorturl", {
        short_url: shortUrl,
        original_url: url,
      })
      .then((axiosRes) => {
        res.json(axiosRes.data);
      })
      .catch((err) => {
        res.status(500).json({ error: "Failed to save short URL" });
      });
  });
});

app.get("/api/shorturl/:shortId", (req, res) => {
  axios.get(`http://localhost:4000/shorturl?short_url=${req.params.shortId}`).then((result) => {
    if (result.data[0]) {
      res.redirect(result.data[0].original_url);
    } else {
      res.send("Could not find shortened url.");
    }
  });
});

function generateShortUrl() {
  return crypto.randomBytes(12).toString("base64url");
}

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
