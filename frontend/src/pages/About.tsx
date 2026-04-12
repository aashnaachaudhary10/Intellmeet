import Navbar from "@/components/Navbar";
import FooterSection from "@/components/FooterSection";
import { Target, Eye, Users, Award, Rocket, Heart } from "lucide-react";

const values = [
  {
    icon: Rocket,
    title: "Innovation First",
    description: "We leverage cutting-edge AI and real-time technologies to build solutions that redefine how teams collaborate.",
  },
  {
    icon: Users,
    title: "Team Empowerment",
    description: "Every feature is designed to make teams more productive, reducing friction and eliminating wasted meeting time.",
  },
  {
    icon: Award,
    title: "Enterprise Quality",
    description: "Production-grade architecture with 99.95% uptime SLA, end-to-end encryption, and horizontal scalability.",
  },
  {
    icon: Heart,
    title: "User-Centric Design",
    description: "Intuitive interfaces that require zero training — your team can start using IntellMeet from day one.",
  },
];

const team = [
  { name: "Zidio Development", role: "Engineering Team", description: "Full-stack MERN specialists building production-grade enterprise applications." },
  { name: "AI Research Lab", role: "AI & ML Division", description: "Developing advanced NLP models for real-time transcription and meeting intelligence." },
  { name: "DevOps Team", role: "Infrastructure", description: "Ensuring 99.95% uptime with Kubernetes, Docker, and CI/CD automation." },
];

const About = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-hero pt-24">
        <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2">
          <div className="h-[400px] w-[600px] rounded-full bg-primary/10 blur-[120px] animate-pulse-glow" />
        </div>
        <div className="container relative mx-auto px-6 py-20 md:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="mb-6 text-4xl font-extrabold leading-tight text-foreground sm:text-5xl md:text-6xl animate-fade-up">
              About <span className="text-gradient-primary">IntellMeet</span>
            </h1>
            <p className="mx-auto max-w-2xl text-lg leading-relaxed text-muted-foreground animate-fade-up" style={{ animationDelay: "0.1s" }}>
              We're on a mission to transform enterprise meetings from time-wasters into productivity powerhouses — powered by AI and built by Zidio Development.
            </p>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-24 md:py-32">
        <div className="container mx-auto px-6">
          <div className="mx-auto grid max-w-5xl gap-12 md:grid-cols-2">
            <div className="rounded-xl border border-border bg-gradient-card p-8">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Target className="h-6 w-6 text-primary" />
              </div>
              <h2 className="mb-4 text-2xl font-bold text-foreground">Our Mission</h2>
              <p className="leading-relaxed text-muted-foreground">
                Enterprises waste thousands of hours every year in unproductive meetings. IntellMeet solves this by turning every meeting into an actionable, trackable event — reducing follow-up time by 40–60% and boosting team productivity by 25–40%.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-gradient-card p-8">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10">
                <Eye className="h-6 w-6 text-accent" />
              </div>
              <h2 className="mb-4 text-2xl font-bold text-foreground">Our Vision</h2>
              <p className="leading-relaxed text-muted-foreground">
                To become the leading AI-powered meeting platform for modern remote and hybrid teams — where every conversation drives measurable outcomes and no insight is ever lost.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-24 md:py-32 border-t border-border">
        <div className="container mx-auto px-6">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <h2 className="mb-4 text-3xl font-bold text-foreground sm:text-4xl">Our Core Values</h2>
            <p className="text-muted-foreground">The principles that drive every feature we build.</p>
          </div>
          <div className="mx-auto grid max-w-5xl gap-6 sm:grid-cols-2">
            {values.map((v) => (
              <div key={v.title} className="group rounded-xl border border-border bg-gradient-card p-6 transition-all hover:border-primary/30 hover:shadow-glow">
                <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10">
                  <v.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-foreground">{v.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{v.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-24 md:py-32 border-t border-border">
        <div className="container mx-auto px-6">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <h2 className="mb-4 text-3xl font-bold text-foreground sm:text-4xl">The Team Behind IntellMeet</h2>
            <p className="text-muted-foreground">Built by Zidio Development — v2.0 Industry Edition, April 2026.</p>
          </div>
          <div className="mx-auto grid max-w-4xl gap-6 sm:grid-cols-3">
            {team.map((t) => (
              <div key={t.name} className="rounded-xl border border-border bg-gradient-card p-6 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <Users className="h-7 w-7 text-primary" />
                </div>
                <h3 className="mb-1 text-sm font-semibold text-foreground">{t.name}</h3>
                <p className="mb-2 text-xs font-medium text-accent">{t.role}</p>
                <p className="text-xs text-muted-foreground">{t.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <FooterSection />
    </div>
  );
};

export default About;
