import { supabase } from '@/utils/supabase/client';
import { parseError } from '@/lib/parseError';

type PaymentType = 'registration' | 'deposit' | 'loan_repayment' | 'investment';

type SubmitPaymentInput = {
  userId: string;
  fullName: string;
  email: string;
  amount: number;
  paymentType: PaymentType;
  transactionReference?: string;
  proofUrl?: string;
};

type SubmitPaymentResult =
  | { success: true }
  | { success: false; error: string };

export async function submitPayment({
  userId,
  fullName,
  email,
  amount,
  paymentType,
  transactionReference,
  proofUrl,
}: SubmitPaymentInput): Promise<SubmitPaymentResult> {
  const { error } = await supabase.from('payment_submissions').insert({
    user_id: userId,
    full_name: fullName,
    email,
    amount,
    payment_type: paymentType,
    transaction_reference: transactionReference?.trim() || 'Not provided',
    proof_url: proofUrl ?? null,
  });

  if (error) {
    return {
      success: false,
      error: parseError(error),
    };
  }

  return { success: true };
}
