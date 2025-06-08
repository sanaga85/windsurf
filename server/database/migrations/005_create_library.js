/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema
    .createTable('library_items', function(table) {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('institution_id').references('id').inTable('institutions').onDelete('CASCADE');
      table.uuid('created_by').references('id').inTable('users').onDelete('SET NULL');
      
      // Basic information
      table.string('title').notNullable();
      table.string('subtitle');
      table.string('author');
      table.string('publisher');
      table.string('edition');
      table.integer('publication_year');
      table.string('language').defaultTo('en');
      table.string('isbn');
      table.string('doi');
      table.text('description');
      
      // Classification
      table.enum('type', ['book', 'ebook', 'journal', 'article', 'video', 'audio', 'document']).notNullable();
      table.enum('format', ['physical', 'digital']).notNullable();
      table.string('category');
      table.json('subjects').defaultTo('[]');
      table.json('tags').defaultTo('[]');
      table.enum('difficulty_level', ['beginner', 'intermediate', 'advanced']);
      
      // Digital properties
      table.string('file_url');
      table.string('file_path');
      table.string('cover_image_url');
      table.bigInteger('file_size');
      table.string('mime_type');
      table.integer('page_count');
      table.integer('duration_seconds');
      
      // Physical book properties
      table.string('barcode');
      table.text('qr_code');
      table.string('location'); // shelf location
      table.integer('total_copies').defaultTo(1);
      table.integer('available_copies').defaultTo(1);
      table.enum('condition', ['excellent', 'good', 'fair', 'poor']).defaultTo('good');
      
      // Access and availability
      table.boolean('is_available').defaultTo(true);
      table.boolean('is_public').defaultTo(false);
      table.json('access_roles').defaultTo('[]');
      table.integer('max_concurrent_users').defaultTo(1);
      table.integer('current_users').defaultTo(0);
      
      // External source information
      table.string('external_source'); // google_books, openlibrary, etc.
      table.string('external_id');
      table.json('external_metadata').defaultTo('{}');
      
      table.timestamps(true, true);
      table.timestamp('deleted_at');
      
      // Indexes
      table.index(['institution_id']);
      table.index(['type']);
      table.index(['format']);
      table.index(['is_available']);
      table.index(['isbn']);
      table.index(['barcode']);
      table.index(['external_source', 'external_id']);
    })
    .createTable('external_library_bookmarks', function(table) {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
      
      table.string('title').notNullable();
      table.string('author');
      table.string('source').notNullable(); // google_books, youtube, etc.
      table.string('external_id').notNullable();
      table.string('url').notNullable();
      table.text('description');
      table.string('thumbnail_url');
      table.json('metadata').defaultTo('{}');
      table.json('tags').defaultTo('[]');
      table.string('category');
      
      table.timestamps(true, true);
      
      // Indexes
      table.index(['user_id']);
      table.index(['source']);
      table.index(['category']);
      table.unique(['user_id', 'source', 'external_id']);
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema
    .dropTable('external_library_bookmarks')
    .dropTable('library_items');
};