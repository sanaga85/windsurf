export interface Institution {
  id: string;
  name: string;
  slug: string;
  subdomain: string;
  type: InstitutionType;
  email?: string;
  phone?: string;
  address?: string;
  website?: string;
  
  // Branding
  logoUrl?: string;
  faviconUrl?: string;
  themeColors: ThemeColors;
  brandingConfig: BrandingConfig;
  
  // Configuration
  settings: InstitutionSettings;
  features: InstitutionFeatures;
  isActive: boolean;
  isTrial: boolean;
  trialEndsAt?: string;
  subscriptionPlan?: string;
  subscriptionEndsAt?: string;
  
  // Limits
  maxUsers: number;
  maxStorage: number; // in bytes
  maxCourses: number;
  
  // Metadata
  createdAt: string;
  updatedAt: string;
}

export type InstitutionType = 'school' | 'university' | 'corporate' | 'coaching';

export interface ThemeColors {
  primary?: string;
  secondary?: string;
  accent?: string;
  background?: string;
  surface?: string;
  text?: string;
  [key: string]: string | undefined;
}

export interface BrandingConfig {
  heroSection?: {
    title?: string;
    subtitle?: string;
    backgroundImage?: string;
    backgroundColor?: string;
  };
  loginPage?: {
    backgroundImage?: string;
    backgroundColor?: string;
    logoPosition?: 'top' | 'center' | 'left' | 'right';
    showInstitutionName?: boolean;
  };
  footer?: {
    text?: string;
    links?: Array<{
      label: string;
      url: string;
    }>;
    showPoweredBy?: boolean;
  };
  customCSS?: string;
  [key: string]: any;
}

export interface InstitutionSettings {
  // Academic settings
  academicYear?: {
    start: string;
    end: string;
  };
  grading?: {
    system: 'percentage' | 'gpa' | 'letter';
    scale?: number;
  };
  
  // Course structure
  courseStructure?: {
    levels: Array<{
      name: string;
      label: string;
    }>;
  };
  
  // Library settings
  library?: {
    borrowingLimits: Record<string, {
      maxBooks: number;
      durationDays: number;
    }>;
    finePerDay?: number;
    renewalLimit?: number;
  };
  
  // Notification settings
  notifications?: {
    email: boolean;
    sms: boolean;
    push: boolean;
    channels: string[];
  };
  
  // Security settings
  security?: {
    passwordPolicy: {
      minLength: number;
      requireUppercase: boolean;
      requireLowercase: boolean;
      requireNumbers: boolean;
      requireSymbols: boolean;
    };
    sessionTimeout: number; // in minutes
    maxLoginAttempts: number;
    lockoutDuration: number; // in minutes
    twoFactorRequired: boolean;
  };
  
  // Integration settings
  integrations?: {
    googleWorkspace?: {
      enabled: boolean;
      domain?: string;
    };
    microsoftOffice?: {
      enabled: boolean;
      tenantId?: string;
    };
    zoom?: {
      enabled: boolean;
      apiKey?: string;
    };
    [key: string]: any;
  };
  
  [key: string]: any;
}

export interface InstitutionFeatures {
  // Core features
  courses: boolean;
  library: boolean;
  analytics: boolean;
  messaging: boolean;
  
  // Advanced features
  webinars: boolean;
  blogs: boolean;
  forums: boolean;
  assignments: boolean;
  assessments: boolean;
  gradebook: boolean;
  attendance: boolean;
  
  // Integration features
  videoConferencing: boolean;
  documentCollaboration: boolean;
  mobileApp: boolean;
  api: boolean;
  
  // Administrative features
  bulkOperations: boolean;
  dataExport: boolean;
  customReports: boolean;
  whiteLabeling: boolean;
  
  [key: string]: boolean;
}

export interface InstitutionStats {
  totalUsers: number;
  activeUsers: number;
  totalCourses: number;
  activeCourses: number;
  totalContent: number;
  storageUsed: number; // in bytes
  libraryItems: number;
  
  // Usage stats
  dailyActiveUsers: number;
  weeklyActiveUsers: number;
  monthlyActiveUsers: number;
  
  // Content stats
  contentViews: number;
  contentDownloads: number;
  libraryBorrows: number;
  
  // Engagement stats
  averageSessionDuration: number; // in minutes
  coursesCompleted: number;
  assignmentsSubmitted: number;
}

export interface InstitutionUsage {
  date: string;
  activeUsers: number;
  contentViews: number;
  libraryAccess: number;
  storageUsed: number;
}

// Institution type configurations
export const INSTITUTION_TYPE_CONFIG: Record<InstitutionType, {
  name: string;
  description: string;
  defaultStructure: Array<{
    level: number;
    name: string;
    label: string;
  }>;
  defaultFeatures: Partial<InstitutionFeatures>;
}> = {
  school: {
    name: 'School',
    description: 'K-12 educational institutions',
    defaultStructure: [
      { level: 1, name: 'class', label: 'Class' },
      { level: 2, name: 'subject', label: 'Subject' },
      { level: 3, name: 'chapter', label: 'Chapter' },
    ],
    defaultFeatures: {
      courses: true,
      library: true,
      analytics: true,
      messaging: true,
      attendance: true,
      gradebook: true,
    },
  },
  university: {
    name: 'University',
    description: 'Higher education institutions',
    defaultStructure: [
      { level: 1, name: 'program', label: 'Program' },
      { level: 2, name: 'semester', label: 'Semester' },
      { level: 3, name: 'course', label: 'Course' },
      { level: 4, name: 'chapter', label: 'Chapter' },
    ],
    defaultFeatures: {
      courses: true,
      library: true,
      analytics: true,
      messaging: true,
      webinars: true,
      blogs: true,
      forums: true,
      assignments: true,
      assessments: true,
    },
  },
  corporate: {
    name: 'Corporate',
    description: 'Corporate training organizations',
    defaultStructure: [
      { level: 1, name: 'department', label: 'Department' },
      { level: 2, name: 'module', label: 'Module' },
      { level: 3, name: 'course', label: 'Course' },
      { level: 4, name: 'section', label: 'Section' },
    ],
    defaultFeatures: {
      courses: true,
      library: true,
      analytics: true,
      messaging: true,
      webinars: true,
      assignments: true,
      assessments: true,
      customReports: true,
    },
  },
  coaching: {
    name: 'Coaching Institute',
    description: 'Coaching and test preparation institutes',
    defaultStructure: [
      { level: 1, name: 'batch', label: 'Batch' },
      { level: 2, name: 'subject', label: 'Subject' },
      { level: 3, name: 'topic', label: 'Topic' },
      { level: 4, name: 'subtopic', label: 'Subtopic' },
    ],
    defaultFeatures: {
      courses: true,
      library: true,
      analytics: true,
      messaging: true,
      assessments: true,
      attendance: true,
      gradebook: true,
    },
  },
};

export interface TenantResolutionResult {
  institution: Institution;
  subdomain: string;
  isCustomDomain: boolean;
}

export interface TenantError {
  code: 'TENANT_NOT_FOUND' | 'TENANT_INACTIVE' | 'TENANT_SUSPENDED' | 'INVALID_DOMAIN';
  message: string;
}