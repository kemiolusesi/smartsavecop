'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { Quote, MessageCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { useRef, useState, useEffect } from 'react';

// Exact Client Reviews Extracted from Fillout New form 185AJ results.csv
const realTestimonials = [
  { 
    id: 1, 
    name: "Charity Hanawa",
    role: "Entrepreneur",
    category: "Business Capital", 
    quote: "Saving to Open a Bread Bakery. It has helped me to Save and to always start a New Year with Financial Stability! Come join this platform it’s a Sure Plug and Transparency is top notch.", 
    tag: "Transparency", 
    color: "#D4AF37" 
  },
  { 
    id: 2, 
    name: "Anonymous Member", 
    role: "Civil Servant",
    category: "Personal Goals", 
    quote: "To save and achieve some personal and business goals. It has helped me to achieve a lot. Smart Save is the best and surest place to invest and save.", 
    tag: "Ease of Use", 
    color: "#8BC34A" 
  },
  { 
    id: 3, 
    name: "Godwin Abu",
    role: "Business Analysis Associate",
    category: "Emergency Fund", 
    quote: "My main goal when I joined smart save was to build an Alternative Emergency fund. But the active saving culture of the community has influenced me to transition into longer term projects! Being a member has made me more disciplined with my finances. Smart Save is a community of intentional savers, looking to build a better tomorrow.", 
    tag: "Transparency", 
    color: "#1E90FF" 
  },
  { 
    id: 4, 
    name: "Esther Chidimma Asimole",
    role: "Administrator",
    category: "Project Savings", 
    quote: "To save more to achieve certain projects. I have been able to save annually that has helped me meet certain financial needs. Smart save will help them save and teach them how to get rewards for their savings.", 
    tag: "Rewards", 
    color: "#D4AF37" 
  },
  { 
    id: 5, 
    name: "Anonymous Member", 
    role: "Verified Saver",
    category: "Yield & Returns", 
    quote: "To save money that will yield interest. It has made me to invest in things I had plans for. It's the best place to be if you have things to invest in.", 
    tag: "Interest Rates", 
    color: "#8BC34A" 
  },
  { 
    id: 6, 
    name: "Anonymous Member", 
    role: "Self Employed",
    category: "Business & Rent", 
    quote: "Saving for house rent and to also add to my business. It has impacted so in my business, I get to save money from the beginning of the year till the end. I have been using this platform for years now. I would recommend this platform for being transparent and ensuring prompt payment of ROI over the years.", 
    tag: "Transparency", 
    color: "#1E90FF" 
  },
  { 
    id: 7, 
    name: "Prince",
    role: "Accountant",
    category: "Goal Savings", 
    quote: "To save for a specific goal. It has taught me the importance of investment and I have been able to achieve a lot through savings. I will encourage them to join because it creates an avenue for savings.", 
    tag: "Investment", 
    color: "#D4AF37" 
  },
  { 
    id: 8, 
    name: "Nmaju Donald",
    role: "Tax Consultant",
    category: "Family Welfare", 
    quote: "It has helped me to be able to meet up with my family obligations like children school fees, house rent etc. It has helped tremendously in different ways. Smart save are worth trying and investing.", 
    tag: "Transparency", 
    color: "#8BC34A" 
  },
  { 
    id: 9, 
    name: "Judith",
    role: "Lawyer",
    category: "Asset Acquisition", 
    quote: "Saving for a property. I have been able to save money while earning. That their money is safe with smart save.", 
    tag: "Security", 
    color: "#1E90FF" 
  },
  { 
    id: 10, 
    name: "Anonymous Member", 
    role: "Business Owner",
    category: "Rent Funds", 
    quote: "To save money for my rent. It made me mindful of my spending. Safe place to save with interest.", 
    tag: "Mindful Saving", 
    color: "#D4AF37" 
  }
];

