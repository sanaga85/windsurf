/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema
    .createTable('library_items', function(table) {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('institution_id').references('id').inTable('institutions').onDelete('CASCADE');
      table.uuid('added_by').references('id').inTable('users').onDelete('SET NULL');
      
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
      table.enum('type', ['book', 'journal', 'article', 'video', 'audio', 'document', 'url']).notNullable();
      table.string('category');
      table.json('subjects').defaultTo('[]');
      table.json('tags').defaultTo('[]');
      table.enum('difficulty_level', ['beginner', 'intermediate', 'advanced']);
      
      // Physical/Digital properties
      table.boolean('is_physical').defaultTo(false);
      table.boolean('is_digital').defaultTo(true);
      table.string('file_url');
      table.string('file_path');
      table.string('cover_image_url');
      table.bigInteger('file_size');
      table.string('mime_type');
      table.integer('page_count');
      table.integer('duration_seconds');
      
      // Physical book properties
      table.string('barcode');
      table.string('qr_code');
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
      table.index(['is_available']);
      table.index(['is_physical']);
      table.index(['is_digital']);
      table.index(['isbn']);
      table.index(['barcode']);
      table.index(['external_source', 'external_id']);
    })
    .createTable('library_borrowings', function(table) {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.uuid('library_item_id').references('id').inTable('library_items').onDelete('CASCADE');
      table.uuid('approved_by').references('id').inTable('users').onDelete('SET NULL');
      
      table.timestamp('borrowed_at').defaultTo(knex.fn.now());
      table.timestamp('due_date').notNullable();
      table.timestamp('returned_at');
      table.timestamp('renewed_at');
      table.integer('renewal_count').defaultTo(0);
      table.integer('max_renewals').defaultTo(2);
      
      table.enum('status', ['active', 'returned', 'overdue', 'lost', 'damaged']).defaultTo('active');
      table.text('notes');
      table.decimal('fine_amount', 10, 2).defaultTo(0);
      table.boolean('fine_paid').defaultTo(false);
      
      // Digital access tracking
      table.timestamp('last_accessed_at');
      table.integer('access_count').defaultTo(0);
      
      table.timestamps(true, true);
      
      table.index(['user_id']);
      table.index(['library_item_id']);
      table.index(['status']);
      table.index(['due_date']);
      table.index(['borrowed_at']);
    })
    .createTable('library_reservations', function(table) {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.uuid('library_item_id').references('id').inTable('library_items').onDelete('CASCADE');
      
      table.timestamp('reserved_at').defaultTo(knex.fn.now());
      table.timestamp('expires_at').notNullable();
      table.timestamp('notified_at');
      table.enum('status', ['active', 'fulfilled', 'expired', 'cancelled']).defaultTo('active');
      table.integer('queue_position');
      
      table.timestamps(true, true);
      
      table.index(['user_id']);
      table.index(['library_item_id']);
      table.index(['status']);
      table.index(['expires_at']);
    })
    .createTable('external_library_bookmarks', function(table) {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
      
      table.string('title').notNullable();
      table.string('author');
      table.string('source'); // google_books, youtube, etc.
      table.string('external_id');
      table.string('url').notNullable();
      table.text('description');
      table.string('thumbnail_url');
      table.json('metadata').defaultTo('{}');
      table.json('tags').defaultTo('[]');
      table.string('category');
      
      table.timestamps(true, true);
      
      table.index(['user_id']);
      table.index(['source']);
      table.index(['category']);
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema
    .dropTable('external_library_bookmarks')
    .dropTable('library_reservations')
    .dropTable('library_borrowings')
    .dropTable('library_items');
};