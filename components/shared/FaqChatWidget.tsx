'use client';

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Mic, Send, UserCircle2, X } from 'lucide-react';

type ChatMessage = {
  id: number;
  role: 'bot' | 'user';
  text: string;
  suggestions?: string[];
};

type FaqMatch = {
  keywords: string[];
  answer: string;
  topic: 'join' | 'member' | 'security' | 'savings' | 'loan' | 'returns' | 'withdraw' | 'minimum' | 'invest' | 'guarantor' | 'approval' | 'documents' | 'contact' | 'benefit' | 'greeting';
};

const faqs: FaqMatch[] = [
  {
    keywords: ['join', 'register', 'become member', 'sign up'],
    topic: 'join',
    answer:
      "To join Smart Save Cooperative, complete a membership application, submit your ID documents, and pay the ₦5,000 registration fee plus minimum savings contribution. You'll get access to your member dashboard after onboarding.",
  },
  {
    keywords: ['who can', 'eligible', 'qualify'],
    topic: 'member',
    answer:
      'Membership is open to individuals, business owners, professionals, salary earners, and retirees who meet our registration requirements.',
  },
  {
    keywords: ['safe', 'secure', 'trust', 'money safe'],
    topic: 'security',
    answer:
      "Yes - members' funds are managed in accordance with cooperative regulations, internal control policies, and approved financial management procedures.",
  },
  {
    keywords: ['savings', 'save', 'products'],
    topic: 'savings',
    answer:
      "We offer Regular Savings, Target Savings, Children's Education Savings, Housing Savings Scheme, Fixed Savings/Investment Plans, and Retirement Savings Plans.",
  },
  {
    keywords: ['loan', 'borrow', 'credit', 'financing'],
    topic: 'loan',
    answer:
      'We offer Normal Loans (10%/month), Special Loans (15%/month), Products Loans (20%/month), Electronics Loans (3%/month up to 12 months), and Festival Loans (10%/month). All require a guarantor.',
  },
  {
    keywords: ['interest', 'return', 'earn', 'dividend'],
    topic: 'returns',
    answer:
      "Eligible savings and investment products attract annual dividends, interest, or returns as approved by the Cooperative's Management and General Meeting.",
  },
  {
    keywords: ['withdraw', 'take out', 'access my money'],
    topic: 'withdraw',
    answer:
      'Withdrawal conditions depend on your savings product. Flexible savings allow withdrawals anytime, while fixed plans have specified maturity periods.',
  },
  {
    keywords: ['how much', 'minimum', 'contribute'],
    topic: 'minimum',
    answer:
      'You can save according to your financial capacity, subject to the minimum contribution requirements of your selected savings plan.',
  },
  {
    keywords: ['invest', 'investment', 'fixed deposit'],
    topic: 'invest',
    answer:
      'Members can participate in Fixed Deposit plans earning 1-2% monthly depending on amount (₦50K-₦5M range), plus Share Capital, Housing Scheme, and Target Savings investments.',
  },
  {
    keywords: ['guarantor', 'guarantee'],
    topic: 'guarantor',
    answer:
      'Most loan products require at least one guarantor. Some secured loans may accept savings, investments, or collateral instead.',
  },
  {
    keywords: ['approval', 'how long', 'processing'],
    topic: 'approval',
    answer:
      'Most loan applications are processed within a few working days, subject to document completeness and compliance with requirements.',
  },
  {
    keywords: ['documents', 'id', 'required', 'kyc'],
    topic: 'documents',
    answer:
      "You'll need a valid ID, passport photograph, proof of address, phone number, email address, and guarantor information where applicable.",
  },
  {
    keywords: ['contact', 'support', 'help', 'email'],
    topic: 'contact',
    answer:
      'You can reach us via email at smartsavecooperative@gmail.com, through the support section in your member dashboard, or via our social media channels.',
  },
  {
    keywords: ['why', 'benefit', 'advantage'],
    topic: 'benefit',
    answer:
      'Smart Save offers secure savings, affordable loans, flexible investments, wealth creation opportunities, and member-focused financial empowerment.',
  },
  {
    keywords: ['hello', 'hi', 'hey'],
    topic: 'greeting',
    answer:
      "Hello! I'm here to help with any questions about Smart Save Cooperative - savings, loans, investments, or membership. What would you like to know?",
  },
];

const fallbackAnswer =
  "I don't have a specific answer for that. Visit our FAQ page for more topics, or contact us at smartsavecooperative@gmail.com.";

