export default function (eleventyConfig) {
  // Copy src/assets/** to _site/assets/** untouched.
  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });
  eleventyConfig.addWatchTarget("src/assets/css/");

  // Pages opt into the primary nav with `eleventyNavigation: { key, order }`
  // front-matter. Unlisted pages are filtered out here so they can never
  // reach the header, regardless of their front-matter.
  eleventyConfig.addCollection("navPages", (collectionApi) =>
    collectionApi
      .getAll()
      .filter((item) => item.data.eleventyNavigation && !item.data.unlisted)
      .sort(
        (a, b) =>
          (a.data.eleventyNavigation.order || 0) -
          (b.data.eleventyNavigation.order || 0),
      ),
  );

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      data: "_data",
    },
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk",
  };
}
