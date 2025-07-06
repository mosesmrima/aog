// Mock data for public registries

export interface MarriageVerification {
  id: string;
  certificateNumber: string;
  exists: boolean;
  yearRange: string;
  status: 'valid' | 'expired' | 'revoked';
  registrationLocation: string;
}

export interface PublicCase {
  id: string;
  caseNumber: string;
  title: string;
  status: 'active' | 'concluded' | 'pending' | 'dismissed';
  dateRegistered: string;
  dateLastUpdated: string;
  summary: string;
  petitioner: string;
  respondent: string;
  category: string;
  court: string;
  judge?: string;
  outcome?: string;
  publicDocuments: string[];
}

export interface Society {
  id: string;
  registrationNumber: string;
  name: string;
  dateRegistered: string;
  status: 'active' | 'suspended' | 'dissolved' | 'under-review';
  category: string;
  location: string;
  objectives: string;
  registeredAddress: string;
  contactPerson?: string;
  phoneNumber?: string;
  email?: string;
}

export interface AdoptionStats {
  totalAdoptions: number;
  thisYear: number;
  averageProcessingTime: string;
  byAgeGroup: { ageRange: string; count: number }[];
  byRegion: { region: string; count: number }[];
  completionRate: number;
  yearlyBreakdown: { year: string; female: number; male: number; total: number }[];
}

// Mock Marriages Data
export const mockMarriages: MarriageVerification[] = [
  {
    id: '1',
    certificateNumber: 'MC/2024/001234',
    exists: true,
    yearRange: '2024',
    status: 'valid',
    registrationLocation: 'Nairobi Registrar Office'
  },
  {
    id: '2',
    certificateNumber: 'MC/2023/005678',
    exists: true,
    yearRange: '2023',
    status: 'valid',
    registrationLocation: 'Mombasa Registrar Office'
  },
  {
    id: '3',
    certificateNumber: 'MC/2022/009876',
    exists: true,
    yearRange: '2022',
    status: 'valid',
    registrationLocation: 'Kisumu Registrar Office'
  },
  {
    id: '4',
    certificateNumber: 'MC/2021/003456',
    exists: true,
    yearRange: '2021',
    status: 'valid',
    registrationLocation: 'Nakuru Registrar Office'
  },
  {
    id: '5',
    certificateNumber: 'MC/2020/007890',
    exists: true,
    yearRange: '2020',
    status: 'valid',
    registrationLocation: 'Eldoret Registrar Office'
  }
];

