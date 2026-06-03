'use client';

import { useState } from 'react';
import { Mail, Linkedin, Twitter, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Footer() {
  const [showAboutModal, setShowAboutModal] = useState(false);
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative border-t border-white/[0.08] bg-[#0A0A0A] px-4 py-16">
      <div className="max-w-5xl mx-auto">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div>
            <p className="text-sm font-bold text-white mb-2">Smart Save Cooperative</p>
            <p className="text-xs text-white/40 leading-relaxed">
              Building generational wealth through transparent coporate savings. <br/> CAC registered. NDIC insured.
            </p>
          </div>

          {/* Product */}
          <div>
            <p className="text-xs font-semibold text-white/60 uppercase tracking-widest mb-4">Product</p>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-sm text-white/40 hover:text-white transition-colors">
                  Savings Plans
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-white/40 hover:text-white transition-colors">
                  ROI Calculator
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-white/40 hover:text-white transition-colors">
                  Pricing
                </a>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <p className="text-xs font-semibold text-white/60 uppercase tracking-widest mb-4">Company</p>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => setShowAboutModal(true)}
                  className="text-sm text-white/40 hover:text-white transition-colors cursor-pointer"
                >
                  About
                </button>
              </li>
              <li>
                <a href="#" className="text-sm text-white/40 hover:text-white transition-colors">
                  Career
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-white/40 hover:text-white transition-colors">
                  Contact
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <p className="text-xs font-semibold text-white/60 uppercase tracking-widest mb-4">Legal</p>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-sm text-white/40 hover:text-white transition-colors">
                  Privacy
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-white/40 hover:text-white transition-colors">
                  Terms
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-white/40 hover:text-white transition-colors">
                  Compliance
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-white/[0.08] pt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          {/* Copyright */}
          <p className="text-xs text-white/30">
            © {currentYear} Smart Save Cooperative. All rights reserved. Built with impact.
          </p>

          {/* Social */}
          <div className="flex items-center gap-4">
            <a
              href="#"
              className="w-9 h-9 rounded-lg border border-white/[0.1] bg-white/[0.03] flex items-center justify-center text-white/40 hover:text-white hover:border-white/20 transition-all"
            >
              <Mail size={14} />
            </a>
            <a
              href="#"
              className="w-9 h-9 rounded-lg border border-white/[0.1] bg-white/[0.03] flex items-center justify-center text-white/40 hover:text-white hover:border-white/20 transition-all"
            >
              <Twitter size={14} />
            </a>
            <a
              href="#"
              className="w-9 h-9 rounded-lg border border-white/[0.1] bg-white/[0.03] flex items-center justify-center text-white/40 hover:text-white hover:border-white/20 transition-all"
            >
              <Linkedin size={14} />
            </a>
          </div>
        </div>
      </div>

      {/* About Us Modal */}
      <AnimatePresence>
        {showAboutModal && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAboutModal(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', duration: 0.3 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="relative w-full max-w-2xl max-h-[85vh] rounded-2xl border-[1px] border-white/[0.1] bg-[#0F0F0F] backdrop-blur-xl overflow-hidden shadow-2xl">
                {/* Close Button */}
                <button
                  onClick={() => setShowAboutModal(false)}
                  className="absolute top-6 right-6 z-10 w-8 h-8 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all"
                >
                  <X size={18} />
                </button>

                {/* Content */}
                <div className="overflow-y-auto h-full">
                  <div className="p-8 sm:p-12 space-y-6">
                    {/* Title */}
                    <div className="space-y-2 pr-8">
                      <h2 className="text-3xl sm:text-4xl font-bold text-white">
                        About Smart Save Cooperative Society
                      </h2>
                      <div className="w-12 h-1 bg-gradient-to-r from-[#D4AF37] to-[#9DC03A] rounded-full" />
                    </div>

                    {/* Body Text */}
                    <div className="space-y-4 text-white/70 leading-relaxed">
                      <p>
                        Smart Save Cooperative Society is a trusted financial and empowerment organization committed to helping individuals, families, and businesses achieve financial stability and sustainable growth through disciplined savings, accessible loans, and investment opportunities.
                      </p>

                      <p>
                        Founded on the principles of trust, transparency, and financial inclusion, we provide our members with secure and flexible savings plans tailored to meet different financial goals. From daily and monthly savings to targeted investment plans, we are dedicated to helping our members build wealth and achieve their personal and business aspirations.
                      </p>

                      <p>
                        At Smart Save Cooperative Society, we understand the importance of access to financial support. That is why we offer affordable loan facilities designed to support businesses, education, personal development, and emergency needs with convenient repayment structures.
                      </p>

                      <p>
                        Beyond savings and loans, we are passionate about improving lives by creating opportunities for economic empowerment, entrepreneurship, and financial discipline. We also support members in achieving their dreams through cooperative-based financing solutions, including solar and electronics financing opportunities.
                      </p>

                      <p>
                        Our commitment is to provide reliable financial solutions with professionalism, integrity, and excellent customer service while building a strong community of financially empowered members.
                      </p>
                    </div>

                    {/* Closing Quote */}
                    <div className="pt-6 border-t border-white/10">
                      <p className="text-lg sm:text-xl italic text-[#D4AF37] leading-relaxed font-light">
                        "At Smart Save Cooperative Society, your future matters to us because we believe that small consistent steps today can create lasting financial success tomorrow."
                      </p>
                    </div>

                    {/* Trust Badges */}
                    <div className="pt-6 grid grid-cols-3 gap-4">
                      <div className="p-4 rounded-lg bg-white/[0.03] border border-white/[0.08] text-center">
                        <div className="text-xs font-semibold text-[#D4AF37] uppercase tracking-wider">SEC</div>
                        <div className="text-xs text-white/50 mt-1">Regulated</div>
                      </div>
                      <div className="p-4 rounded-lg bg-white/[0.03] border border-white/[0.08] text-center">
                        <div className="text-xs font-semibold text-[#D4AF37] uppercase tracking-wider">NDIC</div>
                        <div className="text-xs text-white/50 mt-1">Insured</div>
                      </div>
                      <div className="p-4 rounded-lg bg-white/[0.03] border border-white/[0.08] text-center">
                        <div className="text-xs font-semibold text-[#D4AF37] uppercase tracking-wider">Trusted</div>
                        <div className="text-xs text-white/50 mt-1">Since 2018</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </footer>
  );
}
