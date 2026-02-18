import { Facebook, Twitter, Instagram, Mail, Phone, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import logo from "@/assets/uniport-logo.png";

export const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 py-8 md:py-12">
        {/* Logo and Social */}
        



























        {/* Copyright */}
        <div className="border-t border-primary-foreground/20 mt-8 md:mt-12 pt-6 text-center text-xs md:text-sm opacity-75">
          <p>&copy; {new Date().getFullYear()} Open Distance and e-Learning Centre, University of Port Harcourt. All rights reserved.</p>
        </div>
      </div>
    </footer>);

};