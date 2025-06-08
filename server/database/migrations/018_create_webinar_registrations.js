/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('webinar_registrations', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('webinar_id').references('id').inTable('webinars').onDelete('CASCADE');
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.uuid('institution_id').references('id').inTable('institutions').onDelete('CASCADE');
    
    // Registration Information
    table.enum('status', ['pending', 'approved', 'rejected', 'cancelled', 'attended', 'no_show']).defaultTo('pending');
    table.timestamp('registered_at').defaultTo(knex.fn.now());
    table.timestamp('approved_at');
    table.uuid('approved_by').references('id').inTable('users').onDelete('SET NULL');
    table.text('rejection_reason');
    table.text('cancellation_reason');
    
    // Custom Registration Data
    table.json('registration_data').defaultTo('{}'); // Custom form fields
    table.text('questions_answers'); // Q&A responses
    table.text('special_requirements');
    table.boolean('dietary_restrictions').defaultTo(false);
    table.text('dietary_details');
    
    // Attendance Tracking
    table.timestamp('joined_at');
    table.timestamp('left_at');
    table.integer('total_duration_minutes').defaultTo(0);
    table.integer('active_duration_minutes').defaultTo(0); // Time actually engaged
    table.boolean('attended_full_session').defaultTo(false);
    table.decimal('attendance_percentage', 5, 2).defaultTo(0);
    
    // Engagement Metrics
    table.integer('chat_messages_sent').defaultTo(0);
    table.integer('questions_asked').defaultTo(0);
    table.integer('polls_participated').defaultTo(0);
    table.integer('reactions_sent').defaultTo(0);
    table.boolean('used_microphone').defaultTo(false);
    table.boolean('used_camera').defaultTo(false);
    table.boolean('shared_screen').defaultTo(false);
    table.decimal('engagement_score', 3, 2).defaultTo(0); // 0-5
    
    // Technical Information
    table.string('join_method'); // web, mobile, phone
    table.string('device_type'); // desktop, mobile, tablet
    table.string('browser_name');
    table.string('browser_version');
    table.string('os_name');
    table.string('connection_quality'); // excellent, good, fair, poor
    table.integer('connection_issues_count').defaultTo(0);
    table.json('technical_issues').defaultTo('[]');
    
    // Notifications
    table.boolean('confirmation_sent').defaultTo(false);
    table.timestamp('confirmation_sent_at');
    table.boolean('reminder_sent').defaultTo(false);
    table.timestamp('reminder_sent_at');
    table.boolean('follow_up_sent').defaultTo(false);
    table.timestamp('follow_up_sent_at');
    
    // Feedback and Evaluation
    table.integer('rating').defaultTo(0); // 1-5 stars
    table.text('feedback');
    table.json('evaluation_responses').defaultTo('{}'); // Survey responses
    table.boolean('would_recommend').defaultTo(false);
    table.timestamp('feedback_submitted_at');
    
    // Certificate and Completion
    table.boolean('certificate_eligible').defaultTo(false);
    table.boolean('certificate_issued').defaultTo(false);
    table.string('certificate_url');
    table.timestamp('certificate_issued_at');
    table.string('certificate_id');
    
    // Recording Access
    table.boolean('recording_access_granted').defaultTo(false);
    table.timestamp('recording_accessed_at');
    table.integer('recording_view_count').defaultTo(0);
    table.integer('recording_download_count').defaultTo(0);
    
    // Metadata
    table.json('metadata').defaultTo('{}');
    table.timestamps(true, true);
    
    // Indexes
    table.index(['webinar_id']);
    table.index(['user_id']);
    table.index(['institution_id']);
    table.index(['status']);
    table.index(['registered_at']);
    table.index(['attended_full_session']);
    table.index(['certificate_eligible']);
    table.index(['certificate_issued']);
    
    // Composite indexes
    table.index(['webinar_id', 'status']);
    table.index(['webinar_id', 'user_id']);
    table.index(['user_id', 'status']);
    table.index(['institution_id', 'registered_at']);
    
    // Unique constraints
    table.unique(['webinar_id', 'user_id']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('webinar_registrations');
};