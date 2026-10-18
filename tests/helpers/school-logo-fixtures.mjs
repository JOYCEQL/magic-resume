export async function mockSchoolLogos(page, png) {
  const requests = [];
  await page.route("**/api/school-logos?*", async route => {
    const url = new URL(route.request().url());
    const query = url.searchParams.get("q");
    const pageNumber = Number(url.searchParams.get("page"));
    requests.push({ query, page: pageNumber });
    const names = query === "北京大学" ? ["北京大学"]
      : query === "Harvard" ? ["哈佛大学"]
      : query === "浙江大学" ? ["浙江大学", "浙江大学城市学院", "浙江大学宁波理工学院"]
      : query === "university" ? Array.from({ length: 6 }, (_, i) => `大学 ${i + 1}`) : [];
    await route.fulfill({ json: {
      schools: names.map((name, i) => ({ id: String(i), name, nameEn: query === "Harvard" ? "Harvard University" : name, country: "中国",
        src: `https://universitylogos.top/uni_logo/test/${i}.png`, source: "https://universitylogos.top/" })),
      page: pageNumber, hasNext: false,
    } });
  });
  await page.route("https://universitylogos.top/uni_logo/**", route => route.fulfill({ contentType: "image/png", body: png }));
  await page.route("**/api/proxy/image?url=https%3A%2F%2Funiversitylogos.top%2Funi_logo%2Ftest%2F*", route => route.fulfill({ contentType: "image/png", body: png }));
  return requests;
}
