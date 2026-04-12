import { useState } from "react";
import Navbar from "@/components/Navbar";
import FooterSection from "@/components/FooterSection";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Mail, MapPin, Phone, Send, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const contactInfo = [
  { icon: Mail, label: "Email", value: "contact@intellmeet.io", href: "mailto:contact@intellmeet.io" },
  { icon: Phone, label: "Phone", value: "+91 98765 43210", href: "tel:+919876543210" },
  { icon: MapPin, label: "Office", value: "Zidio Development, Bangalore, India", href: "#" },
];

const Contact = () => {
  const { toast } = useToast();
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({ title: "Message Sent!", description: "We'll get back to you within 24 hours." });
    setForm({ name: "", email: "", subject: "", message: "" });
  };

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
              Get In <span className="text-gradient-primary">Touch</span>
            </h1>
            <p className="mx-auto max-w-2xl text-lg leading-relaxed text-muted-foreground animate-fade-up" style={{ animationDelay: "0.1s" }}>
              Have questions about IntellMeet? Want to schedule a demo or discuss enterprise pricing? We'd love to hear from you.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Content */}
      <section className="py-24 md:py-32">
        <div className="container mx-auto px-6">
          <div className="mx-auto grid max-w-5xl gap-12 lg:grid-cols-5">
            {/* Contact Info */}
            <div className="lg:col-span-2 space-y-6">
              <div>
                <h2 className="mb-2 text-2xl font-bold text-foreground">Contact Information</h2>
                <p className="text-sm text-muted-foreground">
                  Reach out to us and our team will respond within 24 hours.
                </p>
              </div>

              <div className="space-y-4">
                {contactInfo.map((c) => (
                  <a
                    key={c.label}
                    href={c.href}
                    className="flex items-start gap-4 rounded-xl border border-border bg-gradient-card p-4 transition-colors hover:border-primary/30"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <c.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-foreground">{c.label}</div>
                      <div className="text-xs text-muted-foreground">{c.value}</div>
                    </div>
                  </a>
                ))}
              </div>

              <div className="rounded-xl border border-border bg-gradient-card p-6">
                <div className="mb-3 flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-accent" />
                  <span className="text-sm font-semibold text-foreground">Enterprise Inquiries</span>
                </div>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  For enterprise pricing, custom deployments, or partnership opportunities, please mention it in your message and our enterprise team will prioritize your request.
                </p>
              </div>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-3">
              <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-gradient-card p-8">
                <h2 className="mb-6 text-2xl font-bold text-foreground">Send Us a Message</h2>
                <div className="space-y-5">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        placeholder="Your name"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        required
                        className="border-border bg-secondary/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@company.com"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        required
                        className="border-border bg-secondary/50"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Input
                      id="subject"
                      placeholder="How can we help?"
                      value={form.subject}
                      onChange={(e) => setForm({ ...form, subject: e.target.value })}
                      required
                      className="border-border bg-secondary/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      placeholder="Tell us more about your needs..."
                      rows={5}
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      required
                      className="border-border bg-secondary/50"
                    />
                  </div>
                  <Button type="submit" className="w-full bg-gradient-primary text-primary-foreground hover:opacity-90">
                    <Send className="mr-2 h-4 w-4" />
                    Send Message
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>

      <FooterSection />
    </div>
  );
};

export default Contact;
