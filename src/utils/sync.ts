import { supabase } from '../lib/supabase';
import { getPendingSyncLoans, clearLoanPendingSync } from '../db/queries';

// Returns the current authenticated user's UID (anonymous or real).
// Returns undefined if not yet signed in — callers treat this as a soft failure.
const getUid = async (): Promise<string | undefined> => {
  const { data } = await supabase.auth.getUser();
  return data.user?.id;
};

// --- LOAN SHARING ---
export const shareLoan = async (loanData: object): Promise<string> => {
  const code = Math.random().toString(36).substring(2, 8).toUpperCase();
  const owner_id = await getUid();
  const { error } = await supabase.from('loan_shares').insert({
    share_code: code,
    loan_data: loanData,
    owner_id,
  });
  if (error) throw error;
  // Seed the status-sync record so edits propagate immediately
  await supabase.from('loan_status_sync').upsert({
    share_code: code,
    loan_data: loanData,
    is_paid: false,
    updated_at: new Date().toISOString(),
    owner_id,
  });
  return code;
};

export const claimLoanShare = async (code: string): Promise<object> => {
  const { data, error } = await supabase
    .from('loan_shares')
    .select('loan_data, claimed, expires_at')
    .eq('share_code', code.toUpperCase())
    .single();
  if (error || !data) throw new Error('Invalid or expired share code.');
  if (data.claimed) throw new Error('This loan has already been claimed.');
  if (new Date(data.expires_at) < new Date()) throw new Error('This share link has expired.');
  await supabase.from('loan_shares').update({ claimed: true }).eq('share_code', code.toUpperCase());
  return data.loan_data;
};

// --- LOAN STATUS SYNC ---
export const publishLoanPaid = async (shareCode: string): Promise<void> => {
  const { error } = await supabase.from('loan_status_sync').upsert({
    share_code: shareCode,
    is_paid: true,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
};

export const syncLoanUpdate = async (shareCode: string, loan: object): Promise<void> => {
  const { error } = await supabase.from('loan_status_sync').upsert({
    share_code: shareCode,
    loan_data: loan,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
};

export const fetchLoanSyncData = async (
  shareCodes: string[]
): Promise<Array<{ shareCode: string; isPaid: boolean; loanData: any }>> => {
  if (shareCodes.length === 0) return [];
  const { data } = await supabase
    .from('loan_status_sync')
    .select('share_code, is_paid, loan_data')
    .in('share_code', shareCodes);
  return (data ?? []).map((r: any) => ({
    shareCode: r.share_code as string,
    isPaid: r.is_paid as boolean,
    loanData: r.loan_data,
  }));
};

// --- OFFLINE FLUSH ---
export const flushPendingLoanSyncs = async (): Promise<void> => {
  const pending = await getPendingSyncLoans();
  if (pending.length === 0) return;
  for (const loan of pending) {
    if (!loan.shareCode) continue;
    // supabase never throws — it returns { error } on failure, so we must check explicitly
    const { error } = await supabase.from('loan_status_sync').upsert({
      share_code: loan.shareCode,
      loan_data: loan,
      is_paid: loan.status === 'paid',
      updated_at: new Date().toISOString(),
    });
    if (!error) {
      await clearLoanPendingSync(loan.id);
    }
    // if error (still offline / Supabase error), leave pending_sync = 1 for next flush
  }
};

// --- DEVICE TRANSFER ---
export const createDeviceTransfer = async (allData: object): Promise<string> => {
  const code = Math.random().toString(36).substring(2, 8).toUpperCase();
  const owner_id = await getUid();
  const { error } = await supabase.from('device_transfers').insert({
    transfer_code: code,
    data: allData,
    owner_id,
  });
  if (error) throw error;
  return code;
};

export const claimDeviceTransfer = async (code: string): Promise<object> => {
  const { data, error } = await supabase
    .from('device_transfers')
    .select('data, claimed, expires_at')
    .eq('transfer_code', code.toUpperCase())
    .single();
  if (error || !data) throw new Error('Invalid or expired transfer code.');
  if (data.claimed) throw new Error('This transfer has already been used.');
  if (new Date(data.expires_at) < new Date()) throw new Error('This transfer code has expired.');
  await supabase.from('device_transfers').update({ claimed: true }).eq('transfer_code', code.toUpperCase());
  return data.data;
};
