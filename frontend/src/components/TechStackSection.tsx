const stack = [
  { layer: "Frontend", tech: "React 19 + TypeScript + Vite", detail: "Fast HMR, code-splitting, shadcn/ui + Tailwind" },
  { layer: "Backend", tech: "Node.js + Express", detail: "Lightweight, fast, horizontally scalable" },
  { layer: "Database", tech: "MongoDB + Mongoose", detail: "Flexible schema for meetings and tasks" },
  { layer: "Real-Time", tech: "Socket.io + WebRTC", detail: "Low-latency bidirectional video & chat" },
  { layer: "AI Engine", tech: "OpenAI / Hugging Face", detail: "Transcription, summarization, action items" },
  { layer: "Infrastructure", tech: "Docker + Kubernetes", detail: "Auto-scaling, zero-downtime deploys" },
  { layer: "Monitoring", tech: "Prometheus + Grafana", detail: "Full observability and error tracking" },
  { layer: "CI/CD", tech: "GitHub Actions", detail: "Automated testing and deployment pipelines" },
];

const TechStackSection = () => {
  return (
    <section id="technology" className="py-24 md:py-32">
      <div className="container mx-auto px-6">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <h2 className="mb-4 text-3xl font-bold text-foreground sm:text-4xl">
            Production-Grade Stack
          </h2>
          <p className="text-muted-foreground">
            Built with the MERN stack and modern DevOps practices for enterprise reliability.
          </p>
        </div>

        <div className="mx-auto grid max-w-4xl gap-4 sm:grid-cols-2">
          {stack.map((s) => (
            <div
              key={s.layer}
              className="flex items-start gap-4 rounded-xl border border-border bg-gradient-card p-5 transition-colors hover:border-primary/20"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-sm font-bold text-accent">
                {s.layer.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="text-sm font-semibold text-foreground">{s.tech}</div>
                <div className="text-xs text-muted-foreground">{s.detail}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TechStackSection;
