/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('audit_logs', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('institution_id').references('id').inTable('institutions').onDelete('CASCADE');
    table.uuid('user_id').references('id').inTable('users').onDelete('SET NULL');
    
    // Action Information
    table.string('action').notNullable(); // CREATE, UPDATE, DELETE, LOGIN, LOGOUT, VIEW, DOWNLOAD, etc.
    table.string('resource_type').notNullable(); // user, course, content, library_item, etc.
    table.uuid('resource_id'); // ID of the affected resource
    table.string('resource_name'); // Human-readable name of the resource
    
    // Request Information
    table.string('method'); // GET, POST, PUT, DELETE
    table.string('endpoint'); // API endpoint
    table.string('ip_address');
    table.text('user_agent');
    table.string('session_id');
    
    // Change Information
    table.json('old_values').defaultTo('{}'); // Previous state for updates
    table.json('new_values').defaultTo('{}'); // New state for updates
    table.json('metadata').defaultTo('{}'); // Additional context
    
    // Result Information
    table.enum('status', ['success', 'failure', 'error']).defaultTo('success');
    table.string('error_message');
    table.integer('response_code');
    table.integer('response_time_ms');
    
    // Security and Risk Assessment
    table.enum('risk_level', ['low', 'medium', 'high', 'critical']).defaultTo('low');
    table.json('security_flags').defaultTo('[]');
    table.boolean('is_suspicious').defaultTo(false);
    
    // Compliance and Retention
    table.enum('category', [
      'authentication', 'authorization', 'data_access', 'data_modification',
      'system_admin', 'user_management', 'content_management', 'library_management',
      'security', 'compliance', 'performance', 'error'
    ]).notNullable();
    table.boolean('is_sensitive').defaultTo(false);
    table.timestamp('retention_until'); // For data retention policies
    
    // Geolocation
    table.string('country');
    table.string('city');
    table.string('timezone');
    
    // Metadata
    table.timestamp('created_at').defaultTo(knex.fn.now());
    
    // Indexes for performance
    table.index(['institution_id']);
    table.index(['user_id']);
    table.index(['action']);
    table.index(['resource_type']);
    table.index(['resource_id']);
    table.index(['created_at']);
    table.index(['category']);
    table.index(['status']);
    table.index(['risk_level']);
    table.index(['is_suspicious']);
    table.index(['ip_address']);
    table.index(['session_id']);
    
    // Composite indexes for common queries
    table.index(['institution_id', 'created_at']);
    table.index(['user_id', 'created_at']);
    table.index(['resource_type', 'resource_id']);
    table.index(['action', 'resource_type']);
    table.index(['category', 'created_at']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('audit_logs');
};