// Mock Public Cases Data
export const mockPublicCases: PublicCase[] = [
  {
    id: '1',
    caseNumber: 'CONST/2024/001',
    title: 'Citizens Coalition v. Ministry of Environment - Forest Conservation Challenge',
    status: 'active',
    dateRegistered: '2024-01-15',
    dateLastUpdated: '2024-06-20',
    summary: 'Constitutional petition challenging the government\'s forest conservation policies and seeking enforcement of environmental protection laws.',
    petitioner: 'Citizens Coalition for Environmental Protection',
    respondent: 'Ministry of Environment and Forestry',
    category: 'Constitutional Law',
    court: 'High Court of Kenya',
    judge: 'Justice M. Wanjiku',
    publicDocuments: ['Petition', 'Government Response', 'Environmental Impact Assessment']
  },
  {
    id: '2',
    caseNumber: 'CIVIL/2024/089',
    title: 'Public Procurement Transparency Case - County Roads Project',
    status: 'concluded',
    dateRegistered: '2024-02-10',
    dateLastUpdated: '2024-05-30',
    summary: 'Civil case regarding transparency in public procurement processes for county road construction projects.',
    petitioner: 'Transparency International Kenya',
    respondent: 'County Government of Kiambu',
    category: 'Public Procurement',
    court: 'High Court of Kenya',
    judge: 'Justice P. Kimani',
    outcome: 'Ruled in favor of petitioner - procurement process declared irregular',
    publicDocuments: ['Petition', 'County Response', 'Procurement Records', 'Final Judgment']
  },
  {
    id: '3',
    caseNumber: 'ADMIN/2024/045',
    title: 'Healthcare Workers Union v. Ministry of Health - Salary Dispute',
    status: 'pending',
    dateRegistered: '2024-03-05',
    dateLastUpdated: '2024-06-15',
    summary: 'Administrative law case concerning healthcare workers\' salary increments and working conditions in public hospitals.',
    petitioner: 'Kenya Medical Practitioners Union',
    respondent: 'Ministry of Health',
    category: 'Employment Law',
    court: 'Employment and Labour Relations Court',
    judge: 'Justice A. Muriuki',
    publicDocuments: ['Petition', 'Ministry Response', 'CBA Documents']
  },
  {
    id: '4',
    caseNumber: 'CONST/2023/078',
    title: 'Education Access Rights - School Fees Challenge',
    status: 'concluded',
    dateRegistered: '2023-09-12',
    dateLastUpdated: '2024-01-20',
    summary: 'Constitutional petition challenging illegal school fees in public primary schools.',
    petitioner: 'Kenya Parents Association',
    respondent: 'Ministry of Education',
    category: 'Constitutional Law',
    court: 'High Court of Kenya',
    judge: 'Justice L. Githinji',
    outcome: 'Petition upheld - illegal fees declared unconstitutional',
    publicDocuments: ['Petition', 'Ministry Response', 'School Fee Guidelines', 'Final Judgment']
  },
  {
    id: '5',
    caseNumber: 'CIVIL/2024/123',
    title: 'Water Rights Case - Community Access to Clean Water',
    status: 'active',
    dateRegistered: '2024-04-20',
    dateLastUpdated: '2024-06-25',
    summary: 'Civil case seeking enforcement of constitutional right to clean and safe water for rural communities.',
    petitioner: 'Maasai Community Representatives',
    respondent: 'Ministry of Water and Sanitation',
    category: 'Constitutional Rights',
    court: 'High Court of Kenya',
    judge: 'Justice S. Oduya',
    publicDocuments: ['Petition', 'Ministry Response', 'Water Assessment Report']
  }
];

// Mock Societies Data
export const mockSocieties: Society[] = [
  {
    id: '1',
    registrationNumber: 'SOC/2024/0156',
    name: 'Kenya Youth Empowerment Foundation',
    dateRegistered: '2024-01-20',
    status: 'active',
    category: 'Youth Development',
    location: 'Nairobi County',
    objectives: 'To empower youth through skills development, mentorship programs, and entrepreneurship support initiatives.',
    registeredAddress: 'P.O. Box 12345, Nairobi',
    contactPerson: 'Mary Wanjiku',
    phoneNumber: '+254-700-123456',
    email: 'info@kyef.org'
  },
  {
    id: '2',
    registrationNumber: 'SOC/2023/0892',
    name: 'Coastal Environmental Conservation Society',
    dateRegistered: '2023-06-15',
    status: 'active',
    category: 'Environmental Conservation',
    location: 'Mombasa County',
    objectives: 'To promote marine conservation, beach cleanup initiatives, and environmental awareness along the Kenyan coast.',
    registeredAddress: 'P.O. Box 5678, Mombasa',
    contactPerson: 'Ahmed Hassan',
    phoneNumber: '+254-702-567890',
    email: 'conservation@coastalsociety.ke'
  },
  {
    id: '3',
    registrationNumber: 'SOC/2023/0445',
    name: 'Women in Technology Kenya',
    dateRegistered: '2023-03-10',
    status: 'active',
    category: 'Technology & Innovation',
    location: 'Nairobi County',
    objectives: 'To bridge the gender gap in technology through training, networking, and advocacy for women in tech.',
    registeredAddress: 'P.O. Box 9876, Nairobi',
    contactPerson: 'Grace Mutua',
    phoneNumber: '+254-705-987654',
    email: 'hello@witech.ke'
  },
  {
    id: '4',
    registrationNumber: 'SOC/2022/0234',
    name: 'Farmers Cooperative Development Union',
    dateRegistered: '2022-11-30',
    status: 'active',
    category: 'Agricultural Development',
    location: 'Nakuru County',
    objectives: 'To support smallholder farmers through cooperative farming, market access, and agricultural training programs.',
    registeredAddress: 'P.O. Box 3456, Nakuru',
    contactPerson: 'John Kiprotich',
    phoneNumber: '+254-708-345678',
    email: 'support@farmersunion.ke'
  },
  {
    id: '5',
    registrationNumber: 'SOC/2024/0067',
    name: 'Digital Literacy for All Initiative',
    dateRegistered: '2024-02-28',
    status: 'active',
    category: 'Education & Training',
    location: 'Kisumu County',
    objectives: 'To promote digital literacy and computer skills training for underserved communities across Kenya.',
    registeredAddress: 'P.O. Box 7890, Kisumu',
    contactPerson: 'Susan Atieno',
    phoneNumber: '+254-712-789012',
    email: 'info@digitalliteracy.ke'
  },
  {
    id: '6',
    registrationNumber: 'SOC/2023/0678',
    name: 'Community Health Workers Association',
    dateRegistered: '2023-08-22',
    status: 'under-review',
    category: 'Healthcare',
    location: 'Machakos County',
    objectives: 'To train and support community health workers in providing primary healthcare services in rural areas.',
    registeredAddress: 'P.O. Box 4567, Machakos',
    contactPerson: 'David Musyoka',
    phoneNumber: '+254-715-456789'
  }
];

