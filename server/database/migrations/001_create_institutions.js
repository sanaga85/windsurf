/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('institutions', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    
    // Basic Information
    table.string('name').notNullable();
    table.string('slug').unique().notNullable();
    table.string('subdomain').unique().notNullable();
    table.enum('type', ['school', 'university', 'corporate', 'coaching']).notNullable();
    table.string('email').unique();
    table.string('phone');
    table.text('address');
    table.string('website');
    
    // Branding configuration
    table.json('branding').defaultTo('{}');
    table.string('logo_url');
    table.string('favicon_url');
    table.string('primary_color').defaultTo('#1976d2');
    table.string('secondary_color').defaultTo('#dc004e');
    
    // Institution settings
    table.json('settings').defaultTo('{}');
    table.json('features').defaultTo('{}');
    table.boolean('is_active').defaultTo(true);
    table.boolean('is_trial').defaultTo(true);
    table.timestamp('trial_ends_at');
    table.timestamp('subscription_ends_at');
    
    // Resource Limits
    table.integer('max_users').defaultTo(1000);
    table.integer('max_storage_gb').defaultTo(100);
    table.integer('max_courses').defaultTo(500);
    table.integer('max_content_items').defaultTo(10000);
    table.integer('max_library_items').defaultTo(5000);
    
    // Current Usage Tracking
    table.integer('current_users').defaultTo(0);
    table.decimal('current_storage_gb', 10, 2).defaultTo(0);
    table.integer('current_courses').defaultTo(0);
    table.integer('current_content_items').defaultTo(0);
    table.integer('current_library_items').defaultTo(0);
    
    // Localization and Regional Settings
    table.string('timezone').defaultTo('UTC');
    table.string('language').defaultTo('en');
    table.string('country');
    table.string('currency').defaultTo('USD');
    table.string('date_format').defaultTo('YYYY-MM-DD');
    table.string('time_format').defaultTo('24h');
    
    // Academic Settings
    table.string('academic_year_start').defaultTo('09-01'); // MM-DD format
    table.string('academic_year_end').defaultTo('06-30'); // MM-DD format
    table.json('grading_system').defaultTo('{}');
    table.json('attendance_settings').defaultTo('{}');
    
    // Subscription and Billing
    table.enum('subscription_plan', ['free', 'basic', 'premium', 'enterprise']).defaultTo('free');
    table.decimal('monthly_fee', 10, 2).defaultTo(0);
    table.string('billing_email');
    table.json('billing_address').defaultTo('{}');
    table.string('tax_id');
    table.boolean('auto_billing').defaultTo(false);
    
    // Integration Settings
    table.json('sms_config').defaultTo('{}'); // SMS provider settings
    table.json('email_config').defaultTo('{}'); // Email provider settings
    table.json('storage_config').defaultTo('{}'); // File storage settings
    table.json('analytics_config').defaultTo('{}'); // Analytics settings
    table.json('backup_config').defaultTo('{}'); // Backup settings
    
    // Security Settings
    table.boolean('enforce_2fa').defaultTo(false);
    table.integer('password_min_length').defaultTo(8);
    table.boolean('password_require_special').defaultTo(true);
    table.boolean('password_require_numbers').defaultTo(true);
    table.boolean('password_require_uppercase').defaultTo(true);
    table.integer('session_timeout_minutes').defaultTo(30);
    table.boolean('single_device_login').defaultTo(true);
    table.integer('max_login_attempts').defaultTo(5);
    table.integer('lockout_duration_minutes').defaultTo(15);
    
    // Content and Library Settings
    table.json('allowed_file_types').defaultTo('["pdf","mp4","mp3","epub","docx","jpg","jpeg","png","gif"]');
    table.integer('max_file_size_mb').defaultTo(100);
    table.boolean('auto_process_content').defaultTo(true);
    table.boolean('enable_content_versioning').defaultTo(true);
    table.json('library_borrowing_rules').defaultTo('{}');
    
    // Communication Settings
    table.boolean('enable_notifications').defaultTo(true);
    table.boolean('enable_email_notifications').defaultTo(true);
    table.boolean('enable_sms_notifications').defaultTo(true);
    table.boolean('enable_push_notifications').defaultTo(true);
    table.json('notification_preferences').defaultTo('{}');
    
    // Feature Flags
    table.boolean('enable_webinars').defaultTo(true);
    table.boolean('enable_blog').defaultTo(true);
    table.boolean('enable_external_library').defaultTo(true);
    table.boolean('enable_analytics').defaultTo(true);
    table.boolean('enable_mobile_app').defaultTo(false);
    table.boolean('enable_ai_features').defaultTo(false);
    table.boolean('enable_discussion_forums').defaultTo(false);
    table.boolean('enable_assignments').defaultTo(false);
    table.boolean('enable_assessments').defaultTo(false);
    table.boolean('enable_certificates').defaultTo(false);
    
    // Custom Domain
    table.string('custom_domain');
    table.boolean('custom_domain_verified').defaultTo(false);
    table.timestamp('custom_domain_verified_at');
    table.string('ssl_certificate_status').defaultTo('pending');
    
    // Support and Maintenance
    table.enum('support_level', ['basic', 'standard', 'premium', 'enterprise']).defaultTo('basic');
    table.string('support_contact_email');
    table.string('support_contact_phone');
    table.json('maintenance_windows').defaultTo('[]');
    table.timestamp('last_backup_at');
    table.timestamp('last_maintenance_at');
    
    // Performance and Monitoring
    table.boolean('enable_monitoring').defaultTo(true);
    table.boolean('enable_error_tracking').defaultTo(true);
    table.boolean('enable_performance_tracking').defaultTo(true);
    table.json('monitoring_config').defaultTo('{}');
    
    // Compliance and Legal
    table.boolean('gdpr_compliant').defaultTo(false);
    table.boolean('coppa_compliant').defaultTo(false);
    table.boolean('ferpa_compliant').defaultTo(false);
    table.json('compliance_settings').defaultTo('{}');
    table.string('privacy_policy_url');
    table.string('terms_of_service_url');
    
    // Metadata
    table.timestamps(true, true);
    table.timestamp('deleted_at');
    
    // Indexes
    table.index(['slug']);
    table.index(['subdomain']);
    table.index(['type']);
    table.index(['is_active']);
    table.index(['subscription_plan']);
    table.index(['timezone']);
    table.index(['country']);
    table.index(['custom_domain']);
    table.index(['support_level']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('institutions');
};