import * as cheerio from "cheerio";

async function fetchData(url: string): Promise<string> {
  try {
    const res = await fetch(url);
    return await res.text();
  } catch (error) {
    return "une erreur c produite soit l'url est pas valide soit le site est innacessible";
  }
}

function extractText(html: string) {
  const $ = cheerio.load(html);

  $(
    "script, style, noscript, iframe, svg, canvas, form, nav, footer, header, img, input, button",
  ).remove();

  return $("body").text().replace(/\s+/g, " ").trim();
}

export default async function recapPage(linkPage: string) {
  const dataBrut = await fetchData(linkPage);
  const textOnly = extractText(dataBrut);
  return textOnly.slice(0, 1000);
}
