import { Facebook, Twitter, Instagram, Mail, Phone, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import logo from "@/assets/uniport-logo.png";

export const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 py-12">
        {/* Logo and Social */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-6">
            <img src={logo} alt="UNIPORT Logo" className="w-16 h-16 object-contain" />
            <div className="text-left">
              <div className="font-heading font-bold text-xl">
                Open Distance and e-Learning Centre
              </div>
              <div className="text-sm opacity-90">University of Port Harcourt</div>
            </div>
          </div>
          
          <h3 className="text-2xl font-heading font-bold mb-4">Connect with us</h3>
          <p className="mb-6 opacity-90">Visit our social media account, we will like to be in touch</p>
          
          <div className="flex justify-center gap-6">
            <a href="#" className="hover:text-accent transition-colors">
              <Twitter className="w-6 h-6" />
            </a>
            <a href="#" className="hover:text-accent transition-colors">
              <Facebook className="w-6 h-6" />
            </a>
            <a href="#" className="hover:text-accent transition-colors">
              <Instagram className="w-6 h-6" />
            </a>
          </div>
        </div>

        {/* Contact Information */}
        <div className="border-t border-primary-foreground/20 pt-12">
          <h3 className="text-2xl font-heading font-bold text-center mb-8">Contact us</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Main Campus */}
            <div>
              <div className="flex items-start gap-3 mb-3">
                <MapPin className="w-5 h-5 flex-shrink-0 mt-1" />
                <div>
                  <p className="text-sm opacity-90">F24/5, Chinua Worlu Drive, Off</p>
                  <p className="text-sm opacity-90">Abacha Road, GRA Phase 3, Port</p>
                  <p className="text-sm opacity-90">Harcourt, Nigeria.</p>
                </div>
              </div>
              <div className="flex items-center gap-3 mb-2">
                <Phone className="w-5 h-5" />
                <a href="tel:+2348030697250" className="text-sm hover:text-accent">+234 (8) 030697250</a>
              </div>
              <div className="flex items-center gap-3 mb-2">
                <Phone className="w-5 h-5" />
                <a href="tel:+2347010511998" className="text-sm hover:text-accent">+234 (7) 010511998</a>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 mt-1" />
                <div>
                  <a href="mailto:info@odel.uniport.edu.ng" className="text-sm hover:text-accent block">info@odel.uniport.edu.ng</a>
                  <a href="mailto:support@odel.uniport.edu.ng" className="text-sm hover:text-accent block">support@odel.uniport.edu.ng</a>
                </div>
              </div>
            </div>

            {/* Choba Campus */}
            <div>
              <div className="flex items-start gap-3 mb-3">
                <MapPin className="w-5 h-5 flex-shrink-0 mt-1" />
                <div>
                  <p className="text-sm opacity-90">University of Port Harcourt, P.M.B.</p>
                  <p className="text-sm opacity-90">5323, East-West Road, Choba, Port</p>
                  <p className="text-sm opacity-90">Harcourt, Nigeria</p>
                </div>
              </div>
              <div className="flex items-center gap-3 mb-2">
                <Phone className="w-5 h-5" />
                <a href="tel:+2348153239667" className="text-sm hover:text-accent">+234 (8) 153239667</a>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 mt-1" />
                <div>
                  <a href="mailto:info@odel.uniport.edu.ng" className="text-sm hover:text-accent block">info@odel.uniport.edu.ng</a>
                  <a href="mailto:support@odel.uniport.edu.ng" className="text-sm hover:text-accent block">support@odel.uniport.edu.ng</a>
                </div>
              </div>
            </div>

            {/* Lagos Office 1 */}
            <div>
              <div className="flex items-start gap-3 mb-3">
                <MapPin className="w-5 h-5 flex-shrink-0 mt-1" />
                <div>
                  <p className="text-sm opacity-90">University of Port Harcourt Liaison</p>
                  <p className="text-sm opacity-90">Office, 23 Bush Street Mende</p>
                  <p className="text-sm opacity-90">Maryland, Lagos, Nigeria.</p>
                </div>
              </div>
              <div className="flex items-center gap-3 mb-2">
                <Phone className="w-5 h-5" />
                <a href="tel:+2348023415448" className="text-sm hover:text-accent">+234 (8) 023415448</a>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 mt-1" />
                <div>
                  <a href="mailto:support@odel.uniport.edu.ng" className="text-sm hover:text-accent block">support@odel.uniport.edu.ng</a>
                  <a href="mailto:info@odel.uniport.edu.ng" className="text-sm hover:text-accent block">info@odel.uniport.edu.ng</a>
                </div>
              </div>
            </div>

            {/* Lagos Office 2 */}
            <div>
              <div className="flex items-start gap-3 mb-3">
                <MapPin className="w-5 h-5 flex-shrink-0 mt-1" />
                <div>
                  <p className="text-sm opacity-90">University of Port Harcourt Liaison</p>
                  <p className="text-sm opacity-90">Office, 23 Bush Street Mende</p>
                  <p className="text-sm opacity-90">Maryland, Lagos, Nigeria.</p>
                </div>
              </div>
              <div className="flex items-center gap-3 mb-2">
                <Phone className="w-5 h-5" />
                <a href="tel:+2348023415448" className="text-sm hover:text-accent">+234 (8) 023415448</a>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 mt-1" />
                <div>
                  <a href="mailto:info@odel.uniport.edu.ng" className="text-sm hover:text-accent block">info@odel.uniport.edu.ng</a>
                  <a href="mailto:support@odel.uniport.edu.ng" className="text-sm hover:text-accent block">support@odel.uniport.edu.ng</a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-primary-foreground/20 mt-12 pt-6 text-center text-sm opacity-75">
          <p>&copy; {new Date().getFullYear()} Open Distance and e-Learning Centre, University of Port Harcourt. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};
