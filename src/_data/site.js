// Site-wide values. `url` is the absolute origin with NO trailing slash;
// CI sets SITE_URL for production builds, local builds fall back to the dev server.
export default {
  title: "Third Mind Learning",
  author: "Third Mind Learning",
  description:
    "Third Mind Learning — course and education programs.",
  url: process.env.SITE_URL || "http://localhost:8080",
  buildYear: new Date().getFullYear(),
  // Cache-buster for immutably cached assets (firebase.json serves css/js/img
  // with max-age=31536000, immutable). Changes every build, so a deploy always
  // reaches returning browsers.
  buildStamp: Date.now().toString(36),
};
