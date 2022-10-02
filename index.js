require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const dns = require("dns");
const url = require("url");
const app = express();
const mongoose = require("mongoose");

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

app.use(cors());
app.use("/public", express.static(`${process.cwd()}/public`));

mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true });

const urlSchema = new mongoose.Schema({
  originalUrl: { type: String },
  shorturl: Number,
});

const urlDb = mongoose.model("Directions", urlSchema);

const randomShorturl = Math.floor(Math.random() * 61 + 1);
var shorturl = "";

app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

app.post("/api/shorturl", (req, res) => {
  shorturl = req.body.url;
  const parseUrl = url.parse(shorturl);

  dns.lookup(parseUrl.hostname, (err) => {
    if (
      parseUrl.protocol === null ||
      parseUrl.hostname === null ||
      (err && err.code === "ENOTFOUND")
    ) {
      // res.json({ error: "invalid url" });
      res.statusCode(200);
    } else {
      const urlModel = new urlDb({
        originalUrl: shorturl,
        shorturl: randomShorturl,
      });

      urlModel.save((err, data) => {
        if (err) {
          res.json({ error: "error to save data" });
        } else {
          res.json({
            original_url: data["originalUrl"],
            shorturl: data["shorturl"],
          });
        }
      });
    }
  });
});

app.get("/api/shorturl/:shorturl", async function(req, res) {
  const shortUrl = parseInt(req.params.shorturl);
  try {
    await urlDb.findOne({shorturl: shortUrl}).then(data => {
      if (!data) {
        throw new Error("Short URL not found.");
      }
      res.redirect(data.originalUrl);
    });
  } catch (e) {
    res.send({
      error: e.message
    });
  }
});

// Your first API endpoint
app.get("/api/hello", function (req, res) {
  res.json({ greeting: "hello API" });
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
