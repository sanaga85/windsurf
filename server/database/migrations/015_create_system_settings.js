/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('system_settings', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('institution_id').references('id').inTable('institutions').onDelete('CASCADE');
    
    // Setting Information
    table.string('category').notNullable(); // general, security, email, sms, storage, etc.
    table.string('key').notNullable(); // setting key
    table.text('value'); // setting value (can be JSON string)
    table.string('data_type').defaultTo('string'); // string, number, boolean, json, array
    table.text('description'); // Human-readable description
    
    // Validation and Constraints
    table.json('validation_rules').defaultTo('{}'); // min, max, pattern, enum, etc.
    table.text('default_value'); // Default value
    table.boolean('is_required').defaultTo(false);
    table.boolean('is_encrypted').defaultTo(false); // For sensitive values
    
    // Access Control
    table.enum('scope', ['global', 'institution', 'user']).defaultTo('institution');
    table.json('allowed_roles').defaultTo('[]'); // Roles that can modify this setting
    table.boolean('is_readonly').defaultTo(false);
    table.boolean('is_system').defaultTo(false); // System-managed settings
    
    // UI Information
    table.string('display_name'); // Human-readable name
    table.string('display_group'); // UI grouping
    table.integer('display_order').defaultTo(0);
    table.enum('input_type', [
      'text', 'textarea', 'number', 'boolean', 'select', 'multiselect',
      'color', 'file', 'password', 'email', 'url', 'date', 'time'
    ]).defaultTo('text');
    table.json('input_options').defaultTo('{}'); // Options for select inputs
    
    // Versioning and History
    table.integer('version').defaultTo(1);
    table.uuid('created_by').references('id').inTable('users').onDelete('SET NULL');
    table.uuid('updated_by').references('id').inTable('users').onDelete('SET NULL');
    table.timestamp('last_modified_at').defaultTo(knex.fn.now());
    
    // Metadata
    table.timestamps(true, true);
    table.timestamp('deleted_at');
    
    // Indexes
    table.index(['institution_id']);
    table.index(['category']);
    table.index(['key']);
    table.index(['scope']);
    table.index(['is_system']);
    table.index(['display_group']);
    table.index(['display_order']);
    
    // Unique constraints
    table.unique(['institution_id', 'category', 'key']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('system_settings');
};