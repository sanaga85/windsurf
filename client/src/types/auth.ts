export interface User {
  id: string;
  username: string;
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  avatarUrl?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other';
  bio?: string;
  role: UserRole;
  permissions: string[];
  institutionId: string;
  profileCompleted: boolean;
  forcePasswordChange: boolean;
  twoFactorEnabled: boolean;
  preferences: UserPreferences;
  language: string;
  timezone: string;
  darkMode: boolean;
  notificationSettings: NotificationSettings;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export type UserRole = 
  | 'super_admin'
  | 'institution_admin'
  | 'faculty'
  | 'student'
  | 'librarian'
  | 'parent'
  | 'guest';

export interface UserPreferences {
  theme?: 'light' | 'dark' | 'system';
  language?: string;
  timezone?: string;
  emailNotifications?: boolean;
  smsNotifications?: boolean;
  pushNotifications?: boolean;
  [key: string]: any;
}

export interface NotificationSettings {
  email: boolean;
  sms: boolean;
  push: boolean;
  courseUpdates: boolean;
  assignments: boolean;
  announcements: boolean;
  reminders: boolean;
  [key: string]: boolean;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface CompleteProfileRequest {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other';
}

export interface ForgotPasswordRequest {
  identifier: string; // username, email, or phone
}

export interface ForgotPasswordResponse {
  resetToken: string;
  method: 'SMS' | 'Email';
}

export interface ResetPasswordRequest {
  token: string;
  otp: string;
  newPassword: string;
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other';
  bio?: string;
  language?: string;
  timezone?: string;
  darkMode?: boolean;
  notificationSettings?: Partial<NotificationSettings>;
}

export interface TwoFactorSetupResponse {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

export interface TwoFactorVerifyRequest {
  token: string;
}

export interface AuthError {
  message: string;
  code?: string;
  field?: string;
}

// Permission constants
export const PERMISSIONS = {
  // User management
  USERS_VIEW: 'users:view',
  USERS_CREATE: 'users:create',
  USERS_UPDATE: 'users:update',
  USERS_DELETE: 'users:delete',
  
  // Course management
  COURSES_VIEW: 'courses:view',
  COURSES_CREATE: 'courses:create',
  COURSES_UPDATE: 'courses:update',
  COURSES_DELETE: 'courses:delete',
  
  // Content management
  CONTENT_VIEW: 'content:view',
  CONTENT_UPLOAD: 'content:upload',
  CONTENT_UPDATE: 'content:update',
  CONTENT_DELETE: 'content:delete',
  
  // Library management
  LIBRARY_VIEW: 'library:view',
  LIBRARY_MANAGE: 'library:manage',
  LIBRARY_BORROW: 'library:borrow',
  
  // Analytics
  ANALYTICS_VIEW: 'analytics:view',
  ANALYTICS_EXPORT: 'analytics:export',
  
  // Institution management
  INSTITUTION_SETTINGS: 'institution:settings',
  INSTITUTION_BRANDING: 'institution:branding',
  
  // System administration
  SYSTEM_ADMIN: 'system:admin',
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

// Role-based permissions mapping
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  super_admin: Object.values(PERMISSIONS),
  institution_admin: [
    PERMISSIONS.USERS_VIEW,
    PERMISSIONS.USERS_CREATE,
    PERMISSIONS.USERS_UPDATE,
    PERMISSIONS.USERS_DELETE,
    PERMISSIONS.COURSES_VIEW,
    PERMISSIONS.COURSES_CREATE,
    PERMISSIONS.COURSES_UPDATE,
    PERMISSIONS.COURSES_DELETE,
    PERMISSIONS.CONTENT_VIEW,
    PERMISSIONS.CONTENT_UPLOAD,
    PERMISSIONS.CONTENT_UPDATE,
    PERMISSIONS.CONTENT_DELETE,
    PERMISSIONS.LIBRARY_VIEW,
    PERMISSIONS.LIBRARY_MANAGE,
    PERMISSIONS.ANALYTICS_VIEW,
    PERMISSIONS.ANALYTICS_EXPORT,
    PERMISSIONS.INSTITUTION_SETTINGS,
    PERMISSIONS.INSTITUTION_BRANDING,
  ],
  faculty: [
    PERMISSIONS.USERS_VIEW,
    PERMISSIONS.COURSES_VIEW,
    PERMISSIONS.COURSES_UPDATE,
    PERMISSIONS.CONTENT_VIEW,
    PERMISSIONS.CONTENT_UPLOAD,
    PERMISSIONS.CONTENT_UPDATE,
    PERMISSIONS.LIBRARY_VIEW,
    PERMISSIONS.LIBRARY_BORROW,
    PERMISSIONS.ANALYTICS_VIEW,
  ],
  student: [
    PERMISSIONS.COURSES_VIEW,
    PERMISSIONS.CONTENT_VIEW,
    PERMISSIONS.LIBRARY_VIEW,
    PERMISSIONS.LIBRARY_BORROW,
  ],
  librarian: [
    PERMISSIONS.LIBRARY_VIEW,
    PERMISSIONS.LIBRARY_MANAGE,
    PERMISSIONS.CONTENT_VIEW,
  ],
  parent: [
    PERMISSIONS.COURSES_VIEW,
    PERMISSIONS.ANALYTICS_VIEW,
  ],
  guest: [
    PERMISSIONS.COURSES_VIEW,
    PERMISSIONS.CONTENT_VIEW,
  ],
};