import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import logo from "@/assets/uniport-logo.png";
export const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  return <nav className="bg-background/80 backdrop-blur-xl border-b border-border sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <img src={logo} alt="UNIPORT Logo" className="w-12 h-12 object-contain group-hover:scale-105 transition-transform" />
            <div className="hidden md:block">
              <div className="font-heading font-bold text-xl leading-tight text-foreground">University of Port Harcourt</div>
              <div className="text-xs text-muted-foreground">University of Port Harcourt</div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-8">
            <Link to="/" className="text-foreground hover:text-primary transition-colors font-medium text-sm">
              Home
            </Link>
            <Link to="/programs" className="text-foreground hover:text-primary transition-colors font-medium text-sm">Top Rated Programs</Link>
            <Link to="/career" className="text-foreground hover:text-primary transition-colors font-medium text-sm">
              Career
            </Link>
            
            {/* Search */}
            <div className="relative">
              
              
            </div>

            <Button variant="ghost" className="text-foreground hover:text-primary hover:bg-muted/50" asChild>
              <Link to="/auth">Login</Link>
            </Button>
            <Button className="bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white shadow-lg shadow-primary/30 font-semibold" asChild>
              <Link to="/auth">Sign Up Free</Link>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="lg:hidden">
            <Menu className="w-6 h-6" />
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && <div className="lg:hidden pb-4 space-y-3">
            <Link to="/" className="block py-2 hover:text-accent transition-colors">
              Home
            </Link>
            <Link to="/programs" className="block py-2 hover:text-accent transition-colors">
              Programs
            </Link>
            <Link to="/career" className="block py-2 hover:text-accent transition-colors">
              Career
            </Link>
            <div className="pt-2 space-y-2">
              <Button variant="outline" className="w-full border-primary-foreground/20" asChild>
                <Link to="/auth">Login</Link>
              </Button>
              <Button variant="default" className="w-full bg-accent hover:bg-accent/90" asChild>
                <Link to="/auth">Sign Up</Link>
              </Button>
            </div>
          </div>}
      </div>

      {/* Sign Up Options Bar */}
      <div className="bg-muted/30 text-foreground py-2 md:py-3 text-center text-xs md:text-sm border-t border-border/50">
        <div className="container mx-auto px-4 flex justify-center gap-4 md:gap-8 items-center flex-wrap">
          <Link to="/signup/individual" className="hover:text-primary transition-colors font-medium flex items-center gap-2">
            <span className="w-2 h-2 bg-primary rounded-full"></span>
            <span className="hidden sm:inline">Individual Learner</span>
            <span className="sm:hidden">Individual</span>
          </Link>
          <span className="text-muted-foreground">•</span>
          <Link to="/signup/organization" className="hover:text-primary transition-colors font-medium flex items-center gap-2">
            <span className="w-2 h-2 bg-accent rounded-full"></span>
            <span className="hidden sm:inline">Business & Teams</span>
            <span className="sm:hidden">Business</span>
          </Link>
        </div>
      </div>
    </nav>;
};