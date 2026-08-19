/**
 * Lead priority/background classification option lists.
 *
 * Mirrors the backend's LeadPriority / LeadPrioritySubCategory / LeadBackground enums
 * (atlas_mentor_backend: src/main/java/com/lab/atlasmentor/enums/) exactly — same enum
 * codes (values sent to/received from the API) and same display labels. There is no
 * dedicated options endpoint for these fields yet (only GET /api/leads/import/fields,
 * which exposes column headers for the import flow, not this tier→subcategory mapping),
 * so this list is hardcoded here on purpose. If the tiers/subcategories ever change on
 * the backend, update this file to match — don't let it drift.
 */

export interface LeadPrioritySubCategoryOption {
  value: string;
  label: string;
}

export interface LeadPriorityTierOption {
  value: string;
  label: string;
  subCategories: LeadPrioritySubCategoryOption[];
}

export const LEAD_PRIORITY_TIERS: LeadPriorityTierOption[] = [
  {
    value: 'P1',
    label: 'P1 (High)',
    subCategories: [
      { value: 'HOT_LEADS', label: 'Hot Leads' },
      { value: 'DIRECT_REFERRAL_LEADS', label: 'Direct Referral Leads' },
      { value: 'HIGH_BUDGET_PREMIUM_LEADS', label: 'High Budget / Premium Leads' },
      { value: 'PARENT_READY_LEADS', label: 'Parent Ready Leads' },
      { value: 'IMMEDIATE_INTAKE', label: 'Immediate Intake' },
      { value: 'CLEAR_DECISION_MAKERS', label: 'Clear Decision Makers' }
    ]
  },
  {
    value: 'P2',
    label: 'P2 (Medium)',
    subCategories: [
      { value: 'WARM_LEADS', label: 'Warm Leads' },
      { value: 'CONFUSED_LEADS', label: 'Confused Leads' },
      { value: 'OVERTHINKERS_QUESTION_MACHINE', label: 'Overthinkers / Question Machine' },
      { value: 'MEDIUM_BUDGET_LEADS', label: 'Medium Budget Leads' },
      { value: 'COMPARING_LEADS', label: 'Comparing Leads' },
      { value: 'STUDENT_DRIVEN', label: 'Student Driven' },
      { value: 'FLEXIBLE_BUT_UNSURE', label: 'Flexible But Unsure' }
    ]
  },
  {
    value: 'P3',
    label: 'P3 (Low)',
    subCategories: [
      { value: 'COLD_LEADS', label: 'Cold Leads' },
      { value: 'ENQUIRY_INFO_SEEKERS', label: 'Enquiry / Info Seekers' },
      { value: 'VERY_LOW_BUDGET_UNREALISTIC', label: 'Very Low Budget / Unrealistic' },
      { value: 'NEXT_YEAR_NO_URGENCY', label: 'Next Year / No Urgency' },
      { value: 'NO_DECISION_AUTHORITY', label: 'No Decision Authority' },
      { value: 'HIGHLY_CONFUSED_NO_DIRECTION', label: 'Highly Confused / No Direction' },
      { value: 'FAKE_CASUAL_LEADS', label: 'Fake / Casual Leads' }
    ]
  }
];

export const LEAD_BACKGROUND_OPTIONS: LeadPrioritySubCategoryOption[] = [
  { value: 'EDUCATED', label: 'Educated' },
  { value: 'LESS_EDUCATED', label: 'Less Educated' }
];

/** Look up a tier's subcategory list by tier code (P1/P2/P3). Returns [] for '' / unknown. */
export function getSubCategoriesForTier(tierValue: string | null | undefined): LeadPrioritySubCategoryOption[] {
  return LEAD_PRIORITY_TIERS.find(t => t.value === tierValue)?.subCategories || [];
}

/** Display label for a tier code, falling back to the raw code if unrecognized. */
export function getPriorityTierLabel(tierValue: string | null | undefined): string {
  if (!tierValue) return '';
  return LEAD_PRIORITY_TIERS.find(t => t.value === tierValue)?.label || tierValue;
}

/** Display label for a subcategory code, falling back to the raw code if unrecognized. */
export function getPrioritySubCategoryLabel(subCategoryValue: string | null | undefined): string {
  if (!subCategoryValue) return '';
  for (const tier of LEAD_PRIORITY_TIERS) {
    const match = tier.subCategories.find(s => s.value === subCategoryValue);
    if (match) return match.label;
  }
  return subCategoryValue;
}

/** Display label for a background code, falling back to the raw code if unrecognized. */
export function getBackgroundLabel(backgroundValue: string | null | undefined): string {
  if (!backgroundValue) return '';
  return LEAD_BACKGROUND_OPTIONS.find(b => b.value === backgroundValue)?.label || backgroundValue;
}
