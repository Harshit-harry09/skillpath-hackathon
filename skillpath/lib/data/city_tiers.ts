export type LocationTier = 'metro' | 'tier2' | 'tier3' | 'rural' | 'unknown';

export interface CityInfo {
  city: string;
  tier: LocationTier;
}

export const CITY_TIER_INDEX: Record<string, CityInfo> = {
  bengaluru: { city: 'Bengaluru, KA', tier: 'metro' },
  bangalore: { city: 'Bengaluru, KA', tier: 'metro' },
  mumbai: { city: 'Mumbai, MH', tier: 'metro' },
  delhi: { city: 'NCR, Delhi', tier: 'metro' },
  noida: { city: 'Noida, UP', tier: 'metro' },
  gurgaon: { city: 'Gurugram, HR', tier: 'metro' },
  gurugram: { city: 'Gurugram, HR', tier: 'metro' },
  hyderabad: { city: 'Hyderabad, TS', tier: 'metro' },
  pune: { city: 'Pune, MH', tier: 'metro' },
  chennai: { city: 'Chennai, TN', tier: 'metro' },
  kolkata: { city: 'Kolkata, WB', tier: 'metro' },
  jaipur: { city: 'Jaipur, RJ', tier: 'tier2' },
  lucknow: { city: 'Lucknow, UP', tier: 'tier2' },
  indore: { city: 'Indore, MP', tier: 'tier2' },
  bhopal: { city: 'Bhopal, MP', tier: 'tier2' },
  nagpur: { city: 'Nagpur, MH', tier: 'tier2' },
  vadodara: { city: 'Vadodara, GJ', tier: 'tier2' },
  surat: { city: 'Surat, GJ', tier: 'tier2' },
  coimbatore: { city: 'Coimbatore, TN', tier: 'tier2' },
  kochi: { city: 'Kochi, KL', tier: 'tier2' },
  patna: { city: 'Patna, BR', tier: 'tier3' },
  varanasi: { city: 'Varanasi, UP', tier: 'tier3' },
  ranchi: { city: 'Ranchi, JH', tier: 'tier3' },
};

export function lookupCityInfo(rawText: string): CityInfo {
  const lower = rawText.toLowerCase();
  for (const [key, info] of Object.entries(CITY_TIER_INDEX)) {
    if (lower.includes(key)) {
      return info;
    }
  }
  return { city: 'Lucknow, UP (Tier-2 Hub)', tier: 'tier2' };
}
