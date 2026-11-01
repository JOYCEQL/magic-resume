import { createFileRoute, redirect } from "@tanstack/react-router";
import OfferInPage from "@/components/offerin/OfferInPage";

export const Route = createFileRoute("/$locale/offerin")({
  beforeLoad: ({ params }) => {
    if (params.locale !== "zh") {
      throw redirect({
        to: "/$locale/offerin",
        params: { locale: "zh" },
      });
    }
  },
  head: () => ({
    meta: [
      { title: "OfferIN AI 时代面试笔试辅助工具｜魔方简历 x OfferIN AI" },
      {
        name: "description",
        content:
          "简历写好了，面试也有底气。魔方简历联合推荐 OfferIN AI，用面试练习、笔试解析与双端互联，准备求职的下一步。",
      },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: OfferInRouteComponent,
});

function OfferInRouteComponent() {
  return <OfferInPage />;
}
