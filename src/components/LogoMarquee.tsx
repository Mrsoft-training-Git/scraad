import { Award, Building2, Globe2, Briefcase, GraduationCap, Rocket, ShieldCheck, Sparkles } from "lucide-react";

const partners = [
  { name: "TechCorp", icon: Rocket },
  { name: "EduGlobal", icon: GraduationCap },
  { name: "InnovateHub", icon: Sparkles },
  { name: "FinanceFirst", icon: Building2 },
  { name: "GreenWorld", icon: Globe2 },
  { name: "TrustNet", icon: ShieldCheck },
  { name: "CareerLab", icon: Briefcase },
  { name: "AwardCo", icon: Award },
];

export const LogoMarquee = () => {
  return (
    <section className="py-10 lg:py-14 bg-card border-y border-border">
      <div className="container mx-auto px-4">
        <p className="text-center text-xs uppercase tracking-[0.2em] text-muted-foreground mb-6 font-medium">
          Trusted by learners from
        </p>
        <div className="marquee">
          <div className="marquee-track">
            {[...partners, ...partners].map((p, i) => {
              const Icon = p.icon;
              return (
                <div
                  key={i}
                  className="flex items-center gap-2.5 text-muted-foreground hover:text-primary transition-colors whitespace-nowrap"
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-display italic text-lg font-semibold">{p.name}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
