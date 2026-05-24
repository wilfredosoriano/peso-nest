import { Platform } from 'react-native';

// ─── Replace these with your real RevenueCat API keys when ready ───────────
export const RC_API_KEY_IOS     = 'appl_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX';
export const RC_API_KEY_ANDROID = 'goog_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX';
// ──────────────────────────────────────────────────────────────────────────

export const ENTITLEMENT_ID = 'premium';

const isPlaceholder = (key: string) => key.includes('XXXXX');

const getPurchases = () => {
  try { return require('react-native-purchases').default; } catch { return null; }
};

export const initializePurchases = (): void => {
  const apiKey = Platform.OS === 'ios' ? RC_API_KEY_IOS : RC_API_KEY_ANDROID;
  if (isPlaceholder(apiKey)) return; // not configured yet
  try {
    const Purchases = getPurchases();
    if (!Purchases) return;
    Purchases.setLogLevel(Purchases.LOG_LEVEL?.VERBOSE ?? 4);
    Purchases.configure({ apiKey });
  } catch {}
};

export const checkPremiumEntitlement = async (): Promise<boolean> => {
  const apiKey = Platform.OS === 'ios' ? RC_API_KEY_IOS : RC_API_KEY_ANDROID;
  if (isPlaceholder(apiKey)) return false; // not configured yet
  try {
    const Purchases = getPurchases();
    if (!Purchases) return false;
    const info = await Purchases.getCustomerInfo();
    return !!info?.entitlements?.active?.[ENTITLEMENT_ID];
  } catch {
    return false;
  }
};

export const purchasePremium = async (): Promise<{ success: boolean; cancelled: boolean; error?: string }> => {
  try {
    const Purchases = getPurchases();
    if (!Purchases) return { success: false, cancelled: false, error: 'Store not available yet' };
    const offerings = await Purchases.getOfferings();
    const pkg = offerings?.current?.availablePackages?.[0];
    if (!pkg) return { success: false, cancelled: false, error: 'No package available' };
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return { success: !!customerInfo?.entitlements?.active?.[ENTITLEMENT_ID], cancelled: false };
  } catch (e: any) {
    if (e?.userCancelled) return { success: false, cancelled: true };
    return { success: false, cancelled: false, error: e?.message ?? 'Purchase failed' };
  }
};

export const restorePurchases = async (): Promise<boolean> => {
  try {
    const Purchases = getPurchases();
    if (!Purchases) return false;
    const info = await Purchases.restorePurchases();
    return !!info?.entitlements?.active?.[ENTITLEMENT_ID];
  } catch {
    return false;
  }
};
