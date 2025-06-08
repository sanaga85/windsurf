require('dotenv').config();

module.exports = {
  // Server Configuration
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  apiVersion: process.env.API_VERSION || 'v1',

  // Database Configuration
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || 'scholarbridge_lms',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres123',
    ssl: process.env.DB_SSL === 'true',
    pool: {
      min: 2,
      max: 10,
      acquireTimeoutMillis: 30000,
      createTimeoutMillis: 30000,
      destroyTimeoutMillis: 5000,
      idleTimeoutMillis: 30000,
      reapIntervalMillis: 1000,
      createRetryIntervalMillis: 100
    }
  },

  // Redis Configuration
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || null,
    db: 0,
    retryDelayOnFailover: 100,
    enableReadyCheck: false,
    maxRetriesPerRequest: null
  },

  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key',
    expiresIn: process.env.JWT_EXPIRE || '30m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRE || '7d'
  },

  // File Upload Configuration
  upload: {
    maxFileSize: process.env.MAX_FILE_SIZE || '100MB',
    uploadPath: process.env.UPLOAD_PATH || './uploads',
    allowedFileTypes: (process.env.ALLOWED_FILE_TYPES || 'pdf,mp4,mp3,epub,docx,jpg,jpeg,png,gif').split(','),
    maxFiles: 10
  },

  // Email Configuration
  email: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    },
    from: {
      email: process.env.FROM_EMAIL || 'noreply@scholarbridgelms.com',
      name: process.env.FROM_NAME || 'ScholarBridge LMS'
    }
  },

  // SMS Configuration
  sms: {
    msg91: {
      apiKey: process.env.MSG91_API_KEY,
      senderId: process.env.MSG91_SENDER_ID || 'SCHLMS'
    },
    twoFactor: {
      apiKey: process.env.TWOFACTOR_API_KEY
    }
  },

  // External APIs
  externalApis: {
    googleBooks: {
      apiKey: process.env.GOOGLE_BOOKS_API_KEY
    },
    youtube: {
      apiKey: process.env.YOUTUBE_API_KEY
    }
  },

  // Security Configuration
  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 12,
    sessionTimeout: parseInt(process.env.SESSION_TIMEOUT) || 30, // minutes
    maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 5,
    lockoutTime: parseInt(process.env.LOCKOUT_TIME) || 15 // minutes
  },

  // Rate Limiting
  rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW) || 15, // minutes
  rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,

  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    filePath: process.env.LOG_FILE_PATH || './logs'
  },

  // Institution Types
  institutionTypes: {
    SCHOOL: 'school',
    UNIVERSITY: 'university',
    CORPORATE: 'corporate',
    COACHING: 'coaching'
  },

  // User Roles
  userRoles: {
    SUPER_ADMIN: 'super_admin',
    INSTITUTION_ADMIN: 'institution_admin',
    FACULTY: 'faculty',
    STUDENT: 'student',
    LIBRARIAN: 'librarian',
    PARENT: 'parent',
    GUEST: 'guest'
  },

  // Content Types
  contentTypes: {
    PDF: 'pdf',
    VIDEO: 'mp4',
    AUDIO: 'mp3',
    EPUB: 'epub',
    DOCUMENT: 'docx',
    IMAGE: 'image',
    URL: 'url'
  },

  // Library Item Types
  libraryItemTypes: {
    BOOK: 'book',
    JOURNAL: 'journal',
    ARTICLE: 'article',
    VIDEO: 'video',
    AUDIO: 'audio',
    DOCUMENT: 'document',
    URL: 'url'
  },

  // Borrowing Limits by Role
  borrowingLimits: {
    student: { maxBooks: 2, durationDays: 14 },
    faculty: { maxBooks: 5, durationDays: 30 },
    librarian: { maxBooks: 10, durationDays: 30 },
    default: { maxBooks: 2, durationDays: 14 }
  }
};