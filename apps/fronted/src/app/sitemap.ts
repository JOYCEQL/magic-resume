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