function VoiceCard({ voice }: { voice: typeof realTestimonials[0] }) {
  return (
    <div 
      className="group relative rounded-2xl border bg-brand-ghost p-5 sm:p-6 backdrop-blur-md transition-all duration-300 hover:shadow-sm flex flex-col justify-between text-left dark:bg-[#0A0A0A]/90 dark:hover:shadow-2xl"
      style={{
        borderColor: voice.color === '#D4AF37' ? 'rgba(212,175,55,0.16)' : voice.color === '#8BC34A' ? 'rgba(139,195,74,0.16)' : 'rgba(30,144,255,0.16)',
        boxShadow: `0 4px 20px ${voice.color}02`,
      }}
    >
      <div>
        <div className="flex gap-3 mb-4 items-center justify-between">
          <div className="flex items-center gap-2">
            <Quote size={14} style={{ color: voice.color }} className="opacity-40" />
            <span 
              className="text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider"
              style={{ color: voice.color, backgroundColor: `${voice.color}12` }}
            >
              {voice.category}
            </span>
          </div>
          <span className="text-[10px] font-medium font-mono opacity-60" style={{ color: voice.color }}>#{voice.tag}</span>
        </div>
        
        {/* Cleaned layout: Removed italics, softened font color for subtle look */}
        <p className="text-xs sm:text-sm font-normal leading-relaxed text-zinc-600 mb-5 tracking-wide dark:text-white/60">
          "{voice.quote}"
        </p>
      </div>
      
      <div className="flex items-center justify-between pt-4 border-t border-zinc-100 mt-auto dark:border-white/5">
        <div className="flex flex-col">
          <span className="text-xs font-medium text-brand-ink tracking-wide dark:text-white/80">{voice.name}</span>
          <span className="text-[10px] text-zinc-500 font-mono mt-0.5 dark:text-white/30">{voice.role}</span>
        </div>
        <div className="flex items-center gap-1.5 opacity-30">
          <MessageCircle size={11} className="text-brand-ink dark:text-white" />
          <span className="text-[9px] text-brand-ink font-mono uppercase tracking-wider dark:text-white">Verified</span>
        </div>
      </div>
    </div>
  );
}

