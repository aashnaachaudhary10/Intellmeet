import { Video } from "lucide-react";

const FooterSection = () => {
  return (
    <footer id="about" className="border-t border-border py-16">
      <div className="container mx-auto px-6">
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-primary">
              <Video className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold text-foreground">IntellMeet</span>
          </div>

          <p className="max-w-md text-sm text-muted-foreground">
            AI-Powered Enterprise Meeting & Collaboration Platform.
            Built by Zidio Development — v2.0 Industry Edition, April 2026.
          </p>

          <div className="flex gap-6 text-xs text-muted-foreground">
            <span>MERN Full-Stack</span>
            <span>·</span>
            <span>Real-Time Video</span>
            <span>·</span>
            <span>AI Intelligence</span>
          </div>

          <p className="text-xs text-muted-foreground/60">
            © 2026 Zidio Development. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default FooterSection;