const topicSuggestions: Record<FaqMatch['topic'] | 'fallback', string[]> = {
  join: ['Who can become a member?', 'What documents are required?', 'Is my money safe?'],
  member: ['How do I join?', 'What documents are required?', 'Why choose Smart Save?'],
  security: ['What savings products do you offer?', 'Can I withdraw anytime?', 'How do dividends work?'],
  savings: ['Can I withdraw my savings?', 'Do savings earn returns?', 'How much can I save?'],
  loan: ['Do I need a guarantor?', 'How long does approval take?', 'What loan rates apply?'],
  returns: ['Can I invest?', 'What savings products exist?', 'How are dividends shared?'],
  withdraw: ['Do savings earn returns?', 'What savings products exist?', 'How much can I save?'],
  minimum: ['How do I join?', 'What savings products exist?', 'Can I invest?'],
  invest: ['Do investments earn returns?', 'Can I withdraw anytime?', 'Why choose Smart Save?'],
  guarantor: ['What loan rates apply?', 'How long does approval take?', 'Can I borrow?'],
  approval: ['Do I need a guarantor?', 'What documents are required?', 'What loans are available?'],
  documents: ['How do I join?', 'Who can become a member?', 'How long does approval take?'],
  contact: ['How do I join?', 'Is my money safe?', 'What services do you offer?'],
  benefit: ['Is my money safe?', 'Can I invest?', 'What loans are available?'],
  greeting: ['How do I join?', 'What savings products exist?', 'Can I get a loan?'],
  fallback: ['How do I join?', 'What loans are available?', 'Contact support'],
};

function getFaqResponse(input: string) {
  const normalized = input.toLowerCase();
  const match = faqs.find((faq) => faq.keywords.some((keyword) => normalized.includes(keyword)));

  if (!match) {
    return { answer: fallbackAnswer, suggestions: topicSuggestions.fallback };
  }

  return { answer: match.answer, suggestions: topicSuggestions[match.topic] };
}

