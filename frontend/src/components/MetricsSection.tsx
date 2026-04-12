const metrics = [
  { value: "40–60%", label: "Less Follow-Up Time", description: "AI summaries and automatic action items eliminate manual note-taking" },
  { value: "25–40%", label: "Productivity Boost", description: "Real-time collaboration turns meetings into actionable outcomes" },
  { value: "10K+", label: "Concurrent Meetings", description: "Horizontal scaling handles peak-hour enterprise loads" },
  { value: "0", label: "Downtime Deploys", description: "New AI features ship without interrupting ongoing meetings" },
];

const MetricsSection = () => {
  return (
    <section id="metrics" className="py-24 md:py-32">
      <div className="container mx-auto px-6">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <h2 className="mb-4 text-3xl font-bold text-foreground sm:text-4xl">
            Measurable Business Impact
          </h2>
          <p className="text-muted-foreground">
            Quantified results designed for Zidio Development's enterprise clients.
          </p>
        </div>

        <div className="mx-auto grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {metrics.map((m) => (
            <div
              key={m.label}
              className="relative overflow-hidden rounded-xl border border-border bg-gradient-card p-6 text-center"
            >
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-accent" />
              <div className="mb-1 text-3xl font-extrabold text-gradient-primary">{m.value}</div>
              <div className="mb-2 text-sm font-semibold text-foreground">{m.label}</div>
              <p className="text-xs leading-relaxed text-muted-foreground">{m.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default MetricsSection;
