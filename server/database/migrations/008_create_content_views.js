/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('content_views', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('content_id').references('id').inTable('content').onDelete('CASCADE');
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
    
    // View Information
    table.timestamp('viewed_at').defaultTo(knex.fn.now());
    table.string('ip_address');
    table.text('user_agent');
    table.integer('duration_seconds'); // How long they viewed
    table.json('view_metadata').defaultTo('{}'); // Additional view data
    
    // Indexes
    table.index(['content_id']);
    table.index(['user_id']);
    table.index(['viewed_at']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('content_views');
};