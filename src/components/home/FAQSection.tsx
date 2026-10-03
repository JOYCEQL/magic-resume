import { useTranslations } from "@/i18n/compat/client";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function FAQSection() {
  const t = useTranslations("home.faq");
  const items = t.raw("items") as { question: string; answer: string }[];
  return (
    <section
      className="landing-faq landing-shell landing-section"
      id="faq"
      aria-labelledby="faq-title"
    >
      <h2 id="faq-title">{t("title")}</h2>
      <Accordion type="single" collapsible>
        {items.map((item, index) => (
          <AccordionItem key={item.question} value={`faq-${index}`}>
            <AccordionTrigger>{item.question}</AccordionTrigger>
            <AccordionContent>{item.answer}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
