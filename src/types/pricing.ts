export type PricingTier = 'free' | 'pro' | 'teams' | 'edu' | 'enterprise';

export interface TierEntitlements {
  tier: PricingTier;
  monthlyPrice: number;
  maxProfiles: number;
  watermarkRemoval: boolean;
  webgpuAllowed: boolean;
  exportFormats: ('svg' | 'png' | 'pdf')[];
  apiAccess: boolean;
  prioritySupport: boolean;
}

export const TIER_CONFIGS: Record<PricingTier, TierEntitlements> = {
  free: {
    tier: 'free',
    monthlyPrice: 0,
    maxProfiles: 1,
    watermarkRemoval: false,
    webgpuAllowed: false,
    exportFormats: ['svg', 'png'],
    apiAccess: false,
    prioritySupport: false,
  },
  pro: {
    tier: 'pro',
    monthlyPrice: 9,
    maxProfiles: 5,
    watermarkRemoval: true,
    webgpuAllowed: true,
    exportFormats: ['svg', 'png', 'pdf'],
    apiAccess: false,
    prioritySupport: true,
  },
  teams: {
    tier: 'teams',
    monthlyPrice: 19,
    maxProfiles: 25,
    watermarkRemoval: true,
    webgpuAllowed: true,
    exportFormats: ['svg', 'png', 'pdf'],
    apiAccess: true,
    prioritySupport: true,
  },
  edu: {
    tier: 'edu',
    monthlyPrice: 2,
    maxProfiles: 10,
    watermarkRemoval: false,
    webgpuAllowed: true,
    exportFormats: ['svg', 'png', 'pdf'],
    apiAccess: true,
    prioritySupport: true,
  },
  enterprise: {
    tier: 'enterprise',
    monthlyPrice: 99,
    maxProfiles: 1000,
    watermarkRemoval: true,
    webgpuAllowed: true,
    exportFormats: ['svg', 'png', 'pdf'],
    apiAccess: true,
    prioritySupport: true,
  },
};
