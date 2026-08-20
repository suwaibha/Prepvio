import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import { Twitter, Instagram, Linkedin, MapPin, Mail, Phone, ArrowRight } from "lucide-react";
import TermsModal from "../components/TermsModal.jsx";
import TeamModal from "../components/TeamModal.jsx"; // ✅ Import TeamModal
import { useNavigate } from "react-router-dom";


/* ================================
   SINGLE SOURCE OF TRUTH (SCALABLE)
================================ */
const SOCIAL_LINKS = [
  {
    name: "Twitter",
    href: "https://www.reddit.com/u/begreatest/s/rteqAa7f87",
    Icon: Twitter,
  },
  {
    name: "Instagram",
    href: "https://www.instagram.com/swaroop_bhati.11",
    Icon: Instagram,
  },
  {
    name: "LinkedIn",
    href: "https://www.linkedin.com/in/swaroop-bhati-957a90249?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app",
    Icon: Linkedin,
  },
];

function Footer() {
  const location = useLocation();
  const isHomePage = location.pathname === "/";
  const [openTerms, setOpenTerms] = useState(false);
  const [openTeam, setOpenTeam] = useState(false); // ✅ Add state for TeamModal
  const navigate = useNavigate();


  /* ================================
      HOME PAGE → BIG FOOTER (LIGHT UI)
     ================================ */
  if (isHomePage) {
    return (
      <footer className="mt-10 bg-gradient-to-b from-white to-gray-50 border-t border-gray-100 pt-20 pb-10 rounded-t-[3.5rem] relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#D4F478]/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-50 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
          {/* TOP GRID */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-16">

            {/* BRANDING SECTION */}
            <div className="md:col-span-5">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-11 h-11 bg-black rounded-xl flex items-center justify-center overflow-hidden shadow-lg shadow-black/10">
                  <img src="/newuilogo1.png" alt="PrepVio Icon" className="w-full h-full object-cover" />
                </div>
                <div>
                  <img src="/prepvio (1).png" alt="PrepVio" className="h-8 w-auto object-contain" />
                </div>
              </div>
              <p className="text-gray-600 leading-relaxed mb-8 max-w-sm font-medium">
                Empowering interview readiness with AI-driven insights and real-world practice. Transform nervous energy into executive presence.
              </p>

              {/* SOCIAL LINKS */}
              <div className="flex gap-3">
                {SOCIAL_LINKS.map(({ name, href, Icon }) => (
                  <a
                    key={name}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={name}
                    className="w-11 h-11 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-black hover:text-white transition-all duration-300 hover:scale-110 shadow-sm"
                  >
                    <Icon className="w-5 h-5" />
                  </a>
                ))}
              </div>
            </div>

            {/* QUICK LINKS */}
            <div className="md:col-span-2">
              <h4 className="font-black text-gray-900 mb-6 text-sm uppercase tracking-wider">Quick Links</h4>
              <ul className="space-y-3.5">
                <li>
                  <button
                    onClick={() => navigate("/dashboard/feedback")}
                    className="text-gray-600 hover:text-black transition-colors font-medium text-sm flex items-center gap-2 group cursor-pointer"
                  >
                    <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 -ml-6 group-hover:ml-0 transition-all" />
                    Feedback
                  </button>

                </li>
                <li>
                  <button
                    onClick={() => setOpenTerms(true)}
                    className="text-gray-600 hover:text-black transition-colors font-medium text-sm flex items-center gap-2 group cursor-pointer"
                  >
                    <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 -ml-6 group-hover:ml-0 transition-all" />
                    Terms & Conditions
                  </button>
                </li>
              </ul>
            </div>

            {/* SUPPORT */}
            <div className="md:col-span-2">
              <h4 className="font-black text-gray-900 mb-6 text-sm uppercase tracking-wider">Support</h4>
              <ul className="space-y-3.5">
                <li>
                  <a href="#faqs" className="text-gray-600 hover:text-black transition-colors font-medium text-sm flex items-center gap-2 group">
                    <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 -ml-6 group-hover:ml-0 transition-all cursor-pointer" />
                    FAQs
                  </a>
                </li>
                <li>
                  <a href="#pricing" className="text-gray-600 hover:text-black transition-colors font-medium text-sm flex items-center gap-2 group">
                    <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 -ml-6 group-hover:ml-0 transition-all cursor-pointer" />
                    Pricing
                  </a>
                </li>
                <li>
                  {/* <button
                    onClick={() => setOpenTerms(true)}
                    className="text-gray-600 hover:text-black transition-colors font-medium text-sm flex items-center gap-2 group"
                  >
                    <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 -ml-6 group-hover:ml-0 transition-all" />
                    Privacy Policy
                  </button> */}
                </li>
              </ul>
            </div>

            {/* CONTACT */}
            <div className="md:col-span-3">
              <h4 className="font-black text-gray-900 mb-6 text-sm uppercase tracking-wider">Contact Us</h4>
              <ul className="space-y-4">
                <li className="flex items-start gap-3 text-gray-600 text-sm font-medium group hover:text-black transition-colors">
                  <MapPin className="w-5 h-5 text-gray-400 group-hover:text-black transition-colors flex-shrink-0 mt-0.5" />
                  <span>Bengaluru, Karnataka, India</span>
                </li>
                <li className="flex items-start gap-3 text-gray-600 text-sm font-medium group hover:text-black transition-colors">
                  <Mail className="w-5 h-5 text-gray-400 group-hover:text-black transition-colors flex-shrink-0 mt-0.5" />
                  <a href="mailto:prepvio.ai@gmail.com" className="hover:underline">
                    prepvio.ai@gmail.com
                  </a>
                </li>
                <li className="flex items-start gap-3 text-gray-600 text-sm font-medium group hover:text-black transition-colors">
                  <Phone className="w-5 h-5 text-gray-400 group-hover:text-black transition-colors flex-shrink-0 mt-0.5" />
                  <a href="tel:+917433877151" className="hover:underline">
                    +91 7433877151
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* BOTTOM BAR */}
          <div className="border-t border-gray-200 pt-8 flex justify-center items-center">
            <p className="text-sm text-gray-500 font-medium text-center">
              © 2026 PrepVio. All rights reserved.
            </p>
          </div>

        </div>

        {/* Modal */}
        <TermsModal isOpen={openTerms} onClose={() => setOpenTerms(false)} />
      </footer>
    );
  }

  /* ================================
      OTHER PAGES → SMALL FOOTER (UPDATED LIGHT UI)
     ================================ */
  return (
    <footer className="w-full mt-10 relative">
      <div className="absolute inset-x-0 bottom-0 h-full bg-gradient-to-t from-white via-white to-transparent pointer-events-none -z-10" />

      <div className="bg-white/80 backdrop-blur-xl border-t border-gray-100/50 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.03)] py-8 rounded-t-[2.5rem]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 md:gap-4">

            {/* BRAND */}
            <div className="flex items-center gap-3 group cursor-default">
              <div className="w-9 h-9 bg-black rounded-xl flex items-center justify-center overflow-hidden shadow-lg shadow-black/10 transition-transform group-hover:scale-105 duration-500">
                <img src="/newuilogo1.png" alt="Icon" className="w-full h-full object-cover" />
              </div>
              <div className="block opacity-90 group-hover:opacity-100 transition-opacity">
                <img src="/prepvio (1).png" alt="PrepVio" className="h-7 w-auto object-contain" />
              </div>
            </div>

            {/* COPYRIGHT */}
            <p className="text-xs font-medium text-gray-400 text-center md:text-left tracking-wide">
              © 2025 PrepVio. All rights reserved.
            </p>

            {/* SOCIAL LINKS */}
            <div className="flex items-center gap-3">
              {SOCIAL_LINKS.map(({ name, href, Icon }) => (
                <a
                  key={name}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={name}
                  className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-50 text-gray-400 hover:bg-black hover:text-white hover:scale-110 active:scale-95 transition-all duration-300 shadow-sm hover:shadow-lg hover:shadow-black/20"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ✅ Adding Modals here too so they work on other pages */}
      <TermsModal isOpen={openTerms} onClose={() => setOpenTerms(false)} />
      <TeamModal isOpen={openTeam} onClose={() => setOpenTeam(false)} />
    </footer>
  );
}

export default Footer;