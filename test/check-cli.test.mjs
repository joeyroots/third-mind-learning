import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const run = promisify(execFile);
const SCRIPT = new URL("../scripts/check.mjs", import.meta.url).pathname;

async function scaffold() {
  const root = await mkdtemp(join(tmpdir(), "check-"));
  const site = join(root, "site");
  const src = join(root, "src");
  await mkdir(join(site, "hidden"), { recursive: true });
  await mkdir(src, { recursive: true });
  return { root, site, src };
}

const page = (opts = {}) => `<!DOCTYPE html><html lang="en"><head>
<meta charset="utf-8"><title>${opts.title ?? "Title"}</title>
<meta name="description" content="${opts.desc ?? "desc"}">
<link rel="canonical" href="https://example.com${opts.url ?? "/"}">
${opts.noindex ? '<meta name="robots" content="noindex, nofollow">' : ""}
</head><body><header><nav>${(opts.nav ?? ["/"]).map((h) => `<a href="${h}">x</a>`).join("")}</nav></header>
<main><h1>${opts.h1 ?? "One"}</h1>${opts.body ?? ""}</main><footer>f</footer></body></html>`;

const sitemap = (paths) =>
  `<?xml version="1.0"?><urlset>${paths.map((p) => `<url><loc>https://example.com${p}</loc></url>`).join("")}</urlset>`;

async function checkExit(site, src) {
  try {
    await run("node", [SCRIPT], { env: { ...process.env, CHECK_SITE_DIR: site, CHECK_SRC_DIR: src } });
    return 0;
  } catch (e) {
    return e.code ?? 1;
  }
}

test("clean fixture passes", async () => {
  const { root, site, src } = await scaffold();
  await writeFile(join(site, "index.html"), page({ url: "/", nav: ["/", "/about/"] }));
  await mkdir(join(site, "about"), { recursive: true });
  await writeFile(join(site, "about", "index.html"), page({ url: "/about/", nav: ["/", "/about/"] }));
  await writeFile(join(site, "sitemap.xml"), sitemap(["/", "/about/"]));
  await writeFile(join(site, "robots.txt"), "User-agent: *\nAllow: /\n");
  assert.equal(await checkExit(site, src), 0);
  await rm(root, { recursive: true, force: true });
});

test("missing description fails", async () => {
  const { root, site, src } = await scaffold();
  await writeFile(join(site, "index.html"),
    page({ url: "/", nav: ["/"] }).replace(/<meta name="description"[^>]*>/, ""));
  await writeFile(join(site, "sitemap.xml"), sitemap(["/"]));
  assert.equal(await checkExit(site, src), 1);
  await rm(root, { recursive: true, force: true });
});

test("unlisted page leaking into the sitemap fails", async () => {
  const { root, site, src } = await scaffold();
  await writeFile(join(site, "index.html"), page({ url: "/", nav: ["/"] }));
  await writeFile(join(site, "hidden", "index.html"),
    page({ url: "/hidden/", nav: ["/"], noindex: true }));
  await writeFile(join(site, "sitemap.xml"), sitemap(["/", "/hidden/"]));
  await writeFile(join(src, "hidden.njk"),
    "---\npermalink: /hidden/\nunlisted: true\n---\n<h1>x</h1>");
  assert.equal(await checkExit(site, src), 1);
  await rm(root, { recursive: true, force: true });
});

test("unlisted source without a built noindex page fails", async () => {
  const { root, site, src } = await scaffold();
  await writeFile(join(site, "index.html"), page({ url: "/", nav: ["/"] }));
  await writeFile(join(site, "hidden", "index.html"),
    page({ url: "/hidden/", nav: ["/"] })); // NOT noindex
  await writeFile(join(site, "sitemap.xml"), sitemap(["/"]));
  await writeFile(join(src, "hidden.njk"),
    "---\npermalink: /hidden/\nunlisted: true\n---\n<h1>x</h1>");
  assert.equal(await checkExit(site, src), 1);
  await rm(root, { recursive: true, force: true });
});

test("orphan canonical page fails", async () => {
  const { root, site, src } = await scaffold();
  await writeFile(join(site, "index.html"), page({ url: "/", nav: ["/"] }));
  await mkdir(join(site, "lonely"), { recursive: true });
  await writeFile(join(site, "lonely", "index.html"), page({ url: "/lonely/", nav: ["/"] }));
  await writeFile(join(site, "sitemap.xml"), sitemap(["/"])); // /lonely/ in neither nav nor sitemap
  assert.equal(await checkExit(site, src), 1);
  await rm(root, { recursive: true, force: true });
});
