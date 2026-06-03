import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Hero from '@/components/landing/Hero';
import RoiCalculator from '@/components/landing/RoiCalculator';
import RoiTable from '@/components/landing/RoiTable';
import Features from '@/components/landing/Features';
import CommunityVoices from '@/components/landing/CommunityVoices';

export default function Home() {
  return (
    <div className="bg-[#0A0A0A] text-white">
      <Navbar />
      <main>
        <Hero />
        <RoiTable />
        <RoiCalculator />
        <CommunityVoices />
        <div id="features">
          <Features />
        </div>
      </main>
      <Footer />
    </div>
  );
}