// Real Adoption Statistics (2020-2025)
export const mockAdoptionStats: AdoptionStats = {
  totalAdoptions: 2079,
  thisYear: 381,
  averageProcessingTime: '8-12 months',
  byAgeGroup: [
    { ageRange: '0-2 years', count: 1247 },
    { ageRange: '3-5 years', count: 624 },
    { ageRange: '6-10 years', count: 156 },
    { ageRange: '11+ years', count: 52 }
  ],
  byRegion: [
    { region: 'Nairobi', count: 623 },
    { region: 'Central Kenya', count: 416 },
    { region: 'Coast', count: 312 },
    { region: 'Western Kenya', count: 291 },
    { region: 'Northern Kenya', count: 228 },
    { region: 'Eastern Kenya', count: 209 }
  ],
  completionRate: 78.5,
  yearlyBreakdown: [
    { year: '2020', female: 127, male: 124, total: 251 },
    { year: '2021', female: 172, male: 169, total: 341 },
    { year: '2022', female: 162, male: 135, total: 297 },
    { year: '2023', female: 248, male: 220, total: 468 },
    { year: '2024', female: 170, male: 165, total: 335 },
    { year: '2025', female: 186, male: 195, total: 381 }
  ]
};

// Helper functions for searching
export const searchMarriages = (query: string): MarriageVerification[] => {
  if (!query.trim()) return mockMarriages;
  
  const lowerQuery = query.toLowerCase();
  return mockMarriages.filter(marriage => 
    marriage.certificateNumber.toLowerCase().includes(lowerQuery) ||
    marriage.registrationLocation.toLowerCase().includes(lowerQuery)
  );
};

export const searchPublicCases = (query: string): PublicCase[] => {
  if (!query.trim()) return mockPublicCases;
  
  const lowerQuery = query.toLowerCase();
  return mockPublicCases.filter(publicCase => 
    publicCase.caseNumber.toLowerCase().includes(lowerQuery) ||
    publicCase.title.toLowerCase().includes(lowerQuery) ||
    publicCase.petitioner.toLowerCase().includes(lowerQuery) ||
    publicCase.respondent.toLowerCase().includes(lowerQuery) ||
    publicCase.category.toLowerCase().includes(lowerQuery)
  );
};

export const searchSocieties = (query: string): Society[] => {
  if (!query.trim()) return mockSocieties;
  
  const lowerQuery = query.toLowerCase();
  return mockSocieties.filter(society => 
    society.name.toLowerCase().includes(lowerQuery) ||
    society.registrationNumber.toLowerCase().includes(lowerQuery) ||
    society.category.toLowerCase().includes(lowerQuery) ||
    society.location.toLowerCase().includes(lowerQuery)
  );
};