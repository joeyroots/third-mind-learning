import * as cheerio from "cheerio";

export const SECRET_PATTERNS = [
  /-----BEGIN (?:RSA |EC |OPENSSH |PGP )?PRIVATE KEY-----/,
  /-----BEGIN CERTIFICATE-----/,
  /AIza[0-9A-Za-z_-]{35}/, // Google API key
  /AKIA[0-9A-Z]{16}/, // AWS access key id
  /ghp_[0-9A-Za-z]{36}/, // GitHub personal access token
  /"private_key"\s*:\s*"-----BEGIN/, // service-account JSON
];

export function checkMetadata(html) {
  const $ = cheerio.load(html);
  const errs = [];
  const titles = $("title");
  if (titles.length !== 1) errs.push(`expected exactly one <title>, found ${titles.length}`);
  else if (!titles.first().text().trim()) errs.push("empty <title>");
  const desc = $('meta[name="description"]').attr("content");
  if (!desc || !desc.trim()) errs.push("missing or empty <meta name=description>");
  const h1s = $("h1").length;
  if (h1s !== 1) errs.push(`expected exactly one <h1>, found ${h1s}`);
  const canon = $('link[rel="canonical"]').attr("href");
  if (!canon) errs.push("missing <link rel=canonical>");
  else if (!/^https?:\/\/.+/.test(canon)) errs.push(`<link rel=canonical> is not an absolute URL: ${canon}`);
  return errs;
}

export function isNoindex(html) {
  const $ = cheerio.load(html);
  return ($('meta[name="robots"]').attr("content") || "").toLowerCase().includes("noindex");
}

export function navHrefs(html) {
  const $ = cheerio.load(html);
  return $("header a[href]").map((_, a) => $(a).attr("href")).get();
}

export function checkSecrets(text) {
  return SECRET_PATTERNS.filter((re) => re.test(text)).map((re) => `possible secret matching ${re}`);
}

export function sourceFrontMatter(fileText) {
  const m = fileText.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  const fm = m ? m[1] : "";
  const permalinkMatch = fm.match(/^\s*permalink:\s*(\S+)\s*$/m);
  return {
    unlisted: /^\s*unlisted:\s*true\s*$/m.test(fm),
    permalink: permalinkMatch ? permalinkMatch[1] : null,
  };
}

export function fileToUrl(siteRelPath) {
  const p = siteRelPath.replace(/\\/g, "/");
  if (p === "404.html") return "/404.html";
  return "/" + p.replace(/index\.html$/, "");
}
