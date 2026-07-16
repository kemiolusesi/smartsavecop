import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Hero from '@/components/landing/Hero';
import RoiCalculator from '@/components/landing/RoiCalculator';
import RoiTable from '@/components/landing/RoiTable';
import Features from '@/components/landing/Features';
import CommunityVoices from '@/components/landing/CommunityVoices';
import FaqPreview from '@/components/landing/FaqPreview';
import FaqChatWidget from '@/components/shared/FaqChatWidget';

export default function Home() {
  return (
    <div className="min-h-screen bg-brand-alabaster text-brand-ink dark:bg-[#0A0A0A] dark:text-white">
      <Navbar />
      <main>
        <Hero />
        <RoiTable />
        <RoiCalculator />
        <CommunityVoices />
        <div id="features">
          <Features />
        </div>
        <FaqPreview />
      </main>
      <Footer />
      <FaqChatWidget />
    </div>
  );
}
