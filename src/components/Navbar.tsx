import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/scraad-logo.png";
import { cn } from "@/lib/utils";
import { Underline } from "@/components/Doodles";

export const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setIsAuthenticated(!!session);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navLinks = [
    { to: "/", label: "Home" },
    { to: "/courses", label: "Courses" },
    { to: "/programs", label: "Programs" },
    { to: "/career", label: "Career" },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav
      className={cn(
        "bg-card/95 backdrop-blur-xl border-b border-border sticky top-0 z-50 transition-all duration-300",
        scrolled ? "shadow-sm" : ""
      )}
    >
      <div className="container mx-auto px-4">
        <div className={cn("flex items-center justify-between transition-all duration-300", scrolled ? "h-14" : "h-16")}>
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group flex-shrink-0">
            <img src={logo} alt="ScraAd Logo" className={cn("object-contain transition-all duration-300", scrolled ? "w-8 h-8" : "w-9 h-9")} />
            <div>
              <div className="font-heading font-bold text-base leading-tight text-foreground">
                Scra<span className="text-secondary">AD</span>
              </div>
              <div className="text-[10px] text-muted-foreground leading-tight">Scratch to Advance</div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => {
              const active = isActive(link.to);
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={cn(
                    "relative px-3.5 py-2 text-sm font-medium rounded-lg transition-colors",
                    active
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                  )}
                >
                  {link.label}
                  {active && (
                    <Underline
                      className="absolute left-2 right-2 -bottom-0.5 h-1.5 text-secondary"
                      aria-hidden
                    />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Right side */}
          <div className="hidden lg:flex items-center gap-2">
            {isAuthenticated ? (
              <Button className="bg-primary hover:bg-accent text-primary-foreground font-semibold shadow-sm magnetic-btn" asChild>
                <Link to="/dashboard">Dashboard</Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" className="text-foreground hover:text-primary font-medium" asChild>
                  <Link to="/auth">Log in</Link>
                </Button>
                <Button className="bg-primary hover:bg-accent text-primary-foreground font-semibold shadow-sm magnetic-btn" asChild>
                  <Link to="/auth">Sign Up Free</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="lg:hidden p-2 rounded-lg hover:bg-muted transition-colors"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="lg:hidden pb-4 space-y-1 border-t border-border pt-3">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setIsMenuOpen(false)}
                className={cn(
                  "block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive(link.to)
                    ? "text-primary bg-primary/8"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                )}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-3 space-y-2 border-t border-border mt-2">
              {isAuthenticated ? (
                <Button className="w-full bg-primary hover:bg-accent text-primary-foreground font-semibold" asChild>
                  <Link to="/dashboard">Dashboard</Link>
                </Button>
              ) : (
                <>
                  <Button variant="outline" className="w-full font-medium" asChild>
                    <Link to="/auth">Log in</Link>
                  </Button>
                  <Button className="w-full bg-primary hover:bg-accent text-primary-foreground font-semibold" asChild>
                    <Link to="/auth">Sign Up Free</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
