import * as functions from "firebase-functions";

import cors from "cors";

import getUrls from "get-urls";
import cheerio from "cheerio";
import fetch from "node-fetch";

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

const scraper = functions.https.onRequest((request, response) => {
  console.log("oi");
  cors(request, response, async () => {
    console.log("ola");
    const body = JSON.parse(request.body);
    const data = await scrapeMetatags(body.text);

    console.log(data);
    response.send(data);
  });
});

export default scraper;

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//   functions.logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
