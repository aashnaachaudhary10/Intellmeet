import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroDashboard from "@/assets/hero-dashboard.jpg";
import { useNavigate } from 'react-router-dom';

const HeroSection = () => {
  const navigate = useNavigate(); // Navigation hook

  return (
    <section className="relative min-h-screen overflow-hidden bg-gradient-hero pt-24">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2">
        <div className="h-[600px] w-[800px] rounded-full bg-primary/10 blur-[120px] animate-pulse-glow" />
      </div>

      <div className="container relative mx-auto px-6 py-20 md:py-32">
        <div className="mx-auto max-w-4xl text-center">
          {/* Badge */}
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-border bg-secondary/50 px-4 py-1.5 text-sm text-muted-foreground animate-fade-up">
            <Sparkles className="h-4 w-4 text-accent" />
            <span>AI-Powered Enterprise Meetings</span>
          </div>

          <h1 className="mb-6 text-4xl font-extrabold leading-tight tracking-tight text-foreground sm:text-5xl md:text-7xl animate-fade-up" style={{ animationDelay: "0.1s" }}>
            Meetings That{" "}
            <span className="text-gradient-primary">Actually Work</span>
          </h1>

          <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-muted-foreground animate-fade-up" style={{ animationDelay: "0.2s" }}>
            Real-time video meetings enhanced with AI transcription, smart summaries, and automatic action items. Reduce meeting follow-up time by 40–60%.
          </p>

          {/* <div className="flex flex-col items-center justify-center gap-4 sm:flex-row animate-fade-up" style={{ animationDelay: "0.3s" }}>
            <Button 
              size="lg" 
              className="bg-gradient-primary text-primary-foreground px-8 shadow-glow hover:opacity-90 transition-opacity"
              onClick={() => navigate('/auth')} // Added navigation
            >
              Start Free Trial
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" className="border-border text-foreground hover:bg-secondary">
              Watch Demo
            </Button>
          </div> */}

          {/* Stats row */}
          <div className="mt-16 grid grid-cols-3 gap-8 border-t border-border pt-8 animate-fade-up" style={{ animationDelay: "0.4s" }}>
            {[
              { value: "5,000+", label: "Concurrent Users" },
              { value: "99.95%", label: "Uptime SLA" },
              { value: "< 200ms", label: "Latency" },
            ].map((s) => (
              <div key={s.label}>
                <div className="text-2xl font-bold text-gradient-primary sm:text-3xl">{s.value}</div>
                <div className="mt-1 text-xs text-muted-foreground sm:text-sm">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Hero image */}
        <div className="relative mx-auto mt-16 max-w-5xl animate-fade-up" style={{ animationDelay: "0.5s" }}>
          <div className="absolute inset-0 rounded-xl bg-primary/20 blur-3xl" />
          <img
            src={heroDashboard}
            alt="IntellMeet AI-powered meeting dashboard"
            className="relative w-full rounded-xl border border-border shadow-card"
            loading="lazy"
          />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;