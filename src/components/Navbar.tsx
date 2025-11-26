import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Search, Menu } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="bg-primary text-primary-foreground sticky top-0 z-50 shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center font-bold text-xl">
              ODEL
            </div>
            <div className="hidden md:block">
              <div className="font-heading font-bold text-lg leading-tight">
                Open Distance and e-Learning Centre
              </div>
              <div className="text-sm opacity-90">University of Port Harcourt</div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-6">
            <Link to="/" className="hover:text-accent transition-colors font-medium">
              Home
            </Link>
            <Link to="/online-degree" className="hover:text-accent transition-colors font-medium">
              Online Degree
            </Link>
            <Link to="/career" className="hover:text-accent transition-colors font-medium">
              Career
            </Link>
            
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search for courses"
                className="pl-10 w-64 bg-sidebar-accent border-sidebar-border text-sidebar-foreground placeholder:text-sidebar-foreground/60"
              />
            </div>

            <Button variant="outline" className="border-primary-foreground/20 hover:bg-primary-foreground/10 text-primary-foreground">
              Login
            </Button>
            <Button variant="default" className="bg-accent hover:bg-accent/90 text-accent-foreground">
              Sign Up
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="lg:hidden"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="lg:hidden pb-4 space-y-3">
            <Link to="/" className="block py-2 hover:text-accent transition-colors">
              Home
            </Link>
            <Link to="/online-degree" className="block py-2 hover:text-accent transition-colors">
              Online Degree
            </Link>
            <Link to="/career" className="block py-2 hover:text-accent transition-colors">
              Career
            </Link>
            <div className="pt-2 space-y-2">
              <Button variant="outline" className="w-full border-primary-foreground/20">
                Login
              </Button>
              <Button variant="default" className="w-full bg-accent hover:bg-accent/90">
                Sign Up
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Sign Up Options Bar */}
      <div className="bg-sidebar-accent text-foreground py-2 text-center text-sm">
        <div className="container mx-auto px-4 flex justify-center gap-6">
          <Link to="/signup/individual" className="hover:text-accent transition-colors font-medium">
            Sign up as an Individual
          </Link>
          <span className="text-muted-foreground">|</span>
          <Link to="/signup/organization" className="hover:text-accent transition-colors font-medium">
            Sign up as an Organization
          </Link>
        </div>
      </div>
    </nav>
  );
};
