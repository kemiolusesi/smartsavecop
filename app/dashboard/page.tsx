'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useDashboard } from '@/hooks/use-dashboard';
import { useProfile } from '@/hooks/use-profile';
import { useSavingsPlans } from '@/hooks/use-savings-plans';
import { useTransactions } from '@/hooks/use-transactions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TrendingUp, Wallet, Target, Eye, EyeOff, Home, User, Calculator } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const [isClient, setIsClient] = useState(false);
  const [showBalance, setShowBalance] = useState(true);
  
  // Real-time Mini ROI Input State Metrics
  const [roiAmount, setRoiAmount] = useState<string>('');
  const [roiTerm, setRoiTerm] = useState<number>(12);

  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { activePlans, recentTransactions, totalBalance, monthlyReturn, loading: dashLoading, error: dashError } = useDashboard();
  const { profile: profileData, loading: profileLoading } = useProfile();
  const { plans, loading: plansLoading } = useSavingsPlans('active');
  const { transactions, loading: txnLoading } = useTransactions(10);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth');
    }
  }, [authLoading, isAuthenticated, router]);

  if (!isClient || authLoading) {
    return null;
  }

  if (!isAuthenticated) {
    return null;
  }

  const isLoading = dashLoading || profileLoading || plansLoading || txnLoading;

  if (dashError) {
    return (
      <Alert variant="destructive" className="bg-red-950/50 border-red-500/30 text-red-200">
        <AlertDescription>{dashError}</AlertDescription>
      </Alert>
    );
  }

  // Live Auto-Calculation Matrix (Base yield factor calculated at 15% p.a.)
  const parsedAmt = parseFloat(roiAmount) || 0;
  const computedProfit = parsedAmt * (0.15 * (roiTerm / 12));
  const totalPayout = parsedAmt + computedProfit;

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white antialiased">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6 pt-4 sm:pt-10">
        
        {/* Dynamic Inner Workspace Navbar Interface */}
        <div className="w-full bg-[#111111]/40 border border-white/[0.06] backdrop-blur-md rounded-2xl p-4 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Dashboard</h1>
            <p className="text-white/40 text-xs mt-0.5 font-medium">Welcome back, {profileData?.full_name || 'Member'}</p>
          </div>
          
          {/* Responsive Single-Row Unified Controls Menu Layout */}
          <div className="flex items-center justify-between sm:justify-end gap-2.5 border-t border-white/[0.04] pt-3 sm:pt-0 sm:border-none">
            <div className="flex items-center gap-2">
              <Link 
                href="/" 
                className="inline-flex items-center justify-center gap-2 p-2.5 sm:px-4 sm:py-2 text-xs font-bold rounded-xl bg-white/[0.02] border border-white/10 text-white/80 hover:text-white hover:bg-white/5 transition-all active:scale-95"
                title="Return Home"
              >
                <Home size={15} className="text-[#D4AF37]" />
                <span className="hidden sm:inline">Home</span>
              </Link>
              
              <Link 
                href="/dashboard/profile" 
                className="inline-flex items-center justify-center gap-2 p-2.5 sm:px-4 sm:py-2 text-xs font-bold rounded-xl bg-white/[0.02] border border-white/10 text-white/80 hover:text-white hover:bg-white/5 transition-all active:scale-95"
                title="Profile Settings"
              >
                <User size={15} className="text-[#D4AF37]" />
                <span className="hidden sm:inline">Profile</span>
              </Link>
            </div>

            {/* Micro Calculation Visibility Switch */}
            <div className="flex items-center gap-1.5 bg-[#0A0A0A] border border-white/10 rounded-xl p-1">
              <span className="text-[9px] uppercase font-bold tracking-wider bg-[#9DC03A]/10 text-[#9DC03A] px-2 py-1 rounded-lg max-sm:scale-90">
                Live
              </span>
              <button
                onClick={() => setShowBalance(!showBalance)}
                className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/5 transition-colors"
                title={showBalance ? "Hide Balances" : "Show Balances"}
                aria-label="Toggle visible balance figures"
              >
                {showBalance ? <Eye size={15} /> : <EyeOff size={15} />}
              </button>
            </div>
          </div>
        </div>

        {/* Hyper-Compressed Single Row Key Metrics Matrix (Fixed 3-Column Mobile Setup) */}
        <div className="grid grid-cols-3 gap-2 sm:gap-6 mb-8">
          
          {/* Total Liquidity Card Node */}
          <Card className="bg-white/5 border-white/10 shadow-xl backdrop-blur-sm p-0 overflow-hidden">
            <div className="p-3 sm:p-6">
              <p className="text-[10px] sm:text-sm font-medium text-white/50 truncate">Total Balance</p>
              <div className="mt-1.5 sm:mt-2">
                {isLoading ? (
                  <Skeleton className="h-6 w-full bg-white/10" />
                ) : (
                  <p className="text-xs sm:text-lg md:text-3xl font-black tracking-tight text-white truncate">
                    {showBalance ? `₦${(totalBalance || 0).toLocaleString('en-NG')}` : '••••'}
                  </p>
                )}
              </div>
              <p className="text-[9px] sm:text-xs text-white/30 mt-1 sm:mt-2 truncate font-medium">{activePlans.length} active</p>
            </div>
          </Card>

          {/* Monthly Yield Return Card Node */}
          <Card className="bg-white/5 border-white/10 shadow-xl backdrop-blur-sm p-0 overflow-hidden">
            <div className="p-3 sm:p-6">
              <p className="text-[10px] sm:text-sm font-medium text-white/50 flex items-center gap-1 truncate">
                <TrendingUp size={12} className="text-[#9DC03A] hidden sm:inline" />
                Monthly Return
              </p>
              <div className="mt-1.5 sm:mt-2">
                {isLoading ? (
                  <Skeleton className="h-6 w-full bg-white/10" />
                ) : (
                  <p className="text-xs sm:text-lg md:text-3xl font-black tracking-tight text-[#9DC03A] truncate">
                    {showBalance ? `₦${(monthlyReturn || 0).toLocaleString('en-NG')}` : '••••'}
                  </p>
                )}
              </div>
              <p className="text-[9px] sm:text-xs text-white/30 mt-1 sm:mt-2 truncate font-medium">Est. earnings</p>
            </div>
          </Card>

          {/* KYC Status Compliance Card Node */}
          <Card className="bg-white/5 border-white/10 shadow-xl backdrop-blur-sm p-0 overflow-hidden">
            <div className="p-3 sm:p-6">
              <p className="text-[10px] sm:text-sm font-medium text-white/50 truncate">KYC Status</p>
              <div className="mt-1.5 sm:mt-2 flex items-center gap-1.5 min-h-[1.5rem] sm:min-h-[2.25rem]">
                {isLoading ? (
                  <Skeleton className="h-4 w-full bg-white/10" />
                ) : (
                  <>
                    <div
                      className={`w-1.5 h-1.5 sm:w-2.5 sm:h-2.5 rounded-full shrink-0 ${
                        profileData?.kyc_status === 'approved' ? 'bg-[#9DC03A]' : profileData?.kyc_status === 'pending' ? 'bg-[#D4AF37]' : 'bg-red-500'
                      }`}
                    />
                    <p className="text-xs sm:text-base font-bold text-white capitalize truncate">
                      {profileData?.kyc_status || 'Pending'}
                    </p>
                  </>
                )}
              </div>
              <p className="text-[9px] sm:text-xs text-[#9DC03A] mt-1 sm:mt-2 truncate font-semibold">
                {profileData?.bvn_verified ? '✓ Verified' : 'Unverified'}
              </p>
            </div>
          </Card>
        </div>

        {/* Primary Interactive Split View Layout Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Workspace Frame (Calculator Panel Stacked over Target Ledger) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Embedded Micro Return on Investment Forecast Engine Module */}
            <Card className="bg-[#111111] border border-white/10 shadow-2xl">
              <CardHeader className="border-b border-white/[0.06] pb-4">
                <CardTitle className="text-xs font-mono uppercase tracking-widest text-white/40 flex items-center gap-2">
                  <Calculator size={15} className="text-[#D4AF37]" />
                  Profit Projection Engine
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-5 grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-white/60 uppercase tracking-wider">Principal Investment (₦)</label>
                    <input
                      type="number"
                      value={roiAmount}
                      onChange={(e) => setRoiAmount(e.target.value)}
                      placeholder="e.g., 500000"
                      className="w-full px-3 py-2 text-sm bg-[#0A0A0A] border border-white/10 rounded-lg text-white font-medium focus:outline-none focus:border-[#D4AF37] transition-colors placeholder:text-white/20"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-white/60 uppercase tracking-wider">Lifecycle Duration Term</label>
                    <select
                      value={roiTerm}
                      onChange={(e) => setRoiTerm(Number(e.target.value))}
                      className="w-full px-3 py-2 text-sm bg-[#0A0A0A] border border-white/10 rounded-lg text-white font-medium focus:outline-none focus:border-[#D4AF37] transition-colors"
                    >
                      <option value={3}>3 Months Lifecycle</option>
                      <option value={6}>6 Months Lifecycle</option>
                      <option value={12}>12 Months Lifecycle</option>
                      <option value={24}>24 Months Lifecycle</option>
                    </select>
                  </div>
                </div>

                <div className="bg-white/[0.01] border border-white/5 rounded-xl p-4 h-full flex flex-col justify-center min-h-[120px]">
                  {parsedAmt > 0 ? (
                    <div className="space-y-3">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-white/50">Base Interest (15% p.a.):</span>
                        <span className="text-[#9DC03A] font-bold">+₦{Math.round(computedProfit).toLocaleString('en-NG')}</span>
                      </div>
                      <div className="flex justify-between text-sm font-bold pt-2.5 border-t border-white/5">
                        <span className="text-white/80">Projected Total Payout:</span>
                        <span className="text-[#D4AF37] text-base">₦{Math.round(totalPayout).toLocaleString('en-NG')}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-white/30 text-center italic">Enter a principal amount to forecast your savings growth returns yield.</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Portfolio Assets Grid Tracker */}
            <Card className="bg-white/5 border-white/10 shadow-2xl">
              <CardHeader className="border-b border-white/[0.06] pb-4">
                <CardTitle className="text-xl font-bold text-white flex items-center gap-2.5">
                  <Target size={20} className="text-[#D4AF37]" />
                  Active Savings Plans
                </CardTitle>
                <CardDescription className="text-white/70 font-semibold text-sm mt-1">
                  Your current investments
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {isLoading ? (
                  <div className="space-y-4">
                    {[1, 2].map((i) => (
                      <Skeleton key={i} className="h-24 bg-white/10 rounded-lg" />
                    ))}
                  </div>
                ) : activePlans.length === 0 ? (
                  <p className="text-white/40 py-12 text-center font-medium">No active savings plans yet</p>
                ) : (
                  <div className="space-y-4">
                    {activePlans.map((plan) => (
                      <div
                        key={plan.id}
                        className="p-4 rounded-lg border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] transition-colors"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-bold text-base text-white capitalize">{plan.plan_type} Plan</p>
                            <p className="text-xs text-white/40 font-medium mt-0.5">
                              Started {new Date(plan.start_date).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-sm text-[#D4AF37]">
                              {plan.annual_rate * 100}% p.a.
                            </p>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm mt-4">
                          <div>
                            <p className="text-white/40 font-medium text-xs">Principal</p>
                            <p className="font-bold text-white mt-0.5">
                              ₦{plan.principal_amount.toLocaleString('en-NG')}
                            </p>
                          </div>
                          <div>
                            <p className="text-white/40 font-medium text-xs">Accrued Interest</p>
                            <p className="font-bold text-[#9DC03A] mt-0.5">
                              ₦{plan.accrued_interest.toLocaleString('en-NG')}
                              <span className="text-[9px] font-normal ml-1 text-white/40">(live)</span>
                            </p>
                          </div>
                          <div>
                            <p className="text-white/40 font-medium text-xs">Matures</p>
                            <p className="font-bold text-white mt-0.5">
                              {new Date(plan.mature_date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="mt-4 pt-3 border-t border-white/5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-white/40 font-medium">
                              Days elapsed: {Math.floor((Date.now() - new Date(plan.start_date).getTime()) / (1000 * 60 * 60 * 24))}
                            </span>
                            <span className="text-[#9DC03A] font-bold">
                              Total: ₦{(plan.principal_amount + plan.accrued_interest).toLocaleString('en-NG')}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column Stack Layout (Recent Transactions Log) */}
          <div className="space-y-6">
            <Card className="bg-white/5 border-white/10 shadow-2xl">
              <CardHeader className="border-b border-white/[0.06] pb-4">
                <CardTitle className="text-xl font-bold text-white flex items-center gap-2.5">
                  <Wallet size={20} className="text-[#D4AF37]" />
                  Recent Activity
                </CardTitle>
                <CardDescription className="text-white/70 font-semibold text-sm mt-1">
                  Latest transactions
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {isLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-16 bg-white/10 rounded-lg" />
                    ))}
                  </div>
                ) : recentTransactions.length === 0 ? (
                  <p className="text-white/40 py-12 text-center text-sm font-medium">No transactions yet</p>
                ) : (
                  <div className="space-y-3">
                    {recentTransactions.map((txn) => (
                      <div
                        key={txn.id}
                        className="p-3 rounded-lg bg-white/[0.02] border border-white/10"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-bold text-white capitalize">{txn.type}</p>
                            <p className="text-xs text-white/40 font-medium mt-0.5">
                              {new Date(txn.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <p
                            className={`font-bold text-sm ${
                              txn.type === 'deposit' || txn.type === 'interest_accrual' ? 'text-[#9DC03A]' : 'text-red-400'
                            }`}
                          >
                            {txn.type === 'deposit' || txn.type === 'interest_accrual' ? '+' : '-'}
                            ₦{txn.amount.toLocaleString('en-NG')}
                          </p>
                        </div>
                        <p className="text-[10px] font-mono text-white/30 mt-1.5 truncate">{txn.reference}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

        </div>
      </div>
    </div>
  );
}