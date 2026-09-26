import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import * as cheerio from "cheerio";

// `npm test` runs `npm run build` first (pretest), so _site/ exists here.
const read = (p) => readFile(new URL(`../_site/${p}`, import.meta.url), "utf8");

test("home page is built with required head elements", async () => {
  assert.ok(existsSync(new URL("../_site/index.html", import.meta.url)), "_site/index.html exists");
  const $ = cheerio.load(await read("index.html"));
  assert.equal($("title").length, 1);
  assert.ok($("title").text().trim().length > 0, "non-empty <title>");
  assert.ok(($('meta[name="description"]').attr("content") || "").trim().length > 0, "non-empty description");
  assert.equal($("h1").length, 1, "exactly one <h1>");
  assert.match($('link[rel="canonical"]').attr("href") || "", /^https?:\/\/.+\/$/);
});

test("shared chrome renders on the home page", async () => {
  const $ = cheerio.load(await read("index.html"));
  assert.equal($("header nav").length, 1, "header nav present");
  assert.equal($("main#main").length, 1, "main landmark present");
  assert.equal($("footer").length, 1, "footer present");
});

test("home page is in the primary nav", async () => {
  const $ = cheerio.load(await read("index.html"));
  const hrefs = $("header a[href]").map((_, a) => $(a).attr("href")).get();
  assert.ok(hrefs.includes("/"), "nav links to /");
});

test("404 page is built", async () => {
  assert.ok(existsSync(new URL("../_site/404.html", import.meta.url)), "_site/404.html exists");
  const $ = cheerio.load(await read("404.html"));
  assert.equal($("h1").length, 1);
});

test("stylesheet is copied through", () => {
  assert.ok(
    existsSync(new URL("../_site/assets/css/site.css", import.meta.url)),
    "_site/assets/css/site.css exists",
  );
});

test("research page is built and in the nav", async () => {
  assert.ok(
    existsSync(new URL("../_site/research/index.html", import.meta.url)),
    "_site/research/index.html exists",
  );
  const $ = cheerio.load(await read("research/index.html"));
  assert.equal($("h1").length, 1, "research has exactly one <h1>");
  assert.ok(($("title").text() || "").trim().length > 0);
  assert.ok(($('meta[name="description"]').attr("content") || "").trim().length > 0);

  const homeNav = cheerio
    .load(await read("index.html"))("header a[href]")
    .map((_, a) => a.attribs.href)
    .get();
  assert.ok(homeNav.includes("/research/"), "home nav links to /research/");
});

test("privacy page is built and out of the nav", async () => {
  assert.ok(
    existsSync(new URL("../_site/privacy/index.html", import.meta.url)),
    "_site/privacy/index.html exists",
  );
  const $ = cheerio.load(await read("privacy/index.html"));
  assert.equal($("h1").length, 1, "privacy has exactly one <h1>");
  assert.ok(($("title").text() || "").trim().length > 0);
  assert.ok(($('meta[name="description"]').attr("content") || "").trim().length > 0);

  const homeNav = cheerio
    .load(await read("index.html"))("header a[href]")
    .map((_, a) => a.attribs.href)
    .get();
  assert.ok(!homeNav.includes("/privacy/"), "privacy is not in the header nav");

  const footerLinks = cheerio
    .load(await read("index.html"))("footer a[href]")
    .map((_, a) => a.attribs.href)
    .get();
  assert.ok(footerLinks.includes("/privacy/"), "privacy is linked from the footer");
});

test("contact page is built and in the nav", async () => {
  assert.ok(
    existsSync(new URL("../_site/contact/index.html", import.meta.url)),
    "_site/contact/index.html exists",
  );
  const $ = cheerio.load(await read("contact/index.html"));
  assert.equal($("h1").length, 1, "contact has exactly one <h1>");
  assert.ok(($("title").text() || "").trim().length > 0);
  assert.ok(($('meta[name="description"]').attr("content") || "").trim().length > 0);

  const homeNav = cheerio
    .load(await read("index.html"))("header a[href]")
    .map((_, a) => a.attribs.href)
    .get();
  assert.ok(homeNav.includes("/contact/"), "home nav links to /contact/");
});

test("sitemap lists all canonical pages and excludes infra", async () => {
  assert.ok(existsSync(new URL("../_site/sitemap.xml", import.meta.url)), "sitemap.xml exists");
  const xml = await read("sitemap.xml");
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
  for (const path of ["/", "/research/", "/contact/", "/privacy/"]) {
    assert.ok(locs.includes(path), `sitemap has ${path}`);
  }
  assert.ok(!locs.includes("/404.html"), "sitemap omits /404.html");
  assert.ok(!locs.some((p) => p.endsWith("sitemap.xml") || p.endsWith("robots.txt")), "sitemap omits infra files");
});

test("old /about/ URL redirects to /research/", () => {
  const cfg = JSON.parse(readFileSync(new URL("../firebase.json", import.meta.url), "utf8"));
  const r = cfg.hosting.redirects.find((x) => x.source === "/about/");
  assert.ok(r, "firebase.json has an /about/ redirect");
  assert.equal(r.destination, "/research/");
  assert.equal(r.type, 301);
});

test("robots.txt points at the sitemap", async () => {
  assert.ok(existsSync(new URL("../_site/robots.txt", import.meta.url)), "robots.txt exists");
  const txt = await read("robots.txt");
  assert.match(txt, /Sitemap:\s*https?:\/\/\S+\/sitemap\.xml/);
});

test("firebase.json is valid and has the required hosting config", () => {
  const cfg = JSON.parse(readFileSync(new URL("../firebase.json", import.meta.url), "utf8"));
  assert.equal(cfg.hosting.public, "_site");
  assert.equal(cfg.hosting.cleanUrls, true);
  assert.equal(cfg.hosting.trailingSlash, true);
  // Security headers must sit on a source that matches clean URLs (e.g. "**");
  // "**/*.html" never matches "/about/" when cleanUrls is on.
  const htmlHeaders = cfg.hosting.headers.find((h) =>
    h.headers.some((x) => x.key.toLowerCase() === "content-security-policy"),
  );
  assert.equal(htmlHeaders.source, "**", "security headers apply to every request path");
  const keys = htmlHeaders.headers.map((h) => h.key.toLowerCase());
  for (const required of [
    "content-security-policy",
    "x-content-type-options",
    "referrer-policy",
    "strict-transport-security",
  ]) {
    assert.ok(keys.includes(required), `html headers include ${required}`);
  }
  assert.ok(cfg.hosting.headers.some((h) => /max-age=31536000/.test(JSON.stringify(h))), "a long-cache header exists");
});
