/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('user_sessions', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.uuid('institution_id').references('id').inTable('institutions').onDelete('CASCADE');
    
    // Session Information
    table.string('session_token').unique().notNullable();
    table.string('refresh_token').unique();
    table.timestamp('expires_at').notNullable();
    table.timestamp('refresh_expires_at');
    
    // Device and Location Information
    table.string('ip_address');
    table.text('user_agent');
    table.string('device_type'); // mobile, tablet, desktop
    table.string('device_name');
    table.string('browser_name');
    table.string('browser_version');
    table.string('os_name');
    table.string('os_version');
    table.json('device_fingerprint').defaultTo('{}');
    
    // Location Information
    table.string('country');
    table.string('city');
    table.string('timezone');
    table.decimal('latitude', 10, 8);
    table.decimal('longitude', 11, 8);
    
    // Session Status
    table.boolean('is_active').defaultTo(true);
    table.boolean('is_current').defaultTo(false); // For single device policy
    table.timestamp('last_activity_at').defaultTo(knex.fn.now());
    table.timestamp('logout_at');
    table.enum('logout_reason', ['user_logout', 'timeout', 'force_logout', 'new_device', 'security']).defaultTo('user_logout');
    
    // Security Information
    table.boolean('is_suspicious').defaultTo(false);
    table.json('security_flags').defaultTo('[]');
    table.integer('activity_count').defaultTo(0);
    
    // Metadata
    table.timestamps(true, true);
    
    // Indexes
    table.index(['user_id']);
    table.index(['institution_id']);
    table.index(['session_token']);
    table.index(['refresh_token']);
    table.index(['is_active']);
    table.index(['is_current']);
    table.index(['expires_at']);
    table.index(['last_activity_at']);
    table.index(['ip_address']);
    table.index(['device_type']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('user_sessions');
};