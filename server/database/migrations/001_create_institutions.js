/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('institutions', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
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
    
    // Metadata
    table.timestamps(true, true);
    table.timestamp('deleted_at');
    
    // Indexes
    table.index(['slug']);
    table.index(['subdomain']);
    table.index(['type']);
    table.index(['is_active']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('institutions');
};