import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import mrsoftLogo from "@/assets/mrsoft-logo.jpeg";
import scraadLogoOfficial from "@/assets/scraad-logo-official.png";

export const Footer = () => {
  return (
    <footer className="bg-foreground text-primary-foreground/80">
      <div className="container mx-auto px-4 py-10 lg:py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="inline-flex flex-col items-start leading-none mb-3 bg-white rounded-lg px-2.5 py-2">
              <img src={scraadLogoOfficial} alt="ScraAD" className="h-7 w-auto object-contain" />
              <div className="text-[9px] text-foreground/60 tracking-[0.18em] uppercase mt-1">
                Scratch to Advance
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
              { to: "/career", label: "Careers" }].
              map((link) =>
              <li key={link.to}>
                  <Link to={link.to} className="text-sm text-primary-foreground/50 hover:text-primary-foreground transition-colors">{link.label}</Link>
                </li>
              )}
            </ul>
          </div>
          <div>
            <h4 className="font-heading font-semibold text-primary-foreground text-xs uppercase tracking-wider mb-3">Company</h4>
            <ul className="space-y-2">
              {["About", "Contact", "Privacy Policy"].map((label) =>
              <li key={label}>
                  <span className="text-sm text-primary-foreground/50 hover:text-primary-foreground transition-colors cursor-pointer">{label}</span>
                </li>
              )}
            </ul>
          </div>
          <div>
            <h4 className="font-heading font-semibold text-primary-foreground text-xs uppercase tracking-wider mb-3">Get Started</h4>
            <ul className="space-y-2">
              {[
              { to: "/auth", label: "Sign Up" },
              { to: "/auth", label: "Log In" },
              { to: "/signup/organization", label: "For Business" }].
              map((link) =>
              <li key={link.label}>
                  <Link to={link.to} className="text-sm text-primary-foreground/50 hover:text-primary-foreground transition-colors">{link.label}</Link>
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="border-t border-primary-foreground/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-primary-foreground/40">&copy; {new Date().getFullYear()} ScraAd. All rights reserved.</p>
          <div className="flex items-center gap-2">
            <span className="text-xs text-primary-foreground/40">Product of</span>
            <a
              href="https://m-rinternational.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white rounded-md px-2 py-1 flex items-center hover:opacity-90 transition-opacity"
              aria-label="MRsoft - Visit M-R International website"
            >
              <img src={mrsoftLogo} alt="MRsoft" className="h-5 w-auto object-contain" />
            </a>
          </div>
        </div>
      </div>
    </footer>);

};