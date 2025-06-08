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