/**
 * Author Profile Management System
 * Handles author information including professional images and bio data
 */

export interface AuthorProfile {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  bio?: string;
  profileImageUrl?: string;
  socialLinks?: {
    linkedin?: string;
    twitter?: string;
  };
}

export const authorProfiles: Record<string, AuthorProfile> = {
  "noah_delaney": {
    id: "noah_delaney",
    firstName: "Noah",
    lastName: "Delaney",
    email: "noah.delaney@krugmaninsights.com",
    bio: "Senior Financial Analyst specializing in market intelligence and strategic analysis.",
    profileImageUrl: "/authors/noah-delaney.jpg"
  },
  "liam_becker": {
    id: "liam_becker",
    firstName: "Liam",
    lastName: "Becker",
    email: "liam.becker@krugmaninsights.com",
    bio: "Investment Banking Analyst with expertise in M&A and capital markets.",
    profileImageUrl: "/authors/liam-becker.jpg"
  },
  "owen_caldwell": {
    id: "owen_caldwell",
    firstName: "Owen",
    lastName: "Caldwell",
    email: "owen.caldwell@krugmaninsights.com",
    bio: "Private Equity Associate focused on growth investments and market analysis.",
    profileImageUrl: "/authors/owen-caldwell.jpg"
  },
  "isabella_romano": {
    id: "isabella_romano",
    firstName: "Isabella",
    lastName: "Romano",
    email: "isabella.romano@krugmaninsights.com",
    bio: "Research Director specializing in European markets and asset management.",
    profileImageUrl: "/authors/isabella-romano.jpg"
  },
  "henrik_olsen": {
    id: "henrik_olsen",
    firstName: "Henrik",
    lastName: "Olsen",
    email: "henrik.olsen@krugmaninsights.com",
    bio: "Nordic Markets Specialist with deep expertise in Scandinavian financial sectors.",
    profileImageUrl: "/authors/henrik-olsen.jpg"
  },
  "anika_schreiber": {
    id: "anika_schreiber",
    firstName: "Anika",
    lastName: "Schreiber",
    email: "anika.schreiber@krugmaninsights.com",
    bio: "German Markets Analyst covering DACH region financial services and technology.",
    profileImageUrl: "/authors/anika-schreiber.jpg"
  },
  "rachel_lin": {
    id: "rachel_lin",
    firstName: "Rachel",
    lastName: "Lin",
    email: "rachel.lin@krugmaninsights.com",
    bio: "Asia-Pacific Markets Specialist focusing on cross-border transactions.",
    profileImageUrl: "/authors/rachel-lin.jpg"
  },
  "clara_morgan": {
    id: "clara_morgan",
    firstName: "Clara",
    lastName: "Morgan",
    email: "clara.morgan@krugmaninsights.com",
    bio: "ESG and Sustainable Finance Analyst covering green bonds and impact investing.",
    profileImageUrl: "/authors/clara-morgan.jpg"
  },
  "michael_grant": {
    id: "michael_grant",
    firstName: "Michael",
    lastName: "Grant",
    email: "michael.grant@krugmaninsights.com",
    bio: "Technology Sector Analyst specializing in fintech and digital transformation.",
    profileImageUrl: "/authors/michael-grant.jpg"
  },
  "david_chen": {
    id: "david_chen",
    firstName: "David",
    lastName: "Chen",
    email: "david.chen@krugmaninsights.com",
    bio: "Senior Market Strategist with expertise in global financial markets and institutional coverage.",
    profileImageUrl: "/david-author.jpg"
  }
};

export const authorNameMapping: Record<string, string> = {
  "Noah Delaney": "noah_delaney",
  "Liam Becker": "liam_becker",
  "Owen Caldwell": "owen_caldwell",
  "Isabella Romano": "isabella_romano",
  "Henrik Olsen": "henrik_olsen",
  "Anika Schreiber": "anika_schreiber",
  "Rachel Lin": "rachel_lin",
  "Clara Morgan": "clara_morgan",
  "Michael Grant": "michael_grant",
  "David Chen": "david_chen"
};

export function getAuthorProfile(authorId: string): AuthorProfile | undefined {
  return authorProfiles[authorId];
}

export function getAuthorByName(authorName: string): AuthorProfile | undefined {
  const authorId = authorNameMapping[authorName];
  return authorId ? authorProfiles[authorId] : undefined;
}

export function getAllAuthors(): AuthorProfile[] {
  return Object.values(authorProfiles);
}