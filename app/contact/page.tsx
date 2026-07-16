import { Instagram, Mail, MessageCircle, Phone } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ContactForm from '@/components/contact/ContactForm';

const contactRows = [
  { icon: Mail, label: 'Email', value: 'smartsavecooperative@gmail.com', href: 'mailto:smartsavecooperative@gmail.com' },
  { icon: Phone, label: 'Phone', value: '+234 903 421 4726', href: 'tel:+2349034214726' },
  { icon: MessageCircle, label: 'WhatsApp', value: '+234 901 019 8072', href: 'https://wa.me/2349010198072' },
  { icon: Instagram, label: 'Instagram', value: '@smartsavecoop', href: 'https://instagram.com/smartsavecoop' },
];

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-brand-alabaster text-brand-ink dark:bg-[#0A0A0A] dark:text-white">
      <Navbar />
      <main className="px-4 pb-24 pt-32">
        <section className="mx-auto max-w-3xl text-center">
          <p className="mb-5 text-xs font-black uppercase tracking-[0.24em] text-[#D4AF37]">Contact</p>
          <h1 className="text-4xl font-black tracking-tight sm:text-6xl">Get in Touch</h1>
          <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-zinc-600 dark:text-white/50">
            Have questions? We'd love to hear from you.
          </p>
        </section>

        <section className="mx-auto mt-14 grid max-w-5xl gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-2xl border border-brand-border bg-brand-ghost p-5 dark:border-white/[0.08] dark:bg-white/[0.035]">
            <h2 className="text-xl font-black">Contact Details</h2>
            <div className="mt-6 space-y-3">
              {contactRows.map((row) => (
                <a key={`${row.label}-${row.value}`} href={row.href} target={row.href.startsWith('http') ? '_blank' : undefined} rel={row.href.startsWith('http') ? 'noreferrer' : undefined} className="flex items-center gap-3 rounded-xl border border-brand-border bg-zinc-50 p-3 transition hover:border-[#D4AF37]/40 dark:border-white/10 dark:bg-white/[0.04]">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#D4AF37]/20 bg-[#D4AF37]/10 text-[#D4AF37]">
                    <row.icon size={18} />
                  </span>
                  <span>
                    <span className="block text-xs font-black uppercase tracking-widest text-zinc-500 dark:text-white/35">{row.label}</span>
                    <span className="mt-1 block text-sm font-bold">{row.value}</span>
                  </span>
                </a>
              ))}
            </div>
          </div>

          <ContactForm />
        </section>
      </main>
      <Footer />
    </div>
  );
}
