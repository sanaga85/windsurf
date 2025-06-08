/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('content_progress', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('content_id').references('id').inTable('content').onDelete('CASCADE');
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
    
    // Progress Information
    table.json('position'); // Current position (page, time, etc.)
    table.float('percentage').defaultTo(0); // Progress percentage (0-100)
    table.boolean('is_completed').defaultTo(false);
    table.timestamp('completed_at');
    table.timestamp('last_accessed_at').defaultTo(knex.fn.now());
    table.integer('time_spent_seconds').defaultTo(0); // Total time spent
    
    // Reading/Viewing State
    table.json('bookmarks').defaultTo('[]'); // User bookmarks within content
    table.json('notes').defaultTo('[]'); // User notes
    table.json('highlights').defaultTo('[]'); // User highlights
    table.json('metadata').defaultTo('{}'); // Additional progress data
    
    // Timestamps
    table.timestamps(true, true);
    
    // Indexes
    table.index(['content_id']);
    table.index(['user_id']);
    table.index(['is_completed']);
    table.index(['last_accessed_at']);
    
    // Unique constraint
    table.unique(['content_id', 'user_id']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('content_progress');
};