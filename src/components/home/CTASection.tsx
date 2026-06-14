import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useTranslations } from "@/i18n/compat/client";
import AnimatedFeature from "./client/AnimatedFeature";
import GoDashboard from "./GoDashboard";

export default function CTASection() {
  const t = useTranslations("home");

  return (
    <section className="py-32 md:py-48 bg-background relative overflow-hidden flex items-center justify-center min-h-[80vh]">
      
      {/* Giant Background Typography */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none opacity-[0.04] dark:opacity-[0.06]">
        <div className="text-[20vw] md:text-[18vw] font-black text-foreground whitespace-nowrap leading-[0.8] tracking-tighter">
          MAGIC
        </div>
        <div 
          className="text-[20vw] md:text-[18vw] font-black text-transparent whitespace-nowrap leading-[0.8] tracking-tighter" 
          style={{ WebkitTextStroke: '2px hsl(var(--foreground))' }}
        >
          RESUME
        </div>
      </div>

      {/* Fine Premium Grid */}
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_60%,transparent_100%)]" />

      <div className="container mx-auto px-6 relative z-10 text-center">
        <AnimatedFeature>
          <div className="flex flex-col items-center max-w-4xl mx-auto">
            <h2 className="text-5xl md:text-7xl lg:text-8xl font-serif font-medium tracking-tight text-foreground mb-8 leading-[1.1]">
              {t("cta.title")}
            </h2>
            
            <p className="text-xl md:text-2xl text-muted-foreground mb-16 max-w-2xl font-light leading-relaxed">
              {t("cta.description")}
            </p>
            
            <GoDashboard>
              <Button 
                size="lg" 
                className="rounded-full h-16 px-12 text-xl font-medium shadow-none hover:shadow-2xl hover:-translate-y-0.5 bg-foreground text-background hover:bg-foreground/90 active:scale-95 transition-all duration-300 group"
              >
                {t("cta.button")}
                <ArrowRight className="w-6 h-6 ml-3 group-hover:translate-x-1.5 transition-transform duration-300" />
              </Button>
            </GoDashboard>

          </div>
        </AnimatedFeature>
      </div>
    </section>
  );
}
