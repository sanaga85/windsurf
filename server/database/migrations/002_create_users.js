/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('users', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('institution_id').references('id').inTable('institutions').onDelete('CASCADE');
    
    // Basic user information
    table.string('username').notNullable();
    table.string('email');
    table.string('phone').notNullable();
    table.string('password_hash').notNullable();
    table.string('first_name').notNullable();
    table.string('last_name').notNullable();
    
    // Role and permissions
    table.enum('role', ['super_admin', 'institution_admin', 'faculty', 'student', 'librarian', 'parent', 'guest']).notNullable();
    table.json('permissions').defaultTo('[]');
    
    // Profile information
    table.string('profile_picture_url');
    table.text('bio');
    table.date('date_of_birth');
    table.enum('gender', ['male', 'female', 'other']);
    table.json('address').defaultTo('{}');
    
    // Authentication and security
    table.boolean('is_active').defaultTo(true);
    table.boolean('email_verified').defaultTo(false);
    table.boolean('phone_verified').defaultTo(false);
    table.boolean('force_password_change').defaultTo(true);
    table.timestamp('last_login_at');
    table.string('last_login_ip');
    table.integer('failed_login_attempts').defaultTo(0);
    table.timestamp('locked_until');
    
    // OTP for password reset
    table.string('otp_hash');
    table.timestamp('otp_expires_at');
    table.integer('otp_attempts').defaultTo(0);
    
    // Session management
    table.string('refresh_token_hash');
    table.timestamp('refresh_token_expires_at');
    
    // Session Management for Single Device Policy
    table.string('current_session_id');
    table.json('last_device_info').defaultTo('{}');
    table.string('device_fingerprint');
    table.timestamp('last_device_change_at');
    
    // Enhanced Security
    table.boolean('two_factor_enabled').defaultTo(false);
    table.string('two_factor_secret');
    table.json('backup_codes').defaultTo('[]');
    table.timestamp('two_factor_enabled_at');
    table.integer('consecutive_failed_2fa').defaultTo(0);
    
    // Password History (for preventing reuse)
    table.json('password_history').defaultTo('[]'); // Store hashes of last 5 passwords
    table.timestamp('password_changed_at');
    table.boolean('password_never_expires').defaultTo(false);
    table.integer('password_expiry_days').defaultTo(90);
    
    // Enhanced Profile Information
    table.string('employee_id'); // For corporate institutions
    table.string('student_id'); // For educational institutions
    table.string('department');
    table.string('designation');
    table.string('grade_level'); // For students
    table.string('academic_year');
    table.date('enrollment_date');
    table.date('graduation_date');
    table.enum('employment_status', ['active', 'inactive', 'terminated', 'on_leave']).defaultTo('active');
    
    // Contact Information
    table.string('alternate_email');
    table.string('alternate_phone');
    table.string('emergency_contact_name');
    table.string('emergency_contact_phone');
    table.string('emergency_contact_relationship');
    
    // Preferences and Settings
    table.string('preferred_language').defaultTo('en');
    table.string('timezone').defaultTo('UTC');
    table.enum('theme_preference', ['light', 'dark', 'auto']).defaultTo('light');
    table.json('notification_preferences').defaultTo('{}');
    table.json('privacy_settings').defaultTo('{}');
    table.json('accessibility_settings').defaultTo('{}');
    
    // Learning and Progress
    table.json('learning_preferences').defaultTo('{}');
    table.json('skills').defaultTo('[]');
    table.json('interests').defaultTo('[]');
    table.json('certifications').defaultTo('[]');
    table.decimal('overall_progress', 5, 2).defaultTo(0);
    table.integer('total_courses_enrolled').defaultTo(0);
    table.integer('total_courses_completed').defaultTo(0);
    table.integer('total_content_viewed').defaultTo(0);
    table.integer('total_library_items_borrowed').defaultTo(0);
    
    // Activity and Engagement
    table.integer('login_streak').defaultTo(0);
    table.integer('max_login_streak').defaultTo(0);
    table.timestamp('streak_started_at');
    table.integer('total_session_time_minutes').defaultTo(0);
    table.decimal('average_session_duration', 8, 2).defaultTo(0);
    table.integer('content_creation_count').defaultTo(0);
    table.integer('forum_posts_count').defaultTo(0);
    table.integer('comments_count').defaultTo(0);
    table.decimal('engagement_score', 5, 2).defaultTo(0);
    
    // Parent/Guardian Information (for students)
    table.uuid('parent_user_id').references('id').inTable('users').onDelete('SET NULL');
    table.string('parent_name');
    table.string('parent_email');
    table.string('parent_phone');
    table.string('guardian_name');
    table.string('guardian_email');
    table.string('guardian_phone');
    table.string('guardian_relationship');
    
    // Institution-specific Data
    table.json('custom_fields').defaultTo('{}'); // Institution-defined fields
    table.json('academic_records').defaultTo('{}');
    table.json('disciplinary_records').defaultTo('[]');
    table.json('achievements').defaultTo('[]');
    table.json('awards').defaultTo('[]');
    
    // Compliance and Consent
    table.boolean('terms_accepted').defaultTo(false);
    table.timestamp('terms_accepted_at');
    table.string('terms_version');
    table.boolean('privacy_policy_accepted').defaultTo(false);
    table.timestamp('privacy_policy_accepted_at');
    table.string('privacy_policy_version');
    table.boolean('marketing_consent').defaultTo(false);
    table.boolean('data_processing_consent').defaultTo(false);
    
    // Account Status and Lifecycle
    table.enum('account_status', ['pending', 'active', 'suspended', 'deactivated', 'archived']).defaultTo('pending');
    table.string('suspension_reason');
    table.timestamp('suspended_at');
    table.uuid('suspended_by').references('id').inTable('users').onDelete('SET NULL');
    table.timestamp('reactivated_at');
    table.uuid('reactivated_by').references('id').inTable('users').onDelete('SET NULL');
    table.timestamp('archived_at');
    table.uuid('archived_by').references('id').inTable('users').onDelete('SET NULL');
    
    // Data Export and Portability
    table.boolean('data_export_requested').defaultTo(false);
    table.timestamp('data_export_requested_at');
    table.string('data_export_status').defaultTo('none'); // none, processing, ready, expired
    table.string('data_export_url');
    table.timestamp('data_export_expires_at');
    
    // API and Integration
    table.string('api_key_hash');
    table.timestamp('api_key_created_at');
    table.timestamp('api_key_last_used_at');
    table.integer('api_requests_count').defaultTo(0);
    table.json('external_integrations').defaultTo('{}');
    
    // Metadata
    table.timestamps(true, true);
    table.timestamp('deleted_at');
    
    // Indexes
    table.index(['institution_id']);
    table.index(['username', 'institution_id']);
    table.index(['email']);
    table.index(['phone']);
    table.index(['role']);
    table.index(['is_active']);
    table.index(['current_session_id']);
    table.index(['employee_id']);
    table.index(['student_id']);
    table.index(['department']);
    table.index(['grade_level']);
    table.index(['account_status']);
    table.index(['parent_user_id']);
    table.index(['enrollment_date']);
    table.index(['two_factor_enabled']);
    table.index(['preferred_language']);
    table.index(['timezone']);
    
    // Unique constraints
    table.unique(['username', 'institution_id']);
    table.unique(['phone', 'institution_id']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('users');
};