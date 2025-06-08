exports.up = function(knex) {
  return knex.schema.createTable('users', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('institution_id').references('id').inTable('institutions').onDelete('CASCADE');
    
    // Authentication
    table.string('username').notNullable();
    table.string('email');
    table.string('phone');
    table.string('password_hash').notNullable();
    table.timestamp('last_login');
    table.integer('login_attempts').defaultTo(0);
    table.timestamp('locked_until');
    table.boolean('is_active').defaultTo(true);
    table.boolean('email_verified').defaultTo(false);
    table.boolean('phone_verified').defaultTo(false);
    table.timestamp('email_verified_at');
    table.timestamp('phone_verified_at');
    
    // Profile
    table.string('first_name');
    table.string('last_name');
    table.string('display_name');
    table.string('avatar_url');
    table.date('date_of_birth');
    table.enum('gender', ['male', 'female', 'other']);
    table.text('bio');
    table.json('address').defaultTo('{}');
    
    // Role and Permissions
    table.enum('role', ['super_admin', 'institution_admin', 'faculty', 'student', 'librarian', 'parent', 'guest']).notNullable();
    table.json('permissions').defaultTo('[]');
    table.json('custom_fields').defaultTo('{}');
    
    // Settings
    table.json('preferences').defaultTo('{}');
    table.string('language').defaultTo('en');
    table.string('timezone').defaultTo('UTC');
    table.boolean('dark_mode').defaultTo(false);
    table.json('notification_settings').defaultTo('{}');
    
    // Security
    table.string('two_factor_secret');
    table.boolean('two_factor_enabled').defaultTo(false);
    table.json('backup_codes');
    table.string('password_reset_token');
    table.timestamp('password_reset_expires');
    table.timestamp('password_changed_at');
    
    // Profile completion
    table.boolean('profile_completed').defaultTo(false);
    table.boolean('force_password_change').defaultTo(true);
    table.timestamp('terms_accepted_at');
    
    // Metadata
    table.timestamps(true, true);
    table.timestamp('deleted_at');
    
    // Indexes
    table.unique(['institution_id', 'username']);
    table.unique(['institution_id', 'email']);
    table.unique(['institution_id', 'phone']);
    table.index(['institution_id']);
    table.index(['role']);
    table.index(['is_active']);
    table.index(['email']);
    table.index(['phone']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('users');
};