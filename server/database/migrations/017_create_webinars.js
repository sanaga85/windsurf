/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('webinars', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('institution_id').references('id').inTable('institutions').onDelete('CASCADE');
    table.uuid('created_by').references('id').inTable('users').onDelete('SET NULL');
    table.uuid('course_id').references('id').inTable('courses').onDelete('SET NULL');
    
    // Webinar Information
    table.string('title').notNullable();
    table.text('description');
    table.string('agenda');
    table.json('learning_objectives').defaultTo('[]');
    table.string('thumbnail_url');
    table.json('tags').defaultTo('[]');
    
    // Scheduling
    table.timestamp('scheduled_at').notNullable();
    table.integer('duration_minutes').defaultTo(60);
    table.timestamp('actual_start_time');
    table.timestamp('actual_end_time');
    table.string('timezone').defaultTo('UTC');
    
    // Recurrence
    table.boolean('is_recurring').defaultTo(false);
    table.enum('recurrence_type', ['daily', 'weekly', 'monthly', 'custom']).defaultTo('weekly');
    table.json('recurrence_config').defaultTo('{}'); // Days, intervals, end date
    table.uuid('parent_webinar_id').references('id').inTable('webinars').onDelete('CASCADE');
    
    // Platform Integration
    table.enum('platform', ['zoom', 'teams', 'meet', 'webex', 'built_in']).defaultTo('built_in');
    table.string('platform_meeting_id');
    table.string('platform_meeting_url');
    table.string('platform_password');
    table.json('platform_config').defaultTo('{}');
    
    // Access Control
    table.enum('access_type', ['public', 'private', 'restricted']).defaultTo('private');
    table.string('access_password');
    table.boolean('requires_registration').defaultTo(true);
    table.boolean('requires_approval').defaultTo(false);
    table.integer('max_participants');
    table.json('allowed_roles').defaultTo('[]');
    table.json('allowed_users').defaultTo('[]');
    
    // Registration
    table.boolean('registration_enabled').defaultTo(true);
    table.timestamp('registration_opens_at');
    table.timestamp('registration_closes_at');
    table.json('registration_fields').defaultTo('[]'); // Custom fields
    table.boolean('send_confirmation_email').defaultTo(true);
    table.boolean('send_reminder_emails').defaultTo(true);
    
    // Content and Recording
    table.boolean('is_recorded').defaultTo(false);
    table.string('recording_url');
    table.string('recording_password');
    table.integer('recording_size_mb');
    table.timestamp('recording_available_until');
    table.boolean('auto_record').defaultTo(false);
    table.boolean('allow_download').defaultTo(false);
    
    // Interactive Features
    table.boolean('enable_chat').defaultTo(true);
    table.boolean('enable_qa').defaultTo(true);
    table.boolean('enable_polls').defaultTo(true);
    table.boolean('enable_breakout_rooms').defaultTo(false);
    table.boolean('enable_screen_sharing').defaultTo(true);
    table.boolean('enable_whiteboard').defaultTo(false);
    
    // Moderation
    table.boolean('mute_participants_on_join').defaultTo(true);
    table.boolean('disable_video_on_join').defaultTo(false);
    table.boolean('waiting_room_enabled').defaultTo(false);
    table.json('moderator_users').defaultTo('[]');
    table.json('presenter_users').defaultTo('[]');
    
    // Status and Analytics
    table.enum('status', ['draft', 'scheduled', 'live', 'ended', 'cancelled']).defaultTo('draft');
    table.string('cancellation_reason');
    table.integer('registered_count').defaultTo(0);
    table.integer('attended_count').defaultTo(0);
    table.integer('peak_attendance').defaultTo(0);
    table.decimal('average_attendance_duration', 8, 2); // minutes
    table.decimal('engagement_score', 3, 2); // 0-5
    
    // Notifications
    table.json('notification_settings').defaultTo('{}');
    table.timestamp('reminder_sent_at');
    table.timestamp('follow_up_sent_at');
    
    // Metadata
    table.json('metadata').defaultTo('{}');
    table.timestamps(true, true);
    table.timestamp('deleted_at');
    
    // Indexes
    table.index(['institution_id']);
    table.index(['created_by']);
    table.index(['course_id']);
    table.index(['scheduled_at']);
    table.index(['status']);
    table.index(['platform']);
    table.index(['access_type']);
    table.index(['is_recurring']);
    table.index(['parent_webinar_id']);
    table.index(['registration_enabled']);
    table.index(['is_recorded']);
    
    // Composite indexes
    table.index(['institution_id', 'scheduled_at']);
    table.index(['institution_id', 'status']);
    table.index(['created_by', 'scheduled_at']);
    table.index(['course_id', 'scheduled_at']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('webinars');
};