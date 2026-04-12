import {
  Video,
  Brain,
  MessageSquare,
  BarChart3,
  Users,
  Shield,
  Zap,
} from "lucide-react";

const features = [
  {
    icon: Video,
    title: "Real-Time Video Meetings",
    description:
      "HD video conferencing with screen sharing, recording, and live transcription. Support for 50+ participants per meeting.",
  },
  {
    icon: Brain,
    title: "AI Meeting Intelligence",
    description:
      "Automatic transcription, concise summaries, and smart action item extraction with >85% accuracy using advanced AI models.",
  },
  {
    icon: MessageSquare,
    title: "In-Meeting Collaboration",
    description:
      "Real-time chat, shared notes, and instant task creation during meetings — everything synced across all participants.",
  },
  {
    icon: BarChart3,
    title: "Analytics & Insights",
    description:
      "Meeting frequency, productivity metrics, and engagement reports with exportable dashboards and charts.",
  },
  {
    icon: Users,
    title: "Team & Project Management",
    description:
      "Team workspaces, Kanban boards, and task assignment with real-time updates to keep projects moving forward.",
  },
  {
    icon: Shield,
    title: "Enterprise-Grade Security",
    description:
      "End-to-end encryption, JWT authentication, role-based access control, and SOC 2 compliance for sensitive discussions.",
  },
];

const FeaturesSection = () => {
  return (
    <section id="features" className="relative py-24 md:py-32">
      <div className="container mx-auto px-6">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-secondary/50 px-4 py-1.5 text-sm text-muted-foreground">
            <Zap className="h-4 w-4 text-accent" />
            Core Capabilities
          </div>
          <h2 className="mb-4 text-3xl font-bold text-foreground sm:text-4xl">
            Everything Your Team Needs
          </h2>
          <p className="text-muted-foreground">
            From real-time video to AI-powered insights — IntellMeet transforms every meeting into a productive, trackable event.
          </p>
        </div>

        <div className="mx-auto grid max-w-6xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <div
              key={f.title}
              className="group relative rounded-xl border border-border bg-gradient-card p-6 transition-all hover:border-primary/30 hover:shadow-glow"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10">
                <f.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-foreground">{f.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{f.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
