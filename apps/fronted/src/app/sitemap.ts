import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://magicv.art/",
      lastModified: new Date(),
    },
    {
      url: "https://magicv.art/zh",
      lastModified: new Date(),
    },
    {
      url: "https://magicv.art/en",
      lastModified: new Date(),
    },
  ];
}
