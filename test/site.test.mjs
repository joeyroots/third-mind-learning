import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import * as cheerio from "cheerio";

// `npm test` runs `npm run build` first (pretest), so _site/ exists here.
const read = (p) => readFile(new URL(`../_site/${p}`, import.meta.url), "utf8");

function relativeLuminance(hex) {
  const c = hex.replace("#", "").match(/.{2}/g).map((h) => {
    const v = parseInt(h, 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
function contrastRatio(hexA, hexB) {
  const [l1, l2] = [relativeLuminance(hexA), relativeLuminance(hexB)].sort((a, b) => b - a);
  return (l1 + 0.05) / (l2 + 0.05);
}

test("dark-section text colors meet WCAG AA contrast against --ink", () => {
  const ink = "#17202a";
  assert.ok(contrastRatio(ink, "#fdfcf9") >= 4.5, "heading color (--paper) on --ink meets 4.5:1");
  assert.ok(contrastRatio(ink, "#d7dade") >= 4.5, "body text color on --ink meets 4.5:1");
});

test("home hero has the hero photo on a dark section with real alt text", async () => {
  const $ = cheerio.load(await read("index.html"));
  const hero = $(".hero.section--dark");
  assert.equal(hero.length, 1, "hero is a dark section");
  const img = hero.find("img.hero-photo");
  assert.equal(img.length, 1, "hero photo present");
  assert.equal(img.attr("src"), "/assets/img/joe-ruotolo-hero.jpg");
  const alt = (img.attr("alt") || "").trim();
  assert.ok(alt.length > 5 && /Joe/.test(alt), "hero photo has real, non-empty alt text mentioning Joe");
});

test("home page has a stats row with three real, already-stated facts", async () => {
  const $ = cheerio.load(await read("index.html"));
  const stats = $(".stats .stat");
  assert.equal(stats.length, 3, "three stat entries");
  const numbers = stats.map((_, el) => $(el).find(".stat-number").text().trim()).get();
  assert.deepEqual(numbers, ["150+", "Certified", "SAT & ACT"]);
});

test("home founder section is dark and uses the founder photo", async () => {
  const $ = cheerio.load(await read("index.html"));
  const founder = $(".section--dark").filter((_, el) => $(el).find(".bio-grid").length > 0);
  assert.equal(founder.length, 1, "founder section is a dark section");
  const img = founder.find("img.bio-photo");
  assert.equal(img.attr("src"), "/assets/img/joe-ruotolo-founder.jpg");
  const alt = (img.attr("alt") || "").trim();
  assert.ok(alt.length > 2 && /Joe/.test(alt), "founder photo has real alt text mentioning Joe");
});

test("home page pulls both testimonials into one dedicated grid", async () => {
  const $ = cheerio.load(await read("index.html"));
  assert.equal($(".quote").length, 2, "exactly two testimonial quotes on the page");
  assert.equal($(".testimonial-grid .quote").length, 2, "both quotes live in the testimonial grid");
});

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

test("about page is built and in the nav", async () => {
  assert.ok(
    existsSync(new URL("../_site/about/index.html", import.meta.url)),
    "_site/about/index.html exists",
  );
  const $ = cheerio.load(await read("about/index.html"));
  assert.equal($("h1").length, 1, "about has exactly one <h1>");
  assert.ok(($("title").text() || "").trim().length > 0);
  assert.ok(($('meta[name="description"]').attr("content") || "").trim().length > 0);

  const homeNav = cheerio
    .load(await read("index.html"))("header a[href]")
    .map((_, a) => a.attribs.href)
    .get();
  assert.ok(homeNav.includes("/about/"), "home nav links to /about/");
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
  for (const path of ["/", "/about/", "/contact/", "/privacy/"]) {
    assert.ok(locs.includes(path), `sitemap has ${path}`);
  }
  assert.ok(!locs.includes("/404.html"), "sitemap omits /404.html");
  assert.ok(!locs.some((p) => p.endsWith("sitemap.xml") || p.endsWith("robots.txt")), "sitemap omits infra files");
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
