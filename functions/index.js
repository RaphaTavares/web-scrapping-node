const functions = require("firebase-functions");

const cors = require("cors")({ origin: true });

const getUrls = require("get-urls");
const cheerio = require("cheerio");
const fetch = require("node-fetch");

firebase.functions().useEmulator("localhost", 5001);

const scrapeMetatags = (text) => {
  //cria um array a partir de um objeto array-like, que é oq getUrls(text) está retornando
  const urls = Array.from(getUrls(text));

  const requests = urls.map(async (url) => {
    const res = await fetch(url);

    const html = await res.text();
    const $ = cheerio.load(html);

    const getMetatag = (name) =>
      $(`meta[name=${name}]`).attr("content") ||
      $(`meta[property="og:${name}"]`).attr("content") ||
      $(`meta[property="twitter:${name}"]`).attr("content");

    return {
      url,
      title: $("title").first().text(),
      favicon: $('link[rel="shortcut icon"]').attr("href"),
      //   description: $("meta[name=description]").attr("content"),
      description: getMetatag("description"),
      image: getMetatag("image"),
      author: getMetatag("author"),
    };
  });

  return Promise.all(requests);
};

exports.scraper = functions.https.onRequest((request, response) => {
  cors(request, response, async () => {
    const body = JSON.parse(request.body);
    const data = await scrapeMetatags(body.text);
  });
});

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//   functions.logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
