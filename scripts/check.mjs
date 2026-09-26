import * as cheerio from "cheerio";
import { readFile, readdir } from "node:fs/promises";
import { join, relative } from "node:path";
import { HtmlValidate } from "html-validate";
import { LinkChecker } from "linkinator";

const SITE_DIR = process.env.CHECK_SITE_DIR || "_site";
const SRC_DIR = process.env.CHECK_SRC_DIR || "src";

async function walk(dir) {
  const out = [];
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    const full = join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(full)));
    else out.push(full);
  }
  return out;
}

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

async function main() {
  const problems = [];
  const allFiles = await walk(SITE_DIR);
  const htmlFiles = allFiles.filter((f) => f.endsWith(".html"));

  if (htmlFiles.length === 0) {
    console.error(`check failed — no HTML files under ${SITE_DIR}/ (did the build run?)`);
    process.exit(1);
  }

  // (a) html-validate
  const htmlvalidate = new HtmlValidate({ extends: ["html-validate:recommended"] });
  for (const f of htmlFiles) {
    const report = await htmlvalidate.validateFile(f);
    if (!report.valid) {
      for (const r of report.results) {
        for (const msg of r.messages) {
          problems.push(`${fileToUrl(relative(SITE_DIR, f).replace(/\\/g, "/"))}: ${msg.ruleId} — ${msg.message} (line ${msg.line})`);
        }
      }
    }
  }

  // (b)(c) per-page metadata + secret scan; collect noindex URLs and nav links
  const noindexUrls = new Set();
  const navLinks = new Set();
  const pageUrls = [];
  for (const f of htmlFiles) {
    const html = await readFile(f, "utf8");
    const url = fileToUrl(relative(SITE_DIR, f).replace(/\\/g, "/"));
    pageUrls.push(url);
    for (const e of checkMetadata(html)) problems.push(`${url}: ${e}`);
    for (const e of checkSecrets(html)) problems.push(`${url}: ${e}`);
    if (isNoindex(html)) noindexUrls.add(url);
    for (const h of navHrefs(html)) navLinks.add(h);
  }
  for (const f of allFiles.filter((f) => /\.(xml|txt|css|js|json)$/.test(f))) {
    for (const e of checkSecrets(await readFile(f, "utf8"))) {
      problems.push(`${relative(SITE_DIR, f).replace(/\\/g, "/")}: ${e}`);
    }
  }

  // sitemap URLs
  let sitemapPaths = new Set();
  try {
    const xml = await readFile(join(SITE_DIR, "sitemap.xml"), "utf8");
    sitemapPaths = new Set([...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname));
  } catch {
    problems.push("sitemap.xml: not found in build output");
  }

  // (d) unlisted guarantee, driven by source front-matter
  const srcNjk = (await walk(SRC_DIR)).filter((f) => f.endsWith(".njk"));
  for (const f of srcNjk) {
    const { unlisted, permalink } = sourceFrontMatter(await readFile(f, "utf8"));
    if (!unlisted) continue;
    const rel = relative(SRC_DIR, f).replace(/\\/g, "/");
    if (!permalink) {
      problems.push(`${rel}: unlisted page must set an explicit permalink`);
      continue;
    }
    if (!noindexUrls.has(permalink)) problems.push(`${permalink}: unlisted source, but built page is missing <meta robots noindex>`);
    if (sitemapPaths.has(permalink)) problems.push(`${permalink}: unlisted page appears in sitemap.xml`);
    if (navLinks.has(permalink)) problems.push(`${permalink}: unlisted page is linked from a page nav`);
  }

  // (e) any noindex page must not be advertised
  for (const url of noindexUrls) {
    if (sitemapPaths.has(url)) problems.push(`${url}: noindex page appears in sitemap.xml`);
    if (navLinks.has(url)) problems.push(`${url}: noindex page is linked from a page nav`);
  }

  // (f) orphan check
  for (const url of pageUrls) {
    if (url === "/404.html" || noindexUrls.has(url)) continue;
    if (!navLinks.has(url) && !sitemapPaths.has(url)) {
      problems.push(`${url}: canonical page is in neither the nav nor the sitemap (orphan)`);
    }
  }

  // (g) broken links
  // localhost:8080 is the canonical-URL fallback for local builds (src/_data/site.js);
  // the dev server is not running during a check, so those self-links must be skipped.
  // example.com is the reserved documentation domain used by test fixtures;
  // skipping it keeps the fixture tests hermetic (no live-network dependency).
  // pmc.ncbi.nlm.nih.gov (PubMed Central) returns 200 to a browser or curl but blocks
  // linkinator's client, likely on request fingerprinting; verified live before skipping.
  const skip = ["linkedin\\.com", "pmc\\.ncbi\\.nlm\\.nih\\.gov", "localhost:8080", "example\\.com"];
  if (process.env.SITE_URL) {
    skip.push(process.env.SITE_URL.replace(/^https?:\/\//, "").replace(/\./g, "\\."));
  }
  const checker = new LinkChecker();
  const result = await checker.check({ path: SITE_DIR, recurse: true, linksToSkip: skip });
  for (const link of result.links) {
    if (link.state === "BROKEN") problems.push(`broken link: ${link.url} (referenced from ${link.parent})`);
  }

  if (problems.length) {
    console.error(`\ncheck failed — ${problems.length} problem(s):\n`);
    for (const p of problems) console.error("  ✗ " + p);
    process.exit(1);
  }
  console.log(`check passed — ${htmlFiles.length} page(s), 0 problems`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
