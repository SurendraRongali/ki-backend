// Centralized constants for the application

// Base firms list - will be dynamically extended from database
const BASE_COMPANIES = [
  "Apollo Global Management",
  "Ardian",
  "Ares Management Corporation", 
  "Bain Capital",
  "Bank of America",
  "Barclays",
  "BlackRock",
  "Blackstone",
  "BMO Capital Markets",
  "BNP Paribas",
  "Brookfield Asset Management",
  "Carlyle",
  "Centerview Partners",
  "Citadel",
  "Citi",
  "CVC Capital Partners",
  "Deloitte",
  "Deutsche Bank",
  "EQT Group",
  "Ernst & Young",
  "Evercore",
  "General Atlantic",
  "Goldman Sachs",
  "H.I.G. Capital",
  "Houlihan Lokey",
  "HSBC",
  "J.P.Morgan",
  "Jefferies",
  "KPMG",
  "KKR",
  "Lazard",
  "Lincoln International",
  "Macquarie",
  "Millennium Management",
  "Moelis & Company",
  "Morgan Stanley",
  "Nomura",
  "Oaktree Capital Management",
  "PIMCO",
  "Piper Sandler",
  "PJT Partners",
  "PWC",
  "Perella Weinberg",
  "RBC Capital Markets",
  "Rothschild & Co",
  "Societe Generale",
  "Thoma Bravo",
  "TPG Capital",
  "UBS",
  "Wells Fargo"
] as const;

// Company display aliases for better UX in filters
export const COMPANY_DISPLAY_ALIASES: Record<string, string> = {
  "Apollo Global Management": "Apollo",
  "Ares Management Corporation": "Ares", 
  "Brookfield Asset Management": "Brookfield",
  "H.I.G. Capital": "H.I.G. Capital",
  "Oaktree Capital Management": "Oaktree",
  "TPG Capital": "TPG Capital",
  "Bank of America": "Bank of America",
  "Barclays": "Barclays",
  "Bain Capital": "Bain Capital",
  "BlackRock": "BlackRock",
  "Blackstone": "Blackstone",
  "Carlyle": "Carlyle",
  "Centerview Partners": "Centerview Partners",
  "Citadel": "Citadel",
  "Citi": "Citi",
  "CVC Capital Partners": "CVC Capital Partners",
  "Deutsche Bank": "Deutsche Bank",
  "EQT Group": "EQT Group",
  "Evercore": "Evercore",
  "Goldman Sachs": "Goldman Sachs",
  "HSBC": "HSBC",
  "J.P.Morgan": "J.P.Morgan",
  "Jefferies": "Jefferies",
  "KKR": "KKR",
  "Lazard": "Lazard",
  "Millennium Management": "Millennium Management",
  "Morgan Stanley": "Morgan Stanley",
  "PIMCO": "PIMCO",
  "PJT Partners": "PJT Partners",
  "RBC Capital Markets": "RBC Capital Markets",
  "Rothschild & Co": "Rothschild & Co",
  "UBS": "UBS",
  "Wells Fargo": "Wells Fargo"
};

// Function to get display name for a company
export function getCompanyDisplayName(fullName: string): string {
  return COMPANY_DISPLAY_ALIASES[fullName] || fullName;
}

// Function to add new company to display aliases
export function addCompanyDisplayAlias(fullName: string, displayName?: string) {
  COMPANY_DISPLAY_ALIASES[fullName] = displayName || fullName;
}

// Dynamic companies list that includes database-created firms
export let AVAILABLE_COMPANIES: string[] = [...BASE_COMPANIES];

// Function to update companies list when firms are added/removed
export function updateAvailableCompanies(companies: string[]) {
  AVAILABLE_COMPANIES = [...companies].sort();
}

export const ARTICLE_TYPES = [
  "Deal Announcement",
  "M&A Analysis", 
  "Market Outlook",
  "Leadership Changes",
  "Earnings Report",
  "Strategy Update",
  "Industry Report",
  "Regulatory Update"
] as const;

export const DEAL_SIZES = [
  "Under £100M",
  "£100M - £500M", 
  "£500M - £1B",
  "£1B - £5B",
  "£5B - £10B",
  "Over £10B"
] as const;

export const INDUSTRIES = [
  "TMT",
  "Energy", 
  "FIG",
  "ESG",
  "DCM",
  "ECM",
  "Healthcare",
  "Industrials",
  "Consumer & Retail",
  "Real Estate"
] as const;

export const SECTORS = [
  "Software",
  "Biotechnology",
  "Banking",
  "Insurance",
  "Oil & Gas",
  "Renewable Energy", 
  "Manufacturing",
  "Aerospace",
  "Retail",
  "Hospitality",
  "Telecommunications",
  "Media",
  "Mining",
  "Agriculture"
] as const;

export const SUBSCRIPTION_TIERS = [
  "free",
  "student", 
  "monthly",
  "annual"
] as const;

// User preference options - centralized source of truth
export const USER_PREFERENCE_OPTIONS = {
  goals: [
    "Develop Career",
    "Investment Research", 
    "Market Analysis",
    "Network Building",
    "Industry Knowledge"
  ],
  industries: [
    "Investment Banking",
    "Private Equity",
    "Asset Management",
    "Hedge Funds",
    "Consulting"
  ],
  sectors: [
    "Healthcare",
    "FIG", 
    "DCM",
    "ECM",
    "Private Equity",
    "Technology",
    "Energy",
    "TMT",
    "Real Estate",
    "ESG",
    "Industrials",
    "Consumer & Retail"
  ],
  news: [
    "Strategy/Outlook",
    "Deals",
    "Earnings",
    "People/Hiring",
    "Fundraising"
  ],
  companies: AVAILABLE_COMPANIES
} as const;

// Export the correct news types for admin panel
export const AVAILABLE_NEWS_TYPES = USER_PREFERENCE_OPTIONS.news;
export const AVAILABLE_INDUSTRIES = USER_PREFERENCE_OPTIONS.industries;
export const AVAILABLE_SECTORS = USER_PREFERENCE_OPTIONS.sectors;

export type CompanyName = typeof AVAILABLE_COMPANIES[number];
export type ArticleType = typeof ARTICLE_TYPES[number];
export type DealSize = typeof DEAL_SIZES[number];
export type Industry = typeof INDUSTRIES[number];
export type Sector = typeof SECTORS[number];
export type SubscriptionTier = typeof SUBSCRIPTION_TIERS[number];