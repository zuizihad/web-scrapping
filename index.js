import axios from "axios";
import fs from "fs";
import * as cheerio from "cheerio";

const url = `https://www.otomoto.pl/ciezarowe/uzytkowe/mercedes-benz/od-2014/q-actros?search%5Bfilter_enum_damaged%5D=0&search%5Border%5D=created_at%3Adesc`;

function addItems($, element) {
  try {
    const $element = $(element);
    const itemId = $element.attr("data-id");
    const url = $element.find("h1.ev7e6t89 a").attr("href");

    const item = {
      itemId,
      url,
    };
    return item;
  } catch (error) {
    console.log(error);
    return null;
  }
}

function getTotalAdsCount($, element) {
  try {
    const $element = $(element);
    return $element.find("article ol.ooa-1aqz693 li a").attr("href");
  } catch (error) {
    console.log(error);
  }
}

async function getNextPageUrl(baseUrl) {
  let isBtnDisabled = false;
  let currentPage = 1;
  const items = [];
  const allAds = [];
  let totalAds = 0;

  while (!isBtnDisabled) {
    const pageUrl = `${baseUrl}&page=${currentPage}`;
    try {
        console.log("page ", currentPage)
      const response = await axios.get(pageUrl);
      const $ = cheerio.load(response.data);

      $("article[data-id]").each((index, element) => {
        const item = addItems($, element);
        items.push(item);
        const ads = scrapeTruckItem($, element);
        allAds.push(ads);
        const isExist = getTotalAdsCount($, element);
        if (isExist) totalAds++;
      });

      const nextPageButton = $('li[data-testid="pagination-step-forwards"]');
      if (nextPageButton.attr("aria-disabled") === "true") {
        isBtnDisabled = true;
      }
      currentPage++;
    } catch (error) {
      console.log(error);
    }
  }
  console.log("total ads: ", totalAds)
  console.log("all ads: ", allAds.length)
  console.log("items",items.length)

  fs.writeFile("all-ads.json", JSON.stringify(allAds, null, 2), (err) => {
    if (err) {
      console.error(err);
      return;
    }
  });
  fs.writeFile("items.json", JSON.stringify(items, null, 2), (err) => {
    if (err) {
      console.error(err);
      return;
    }
  });
}

function scrapeTruckItem($, element) {
  try {
    const $element = $(element);
    const itemId = $element.attr("data-id");
    const title = $element.find("h1.ev7e6t89 a").text().trim();
    const price = $element.find("h3.ev7e6t82").text().trim();
    const registrationDate = $element
      .find('dd[data-parameter="year"]')
      .text()
      .trim();
    const productionDate = $element
      .find('dd[data-parameter="year"]')
      .text()
      .trim();
    const mileage = $element.find('dd[data-parameter="mileage"]').text().trim();
    const power = $element
      .find('dd[data-parameter="engine_power"]')
      .text()
      .trim();

    const truckItem = {
      itemId,
      title,
      price,
      registrationDate,
      productionDate,
      mileage,
      power,
    };

    return truckItem;
  } catch (error) {
    console.error("Error scraping truck item:", error);
    return null;
  }
}

getNextPageUrl(url);
