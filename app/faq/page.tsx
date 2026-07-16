import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import FaqPageClient from '@/components/faq/FaqPageClient';

export default function FaqPage() {
  return (
    <div className="min-h-screen bg-brand-alabaster text-brand-ink dark:bg-[#0A0A0A] dark:text-white">
      <Navbar />
      <main>
        <FaqPageClient />
      </main>
      <Footer />
    </div>
  );
}

