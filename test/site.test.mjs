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

test("program page is built and in the nav", async () => {
  assert.ok(
    existsSync(new URL("../_site/program/index.html", import.meta.url)),
    "_site/program/index.html exists",
  );
  const $ = cheerio.load(await read("program/index.html"));
  assert.equal($("h1").length, 1, "program has exactly one <h1>");
  assert.ok(($("title").text() || "").trim().length > 0);
  assert.ok(($('meta[name="description"]').attr("content") || "").trim().length > 0);

  const homeNav = cheerio
    .load(await read("index.html"))("header a[href]")
    .map((_, a) => a.attribs.href)
    .get();
  assert.ok(homeNav.includes("/program/"), "home nav links to /program/");
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
