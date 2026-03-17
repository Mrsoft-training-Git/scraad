import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/mr-logo.jpeg";
import { cn } from "@/lib/utils";

export const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
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

  const navLinks = [
  { to: "/", label: "Home" },
  { to: "/programs", label: "Top Rated" },
  { to: "/career", label: "Career" }];


  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-background/80 backdrop-blur-xl border-b border-border sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-14 md:h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <img src={logo} alt="Cradua Logo" className="w-8 h-8 md:w-10 md:h-10 object-contain rounded group-hover:scale-105 transition-transform" />
            <div>
              <div className="font-heading font-bold text-sm md:text-base leading-tight text-foreground">Cradua</div>
              <div className="text-[10px] md:text-xs text-muted-foreground leading-tight">by M-R International</div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-6">
            {navLinks.map((link) =>
            <Link
              key={link.to}
              to={link.to}
              className={cn(
                "text-sm font-medium transition-colors py-1 border-b-2",
                isActive(link.to) ?
                "text-primary border-primary" :
                "text-foreground hover:text-primary border-transparent"
              )}>
              
                {link.label}
              </Link>
            )}

            {isAuthenticated ?
            <Button className="bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white shadow-lg shadow-primary/30 font-semibold" asChild>
                <Link to="/dashboard">Dashboard</Link>
              </Button> :

            <>
                <Button variant="ghost" className="text-foreground hover:text-primary hover:bg-muted/50" asChild>
                  <Link to="/auth">Login</Link>
                </Button>
                <Button className="bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white shadow-lg shadow-primary/30 font-semibold" asChild>
                  <Link to="/auth">Sign Up Free</Link>
                </Button>
              </>
            }
          </div>

          {/* Mobile Menu Button */}
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="lg:hidden">
            <Menu className="w-6 h-6" />
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen &&
        <div className="lg:hidden pb-4 space-y-3">
            {navLinks.map((link) =>
          <Link
            key={link.to}
            to={link.to}
            className={cn(
              "block py-2 transition-colors",
              isActive(link.to) ? "text-primary font-semibold" : "hover:text-accent"
            )}>
            
                {link.label}
              </Link>
          )}
            <div className="pt-2 space-y-2">
              {isAuthenticated ?
            <Button variant="default" className="w-full bg-accent hover:bg-accent/90" asChild>
                  <Link to="/dashboard">Dashboard</Link>
                </Button> :

            <>
                  <Button variant="outline" className="w-full border-primary-foreground/20" asChild>
                    <Link to="/auth">Login</Link>
                  </Button>
                  <Button variant="default" className="w-full bg-accent hover:bg-accent/90" asChild>
                    <Link to="/auth">Sign Up</Link>
                  </Button>
                </>
            }
            </div>
          </div>
        }
      </div>

      {/* Sign Up Options Bar */}
      <div className="bg-muted/30 text-foreground py-2 md:py-3 text-center text-xs md:text-sm border-t border-border/50">
        











        
      </div>
    </nav>);

};