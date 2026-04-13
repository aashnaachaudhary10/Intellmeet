import { useState } from "react";
import { Video, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useLocation, useNavigate } from "react-router-dom";

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate(); // Navigation hook

  const links = [
    { name: "Home", path: "/" },
    { name: "About Us", path: "/about" },
    { name: "Contact Us", path: "/contact" },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass">
      <div className="container mx-auto flex items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-primary">
            <Video className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold text-foreground">IntellMeet</span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <Link
              key={l.name}
              to={l.path}
              className={`text-sm font-medium transition-colors hover:text-foreground ${
                isActive(l.path) ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              {l.name}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-muted-foreground hover:text-foreground"
            onClick={() => navigate('/auth')} // Added navigation
          >
            Sign In
          </Button>
          <Button 
            size="sm" 
            className="bg-gradient-primary text-primary-foreground hover:opacity-90"
            onClick={() => navigate('/auth')} // Added navigation
          >
            Get Started
          </Button>
        </div>

        <button
          className="text-foreground md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-border px-6 py-4 md:hidden">
          {links.map((l) => (
            <Link
              key={l.name}
              to={l.path}
              className="block py-2 text-sm text-muted-foreground"
              onClick={() => setMobileOpen(false)}
            >
              {l.name}
            </Link>
          ))}
          <div className="mt-4 flex flex-col gap-2">
            <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => navigate('/auth')}>Sign In</Button>
            <Button size="sm" className="bg-gradient-primary text-primary-foreground" onClick={() => navigate('/auth')}>Get Started</Button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;