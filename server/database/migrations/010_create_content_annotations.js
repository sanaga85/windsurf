/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('content_annotations', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('content_id').references('id').inTable('content').onDelete('CASCADE');
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
    
    // Annotation Information
    table.enum('type', ['highlight', 'note', 'bookmark', 'comment']).notNullable();
    table.text('content').notNullable(); // The annotation content
    table.json('position').notNullable(); // Position in content (page, coordinates, time, etc.)
    table.string('color').defaultTo('#ffff00'); // Highlight color
    table.json('style').defaultTo('{}'); // Additional styling
    
    // Organization
    table.string('title'); // Optional title for bookmarks/notes
    table.json('tags').defaultTo('[]'); // User tags
    table.boolean('is_private').defaultTo(true); // Private vs shared annotations
    table.boolean('is_active').defaultTo(true);
    
    // Metadata
    table.json('metadata').defaultTo('{}');
    table.timestamps(true, true);
    table.timestamp('deleted_at');
    
    // Indexes
    table.index(['content_id']);
    table.index(['user_id']);
    table.index(['type']);
    table.index(['is_active']);
    table.index(['is_private']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('content_annotations');
};