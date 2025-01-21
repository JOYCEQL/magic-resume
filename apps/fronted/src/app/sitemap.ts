import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://magicv.art",
      lastModified: new Date(),
      alternates: {
        languages: {
          zh: "https://magicv.art/zh",
          en: "https://magicv.art/en",
        },
      },
    },
  ];
}