export default function CommunityVoices() {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const [isDesktop, setIsDesktop] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const checkScreen = () => setIsDesktop(window.innerWidth >= 1024);
    checkScreen();
    window.addEventListener('resize', checkScreen);
    return () => window.removeEventListener('resize', checkScreen);
  }, []);

  const handleScroll = () => {
    if (!scrollRef.current || isDesktop) return;
    const { scrollLeft, clientWidth } = scrollRef.current;
    const index = Math.round(scrollLeft / clientWidth);
    setActiveIndex(index);
  };

  const scrollToColumn = (index: number) => {
    if (!scrollRef.current) return;
    const { clientWidth } = scrollRef.current;
    scrollRef.current.scrollTo({
      left: index * clientWidth,
      behavior: 'smooth'
    });
    setActiveIndex(index);
  };

  const nextColumn = () => {
    if (activeIndex < 2) scrollToColumn(activeIndex + 1);
  };

  const prevColumn = () => {
    if (activeIndex > 0) scrollToColumn(activeIndex - 1);
  };

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });

  const y1 = useTransform(scrollYProgress, [0, 1], [0, -120]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -20]); 
  const y3 = useTransform(scrollYProgress, [0, 1], [0, -160]);

  // Balanced column layout distribution
  const col1 = [realTestimonials[0], realTestimonials[3], realTestimonials[6], realTestimonials[9]];
  const col2 = [realTestimonials[1], realTestimonials[4], realTestimonials[7]];
  const col3 = [realTestimonials[2], realTestimonials[5], realTestimonials[8]];

  return (
    <section ref={containerRef} className="relative py-20 lg:py-32 bg-brand-alabaster text-brand-ink overflow-hidden dark:bg-gradient-to-b dark:from-[#0A0A0A] dark:to-[#111] dark:text-white">
      <style dangerouslySetInnerHTML={{__html: `
        .scrollbar-none::-webkit-scrollbar { display: none; }
        .scrollbar-none { -ms-overflow-style: none; scroll-width: none; }
      `}} />

      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] rounded-full opacity-[0.02] blur-[120px] bg-[#D4AF37] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center mb-12 lg:mb-24 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#D4AF37]/15 bg-[#D4AF37]/[0.06] text-xs font-medium text-brand-amber mb-6 dark:border-[#D4AF37]/20 dark:bg-[#D4AF37]/5 dark:text-[#D4AF37]">
            <MessageCircle size={12} />
            Verified Member Submissions
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-brand-ink tracking-tight mb-6 dark:text-white">
            Real Insights From Our{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] via-[#D4AF37] to-[#8BC34A]">
              Cooperative Community
            </span>
          </h2>
          <p className="text-zinc-600 text-sm sm:text-base max-w-xl mx-auto leading-relaxed dark:text-white/50">
            Direct feedback collected from form results, profiling financial growth milestones and verified cooperative experiences.
          </p>
        </div>

        {/* MASONRY COLUMNS CONTAINER */}
        <motion.div 
          ref={scrollRef}
          onScroll={handleScroll}
          initial={{ x: 0 }}
          animate={!isDesktop ? { x: [0, -25, 0] } : {}} 
          transition={{ delay: 1.2, duration: 0.7, ease: "easeInOut" }}
          className="flex lg:grid lg:grid-cols-3 gap-5 sm:gap-6 lg:gap-8 overflow-x-auto lg:overflow-visible snap-x snap-mandatory scrollbar-none pb-6 lg:pb-0 px-[8vw] lg:px-0"
        >
          
          {/* Column 1 */}
          <motion.div 
            style={{ y: isDesktop ? y1 : 0 }} 
            className="flex-shrink-0 w-[84vw] sm:w-[340px] lg:w-full flex flex-col space-y-5 sm:space-y-6 lg:space-y-8 snap-center"
          >
            {col1.map((voice) => (
              <VoiceCard key={voice.id} voice={voice} />
            ))}
          </motion.div>

          {/* Column 2 */}
          <motion.div 
            style={{ y: isDesktop ? y2 : 0 }} 
            className="flex-shrink-0 w-[84vw] sm:w-[340px] lg:w-full flex flex-col space-y-5 sm:space-y-6 lg:space-y-8 lg:pt-14 snap-center"
          >
            {col2.map((voice) => (
              <VoiceCard key={voice.id} voice={voice} />
            ))}
          </motion.div>

          {/* Column 3 */}
          <motion.div 
            style={{ y: isDesktop ? y3 : 0 }} 
            className="flex-shrink-0 w-[84vw] sm:w-[340px] lg:w-full flex flex-col space-y-5 sm:space-y-6 lg:space-y-8 snap-center"
          >
            {col3.map((voice) => (
              <VoiceCard key={voice.id} voice={voice} />
            ))}
          </motion.div>

        </motion.div>

        {/* SLIDER PAGINATION CONTROLS */}
        <div className="flex lg:hidden items-center justify-between max-w-[340px] mx-auto mt-6 px-2">
          <button 
            onClick={prevColumn}
            disabled={activeIndex === 0}
            className="p-2 rounded-full border border-brand-border bg-brand-ghost text-brand-ink disabled:opacity-20 disabled:pointer-events-none transition-all active:scale-95 dark:border-white/10 dark:bg-white/5 dark:text-white"
            aria-label="Previous page"
          >
            <ChevronLeft size={16} />
          </button>

          <div className="flex items-center gap-2.5">
            {[0, 1, 2].map((idx) => (
              <button
                key={idx}
                onClick={() => scrollToColumn(idx)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  activeIndex === idx ? 'w-6 bg-brand-amber dark:bg-[#D4AF37]' : 'w-1.5 bg-zinc-300 dark:bg-white/20'
                }`}
                aria-label={`Go to section view ${idx + 1}`}
              />
            ))}
          </div>

          <button 
            onClick={nextColumn}
            disabled={activeIndex === 2}
            className="p-2 rounded-full border border-brand-border bg-brand-ghost text-brand-ink disabled:opacity-20 disabled:pointer-events-none transition-all active:scale-95 dark:border-white/10 dark:bg-white/5 dark:text-white"
            aria-label="Next page"
          >
            <ChevronRight size={16} />
          </button>
        </div>

      </div>
    </section>
  );
}
