
import React from "react";
import { useTranslations } from "@/i18n/compat/client";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import AnimatedFeature from "./client/AnimatedFeature";

export default function FAQSection() {
  const t = useTranslations("home.faq");
  const faqItems = t.raw("items");

  return (
    <section className="py-24 md:py-40 bg-background relative overflow-hidden">
      <div className="container mx-auto px-6 max-w-3xl">
        <AnimatedFeature>
          <div className="text-center mb-16 md:mb-20">
            <h2 className="text-4xl md:text-5xl font-serif font-semibold tracking-tight text-foreground/90">
              {t("title")}
            </h2>
            <div className="w-16 h-1 bg-primary/20 mx-auto rounded-full mt-6" />
          </div>
        </AnimatedFeature>

        <AnimatedFeature delay={0.2}>
          <Accordion type="single" collapsible className="w-full space-y-4">
            {faqItems.map(
              (item: { question: string; answer: string }, index: number) => (
                <AccordionItem 
                  key={index} 
                  value={`item-${index}`}
                  className="border border-border/50 rounded-2xl px-6 bg-secondary/20 hover:bg-secondary/40 transition-colors overflow-hidden"
                >
                  <AccordionTrigger className="text-left text-lg font-medium py-6 hover:no-underline">
                    <span className="pr-4">{item.question}</span>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed text-base pb-6 font-light">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              )
            )}
          </Accordion>
        </AnimatedFeature>
      </div>
    </section>
  );
}
