import { Facebook, Twitter, Instagram, Mail, Phone, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import logo from "@/assets/uniport-logo.png";

export const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 py-8 md:py-12">
        {/* Logo and Social */}
        <div className="text-center mb-8 md:mb-12">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
            <img src={logo} alt="UNIPORT Logo" className="w-12 h-12 md:w-16 md:h-16 object-contain" />
            <div className="text-center sm:text-left">
              <div className="font-heading font-bold text-lg md:text-xl">
                Open Distance and e-Learning Centre
              </div>
              <div className="text-sm opacity-90">University of Port Harcourt</div>
            </div>
          </div>
          
          <h3 className="text-xl md:text-2xl font-heading font-bold mb-4">Connect with us</h3>
          <p className="mb-6 opacity-90 text-sm md:text-base">Visit our social media account, we will like to be in touch</p>
          
          <div className="flex justify-center gap-6">
            <a href="#" className="hover:text-accent transition-colors">
              <Twitter className="w-5 h-5 md:w-6 md:h-6" />
            </a>
            <a href="#" className="hover:text-accent transition-colors">
              <Facebook className="w-5 h-5 md:w-6 md:h-6" />
            </a>
            <a href="#" className="hover:text-accent transition-colors">
              <Instagram className="w-5 h-5 md:w-6 md:h-6" />
            </a>
          </div>
        </div>


        {/* Copyright */}
        <div className="border-t border-primary-foreground/20 mt-8 md:mt-12 pt-6 text-center text-xs md:text-sm opacity-75">
          <p>&copy; {new Date().getFullYear()} Open Distance and e-Learning Centre, University of Port Harcourt. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};