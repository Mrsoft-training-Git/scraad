import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Menu, X, Search, ChevronDown, Home, BookOpen, GraduationCap, Briefcase } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/scraad-logo-official.png";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const location = useLocation();
  const navigate = useNavigate();

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

  useEffect(() => {
    if (searchOpen) {
      // focus next tick so the input is mounted
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [searchOpen]);

  const navLinks = [
    { to: "/", label: "Home", icon: Home, description: "Back to homepage" },
    { to: "/courses", label: "Courses", icon: BookOpen, description: "Browse all courses" },
    { to: "/programs", label: "Programs", icon: GraduationCap, description: "Advanced training programs" },
    { to: "/career", label: "Career", icon: Briefcase, description: "Join our team" },
  ];

  const isActive = (path: string) => location.pathname === path;
  const currentLabel = navLinks.find((l) => isActive(l.to))?.label;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/courses?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
      setSearchOpen(false);
      setIsMenuOpen(false);
    }
  };

  return (
    <nav
      className={cn(
        "bg-card/95 backdrop-blur-xl border-b border-border sticky top-0 z-50 transition-all duration-300",
        scrolled ? "shadow-sm" : ""
      )}
    >
      <div className="container mx-auto px-4">
        <div className={cn("flex items-center justify-between gap-3 transition-all duration-300", scrolled ? "h-14" : "h-16")}>
          {/* Logo */}
          <Link to="/" className="flex flex-col items-start leading-none group flex-shrink-0">
            <img
              src={logo}
              alt="ScraAD"
              className={cn("object-contain w-auto transition-all duration-300", scrolled ? "h-7" : "h-8")}
            />
            <div className="text-[9px] text-muted-foreground tracking-[0.18em] uppercase mt-1 pl-0.5">
              Scratch to Advance
            </div>
          </Link>

          {/* Desktop: Explore dropdown */}
          <div className="hidden lg:flex items-center gap-1 flex-shrink-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className={cn(
                    "h-9 px-3.5 text-sm font-medium gap-1.5 rounded-lg",
                    "text-foreground hover:bg-muted/60 hover:text-foreground",
                    "data-[state=open]:bg-muted/80"
                  )}
                >
                  Explore
                  {currentLabel && (
                    <span className="text-muted-foreground font-normal">
                      <span className="mx-1">/</span>
                      {currentLabel}
                    </span>
                  )}
                  <ChevronDown className="w-4 h-4 opacity-70 transition-transform" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-64 p-1.5">
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  const active = isActive(link.to);
                  return (
                    <DropdownMenuItem
                      key={link.to}
                      asChild
                      className={cn(
                        "px-2.5 py-2 rounded-md cursor-pointer gap-3",
                        active && "bg-primary/8 text-primary focus:bg-primary/10 focus:text-primary"
                      )}
                    >
                      <Link to={link.to} className="flex items-start gap-3">
                        <span
                          className={cn(
                            "mt-0.5 w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0",
                            active
                              ? "bg-primary/15 text-primary"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          <Icon className="w-4 h-4" />
                        </span>
                        <span className="flex flex-col min-w-0">
                          <span className="text-sm font-medium leading-tight">{link.label}</span>
                          <span className="text-xs text-muted-foreground leading-tight mt-0.5">
                            {link.description}
                          </span>
                        </span>
                      </Link>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Spacer pushes search + actions to the right */}
          <div className="flex-1" />

          {/* Search — collapsed icon that expands inline (desktop) */}
          <div className="hidden md:flex items-center">
            {!searchOpen ? (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSearchOpen(true)}
                className="h-9 w-9 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/60"
                aria-label="Open search"
              >
                <Search className="w-4 h-4" />
              </Button>
            ) : (
              <form onSubmit={handleSearch} className="flex items-center">
                <div className="relative animate-in slide-in-from-right-2 fade-in duration-200">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <Input
                    ref={searchInputRef}
                    type="search"
                    placeholder="Search courses..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onBlur={() => {
                      if (!searchQuery) setSearchOpen(false);
                    }}
                    className="pl-9 pr-3 h-9 w-56 lg:w-64 rounded-full bg-muted/60 border-transparent focus-visible:bg-card focus-visible:border-border focus-visible:ring-1 focus-visible:ring-secondary/50 text-sm"
                    aria-label="Search courses and programs"
                  />
                </div>
              </form>
            )}
          </div>

          {/* Right side actions */}
          <div className="hidden lg:flex items-center gap-2 flex-shrink-0 ml-2">
            {isAuthenticated ? (
              <Button className="h-9 bg-primary hover:bg-accent text-primary-foreground font-semibold shadow-sm magnetic-btn" asChild>
                <Link to="/dashboard">Dashboard</Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" className="h-9 text-foreground hover:text-primary font-medium" asChild>
                  <Link to="/auth">Log in</Link>
                </Button>
                <Button className="h-9 bg-primary hover:bg-accent text-primary-foreground font-semibold shadow-sm magnetic-btn" asChild>
                  <Link to="/auth">Sign Up Free</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile: search icon + menu */}
          <div className="flex lg:hidden items-center gap-1 flex-shrink-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMenuOpen(true)}
              className="h-9 w-9 rounded-full text-muted-foreground hover:text-foreground md:hidden"
              aria-label="Search"
            >
              <Search className="w-4 h-4" />
            </Button>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="lg:hidden pb-4 space-y-1 border-t border-border pt-3">
            {/* Mobile search */}
            <form onSubmit={handleSearch} className="mb-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input
                  type="search"
                  placeholder="Search courses, programs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-10 rounded-full bg-muted/60 border-transparent text-sm"
                  aria-label="Search courses and programs"
                />
              </div>
            </form>

            <div className="px-1 pb-1 text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
              Explore
            </div>
            {navLinks.map((link) => {
              const Icon = link.icon;
              const active = isActive(link.to);
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setIsMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    active
                      ? "text-primary bg-primary/8"
                      : "text-foreground hover:bg-muted/60"
                  )}
                >
                  <span
                    className={cn(
                      "w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0",
                      active ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                  </span>
                  {link.label}
                </Link>
              );
            })}

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
