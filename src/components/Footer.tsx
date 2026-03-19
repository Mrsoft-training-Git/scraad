import { Link } from "react-router-dom";
import { BookOpen, ArrowUpRight } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="bg-foreground text-primary-foreground/80">
      <div className="container mx-auto px-4 py-10 lg:py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-secondary-foreground" />
              </div>
              <div>
                <div className="font-heading font-bold text-primary-foreground text-sm">ScraAd</div>
                <div className="text-[10px] text-primary-foreground/50">Scratch to Advance</div>
              </div>
            </Link>
            <p className="text-xs text-primary-foreground/50 leading-relaxed max-w-xs">
              Modern e-learning platform empowering professionals and organizations with industry-relevant skills. Go from scratch to advance.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-heading font-semibold text-primary-foreground text-xs uppercase tracking-wider mb-3">Platform</h4>
            <ul className="space-y-2">
              {[
                { to: "/courses", label: "Courses" },
                { to: "/programs", label: "Programs" },
                { to: "/career", label: "Careers" },
              ].map(link => (
                <li key={link.to}>
                  <Link to={link.to} className="text-sm text-primary-foreground/50 hover:text-primary-foreground transition-colors">{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-heading font-semibold text-primary-foreground text-xs uppercase tracking-wider mb-3">Company</h4>
            <ul className="space-y-2">
              {["About", "Contact", "Privacy Policy"].map(label => (
                <li key={label}>
                  <span className="text-sm text-primary-foreground/50 hover:text-primary-foreground transition-colors cursor-pointer">{label}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-heading font-semibold text-primary-foreground text-xs uppercase tracking-wider mb-3">Get Started</h4>
            <ul className="space-y-2">
              {[
                { to: "/auth", label: "Sign Up" },
                { to: "/auth", label: "Log In" },
                { to: "/signup/organization", label: "For Business" },
              ].map(link => (
                <li key={link.label}>
                  <Link to={link.to} className="text-sm text-primary-foreground/50 hover:text-primary-foreground transition-colors">{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-primary-foreground/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-primary-foreground/40">&copy; {new Date().getFullYear()} ScraAd. All rights reserved.</p>
          <p className="text-xs text-primary-foreground/30">Scratch to Advance</p>
        </div>
      </div>
    </footer>
  );
};