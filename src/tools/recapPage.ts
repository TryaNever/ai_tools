import * as cheerio from "cheerio";
import type { PipelineContext, ToolResult } from "../type";

function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

async function fetchData(url: string): Promise<string> {
  if (!isValidUrl(url)) {
    // regenrate plan en ajoutant l'erreur
    console.log("url pas valid");
  }

  try {
    const res = await fetch(url);
    return await res.text();
  } catch (error: unknown) {
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

interface RecapPageInput {
  linkPage: string;
  _context?: PipelineContext;
}

export default async function recapPage(
  linkPage: RecapPageInput,
): Promise<ToolResult> {
  const dataBrut = await fetchData(linkPage);
  const textOnly = extractText(dataBrut);

  return {
    data: textOnly.slice(0, 1000),
    source: "recapPage",
    status: "success",
  };
}
