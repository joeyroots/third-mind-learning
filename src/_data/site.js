// Site-wide values. `url` is the absolute origin with NO trailing slash;
// CI sets SITE_URL for production builds, local builds fall back to the dev server.
export default {
  title: "Third Mind Learning",
  author: "Third Mind Learning",
  description:
    "SAT/ACT coaching for busy, overscheduled teens, combining test-taking skill with nervous-system regulation.",
  url: process.env.SITE_URL || "http://localhost:8080",
  // Default social-share image (root-relative path). No site-wide image
  // exists yet — set this once one is added, or set `ogImage` in a page's
  // own front matter to override per page. base.njk only emits the
  // og:image/twitter:image tags when a value is present.
  ogImage: null,
  buildYear: new Date().getFullYear(),
  // Cache-buster for immutably cached assets (firebase.json serves css/js/img
  // with max-age=31536000, immutable). Changes every build, so a deploy always
  // reaches returning browsers.
  buildStamp: Date.now().toString(36),
};