export default function FaqChatWidget() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showGreeting, setShowGreeting] = useState(false);
  const [closingGreeting, setClosingGreeting] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      role: 'bot',
      text: "Hi there, I'm Emon, Smart Save AI Assistant. Ask me about membership, savings, loans, or investments.",
      suggestions: ['How do I join?', 'Can I get a loan?', 'Is my money safe?'],
    },
  ]);
  const widgetRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<HTMLDivElement>(null);
  const greetingShowTimer = useRef<number | null>(null);
  const greetingHideTimer = useRef<number | null>(null);
  const greetingCloseTimer = useRef<number | null>(null);
  const nextId = useRef(2);

  const latestSuggestions = useMemo(() => {
    const latestBotMessage = [...messages].reverse().find((message) => message.role === 'bot');
    return latestBotMessage?.suggestions || [];
  }, [messages]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!widgetRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handlePointerDown);
    }

    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [isOpen]);

  useEffect(() => {
    messagesRef.current?.scrollTo({ top: messagesRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isTyping, isOpen]);

  useEffect(() => {
    if (pathname !== '/' || typeof window === 'undefined') return;
    if (window.sessionStorage.getItem('smartsave_greeting_shown') === 'true') return;

    greetingShowTimer.current = window.setTimeout(() => {
      window.sessionStorage.setItem('smartsave_greeting_shown', 'true');
      setShowGreeting(true);
      setClosingGreeting(false);

      greetingHideTimer.current = window.setTimeout(() => {
        dismissGreeting();
      }, 10000);
    }, 1000);

    return () => {
      if (greetingShowTimer.current) window.clearTimeout(greetingShowTimer.current);
      if (greetingHideTimer.current) window.clearTimeout(greetingHideTimer.current);
      if (greetingCloseTimer.current) window.clearTimeout(greetingCloseTimer.current);
    };
  }, [pathname]);

  useEffect(() => {
    if (!showGreeting || isOpen || typeof window === 'undefined') return;

    function handleScroll() {
      dismissGreeting();
    }

    window.addEventListener('scroll', handleScroll, { passive: true, once: true });

    return () => window.removeEventListener('scroll', handleScroll);
  }, [showGreeting, isOpen]);

  function dismissGreeting() {
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem('smartsave_greeting_shown', 'true');
    }
    if (greetingShowTimer.current) window.clearTimeout(greetingShowTimer.current);
    if (greetingHideTimer.current) window.clearTimeout(greetingHideTimer.current);
    setClosingGreeting(true);
    greetingCloseTimer.current = window.setTimeout(() => {
      setShowGreeting(false);
      setClosingGreeting(false);
    }, 300);
  }

  const submitQuestion = (question: string) => {
    const trimmed = question.trim();
    if (!trimmed || isTyping) return;

    const response = getFaqResponse(trimmed);
    setInput('');
    setMessages((current) => [
      ...current,
      { id: nextId.current++, role: 'user', text: trimmed },
    ]);
    setIsTyping(true);

    window.setTimeout(() => {
      setMessages((current) => [
        ...current,
        {
          id: nextId.current++,
          role: 'bot',
          text: response.answer,
          suggestions: response.suggestions,
        },
      ]);
      setIsTyping(false);
    }, 900);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    submitQuestion(input);
  };

  const toggleAssistant = () => {
    if (showGreeting || pathname === '/') {
      dismissGreeting();
    }
    setIsOpen((current) => !current);
  };

  return (
    <div ref={widgetRef} className="fixed bottom-6 right-6 z-[120] font-sans">
      {isOpen && (
        <section className="mb-4 flex h-[480px] w-[calc(100vw-2.5rem)] max-w-[380px] flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0A0A0A] text-white shadow-2xl shadow-black/40">
          <header className="flex items-center justify-between border-b border-white/[0.08] px-4 py-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-[#9DC03A] shadow-[0_0_12px_rgba(157,192,58,0.75)]" />
                <h2 className="text-sm font-black">Emon</h2>
              </div>
              <p className="mt-1 text-xs text-white/40">Online and ready to help</p>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-white/45 transition hover:text-white"
              aria-label="Close FAQ assistant"
            >
              <X size={16} />
            </button>
          </header>

          <div ref={messagesRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-6 ${
                    message.role === 'user'
                      ? 'bg-[#D4AF37] text-[#0A0A0A]'
                      : 'border border-white/[0.08] bg-white/[0.055] text-white/75'
                  }`}
                >
                  {message.text}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="flex items-center gap-1 rounded-2xl border border-white/[0.08] bg-white/[0.055] px-4 py-3">
                  {[0, 1, 2].map((index) => (
                    <span
                      key={index}
                      className="h-2 w-2 animate-bounce rounded-full bg-[#D4AF37]"
                      style={{ animationDelay: `${index * 120}ms` }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {latestSuggestions.length > 0 && (
            <div className="border-t border-white/[0.08] px-4 py-3">
              <div className="flex gap-2 overflow-x-auto pb-1">
                {latestSuggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => submitQuestion(suggestion)}
                    disabled={isTyping}
                    className="shrink-0 rounded-full border border-[#D4AF37]/25 bg-[#D4AF37]/10 px-3 py-1.5 text-xs font-bold text-[#D4AF37] transition hover:bg-[#D4AF37]/15 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex gap-2 border-t border-white/[0.08] p-4">
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask a question..."
              className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/[0.055] px-3 py-3 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-[#D4AF37]/50 focus:ring-2 focus:ring-[#D4AF37]/10"
            />
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#D4AF37] text-[#0A0A0A] transition hover:bg-[#F5D06B] disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Send question"
            >
              <Send size={17} />
            </button>
          </form>
        </section>
      )}

      {showGreeting && !isOpen && (
        <div
          className={`absolute bottom-[calc(100%+14px)] right-0 w-[min(280px,calc(100vw-3rem))] rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm leading-5 text-black shadow-xl shadow-zinc-900/15 transition duration-300 dark:border-white/10 dark:bg-[#111] dark:text-white ${
            closingGreeting ? 'translate-y-2 opacity-0' : 'translate-y-0 opacity-100 animate-[smartsave-greeting-in_0.3s_ease-out]'
          }`}
        >
          Hi, I am Emon, nice to meet you.
          <span className="absolute -bottom-2 right-6 h-4 w-4 rotate-45 border-b border-r border-zinc-200 bg-white dark:border-white/10 dark:bg-[#111]" />
        </div>
      )}

      <div className="group relative ml-auto flex justify-end">
        {!isOpen && (
          <span className="pointer-events-none absolute bottom-[calc(100%+8px)] right-0 whitespace-nowrap rounded-lg border border-brand-border bg-white px-2.5 py-1.5 text-xs font-semibold text-brand-ink opacity-0 shadow-xl shadow-zinc-900/10 transition group-hover:opacity-100 group-focus-within:opacity-100 dark:border-white/10 dark:bg-[#111] dark:text-white">
            Need help?
          </span>
        )}
        <button
          type="button"
          onClick={toggleAssistant}
          className="relative inline-flex items-center justify-center gap-2 rounded-full border-0 bg-[#D4AF37] p-4 text-black shadow-[0_4px_20px_rgba(212,160,23,0.5)] transition duration-200 ease-out hover:scale-105 hover:shadow-[0_8px_28px_rgba(212,160,23,0.65)] active:scale-95 md:rounded-[50px] md:px-5 md:py-3"
          aria-label={isOpen ? 'Close FAQ assistant' : 'Open FAQ assistant'}
          aria-expanded={isOpen}
        >
          <span className="relative inline-flex h-6 w-6 items-center justify-center">
            <span className="pointer-events-none absolute inset-[-5px] rounded-full border border-[rgba(212,160,23,0.45)] animate-[smartsave-faq-icon-pulse_2s_ease-out_infinite]" />
            <UserCircle2 size={24} className="relative z-10" />
            <Mic size={11} className="absolute -bottom-1 -right-1 z-20 rounded-full bg-amber-500 p-0.5 text-white" />
          </span>
          <span className="hidden text-sm font-bold md:inline">Need Help?</span>
        </button>
      </div>

      <style jsx global>{`
        @keyframes smartsave-faq-icon-pulse {
          0% {
            transform: scale(0.92);
            opacity: 0.65;
          }
          100% {
            transform: scale(1.35);
            opacity: 0;
          }
        }
        @keyframes smartsave-greeting-in {
          0% {
            transform: translateY(8px);
            opacity: 0;
          }
          100% {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}

