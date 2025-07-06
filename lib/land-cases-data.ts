export interface LandCaseTheme {
  id: number;
  theme: string;
  caseCount: number;
  percentage: number;
  description?: string;
}

export const landCasesThematicData: LandCaseTheme[] = [
  {
    id: 1,
    theme: "Appropriation of private land by the government",
    caseCount: 179,
    percentage: 1.66,
    description: "Cases involving government acquisition of private property"
  },
  {
    id: 2,
    theme: "Appropriation of public land",
    caseCount: 355,
    percentage: 3.29,
    description: "Disputes over government appropriation of public land"
  },
  {
    id: 3,
    theme: "Breach of terms of contract/ Lease Agreements/ by government",
    caseCount: 79,
    percentage: 0.73,
    description: "Government breach of lease or contractual agreements"
  },
  {
    id: 4,
    theme: "Cancellation of title",
    caseCount: 4630,
    percentage: 42.87,
    description: "Cases involving cancellation of land titles"
  },
  {
    id: 5,
    theme: "Caution/ Restrictions/ Caveat",
    caseCount: 333,
    percentage: 3.08,
    description: "Legal cautions, restrictions, and caveats on land"
  },
  {
    id: 6,
    theme: "Certiorari",
    caseCount: 172,
    percentage: 1.59,
    description: "Judicial review applications for land decisions"
  },
  {
    id: 7,
    theme: "Compulsory acquisition",
    caseCount: 142,
    percentage: 1.31,
    description: "Mandatory land acquisition by government"
  },
  {
    id: 8,
    theme: "Costs",
    caseCount: 19,
    percentage: 0.18,
    description: "Legal costs related to land cases"
  },
  {
    id: 9,
    theme: "Damages (General, Specific, Exemplary)",
    caseCount: 165,
    percentage: 1.53,
    description: "Claims for various types of damages"
  },
  {
    id: 10,
    theme: "Declaration",
    caseCount: 780,
    percentage: 7.22,
    description: "Declaratory relief applications"
  },
  {
    id: 11,
    theme: "Double allocation",
    caseCount: 285,
    percentage: 2.64,
    description: "Cases involving multiple allocations of same land"
  },
  {
    id: 12,
    theme: "Eviction",
    caseCount: 209,
    percentage: 1.94,
    description: "Land eviction proceedings"
  },
  {
    id: 13,
    theme: "Historical Injustices",
    caseCount: 40,
    percentage: 0.37,
    description: "Cases addressing historical land injustices"
  },
  {
    id: 14,
    theme: "Injunction/Conservatory Orders",
    caseCount: 336,
    percentage: 3.11,
    description: "Temporary and permanent injunctive relief"
  },
  {
    id: 15,
    theme: "Interests",
    caseCount: 60,
    percentage: 0.56,
    description: "Interest claims on land-related matters"
  },
  {
    id: 16,
    theme: "Land Fraud",
    caseCount: 1923,
    percentage: 17.81,
    description: "Fraudulent land transactions and dealings"
  },
  {
    id: 17,
    theme: "Malicious Prosecution",
    caseCount: 19,
    percentage: 0.18,
    description: "Claims of malicious prosecution in land matters"
  },
  {
    id: 18,
    theme: "Mandamus",
    caseCount: 171,
    percentage: 1.58,
    description: "Orders compelling government action on land"
  },
  {
    id: 19,
    theme: "Prohibition",
    caseCount: 32,
    percentage: 0.30,
    description: "Orders prohibiting certain land actions"
  },
  {
    id: 20,
    theme: "Renewal/ extension of leases",
    caseCount: 22,
    percentage: 0.20,
    description: "Lease renewal and extension matters"
  },
  {
    id: 21,
    theme: "Specific Performance",
    caseCount: 132,
    percentage: 1.22,
    description: "Orders for specific performance of land contracts"
  },
  {
    id: 22,
    theme: "Violation of right to a clean environment",
    caseCount: 60,
    percentage: 0.56,
    description: "Environmental rights violations on land"
  },
  {
    id: 23,
    theme: "Violation of right to property by the government",
    caseCount: 254,
    percentage: 2.35,
    description: "Government violations of property rights"
  },
  {
    id: 24,
    theme: "Violation of Rights",
    caseCount: 403,
    percentage: 3.73,
    description: "General violations of land-related rights"
  }
];

export const totalLandCases = 10800;

export const getTopLandCaseCategories = (limit: number = 5): LandCaseTheme[] => {
  return landCasesThematicData
    .sort((a, b) => b.caseCount - a.caseCount)
    .slice(0, limit);
};

export const getLandCaseByTheme = (theme: string): LandCaseTheme | undefined => {
  return landCasesThematicData.find(item => 
    item.theme.toLowerCase().includes(theme.toLowerCase())
  );
};

export const calculateLandCaseStats = () => {
  const total = landCasesThematicData.reduce((sum, item) => sum + item.caseCount, 0);
  const averagePerCategory = Math.round(total / landCasesThematicData.length);
  const highVolumeCategories = landCasesThematicData.filter(item => item.caseCount > averagePerCategory);
  
  return {
    totalCases: total,
    totalCategories: landCasesThematicData.length,
    averagePerCategory,
    highVolumeCategories: highVolumeCategories.length,
    topCategory: landCasesThematicData.reduce((prev, current) => 
      (prev.caseCount > current.caseCount) ? prev : current
    )
  };
};