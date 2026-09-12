import { test } from "node:test";
import assert from "node:assert/strict";
import {
  checkMetadata,
  isNoindex,
  navHrefs,
  checkSecrets,
  sourceFrontMatter,
  fileToUrl,
} from "../scripts/check.mjs";

const GOOD = `<!doctype html><html><head>
<title>T</title><meta name="description" content="d">
<link rel="canonical" href="https://example.com/x/"></head>
<body><header><a href="/">H</a><a href="/about/">A</a></header><main><h1>One</h1></main></body></html>`;

test("checkMetadata passes a well-formed page", () => {
  assert.deepEqual(checkMetadata(GOOD), []);
});

test("checkMetadata flags missing description, extra h1, bad canonical", () => {
  const bad = `<html><head><title>T</title>
  <link rel="canonical" href="/relative/"></head>
  <body><h1>a</h1><h1>b</h1></body></html>`;
  const errs = checkMetadata(bad).join(" | ");
  assert.match(errs, /description/);
  assert.match(errs, /h1/);
  assert.match(errs, /canonical/);
});

test("checkMetadata flags an empty title", () => {
  const bad = GOOD.replace("<title>T</title>", "<title>   </title>");
  assert.ok(checkMetadata(bad).some((e) => /title/.test(e)));
});

test("isNoindex detects the robots meta", () => {
  assert.equal(isNoindex(GOOD), false);
  assert.equal(
    isNoindex(GOOD.replace("</head>", '<meta name="robots" content="NOINDEX, nofollow"></head>')),
    true,
  );
});

test("navHrefs returns only header anchors", () => {
  assert.deepEqual(navHrefs(GOOD), ["/", "/about/"]);
});

test("checkSecrets catches a private key header and a Google key", () => {
  assert.ok(checkSecrets("x -----BEGIN PRIVATE KEY----- y").length >= 1);
  assert.ok(checkSecrets("key=AIza01234567890123456789012345678901234").length >= 1);
  assert.deepEqual(checkSecrets("nothing to see"), []);
});

test("sourceFrontMatter parses unlisted and permalink", () => {
  const fm = `---\nlayout: x\npermalink: /hidden/\nunlisted: true\n---\n<h1>x</h1>`;
  assert.deepEqual(sourceFrontMatter(fm), { unlisted: true, permalink: "/hidden/" });
  assert.deepEqual(sourceFrontMatter("no front matter"), { unlisted: false, permalink: null });
});

test("fileToUrl maps output paths to URL paths", () => {
  assert.equal(fileToUrl("index.html"), "/");
  assert.equal(fileToUrl("about/index.html"), "/about/");
  assert.equal(fileToUrl("404.html"), "/404.html");
});
