/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('external_library_bookmarks', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('institution_id').references('id').inTable('institutions').onDelete('CASCADE');
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
    
    // External Resource Information
    table.string('source').notNullable(); // google_books, openlibrary, arxiv, etc.
    table.string('external_id').notNullable(); // ID from the external source
    table.string('title').notNullable();
    table.string('subtitle');
    table.json('authors').defaultTo('[]');
    table.string('publisher');
    table.string('published_date');
    table.text('description');
    table.string('language').defaultTo('en');
    table.integer('page_count');
    table.json('categories').defaultTo('[]');
    table.decimal('average_rating', 3, 2);
    table.integer('ratings_count');
    
    // Identifiers
    table.json('identifiers').defaultTo('{}'); // ISBN, DOI, etc.
    table.string('isbn_10');
    table.string('isbn_13');
    table.string('doi');
    
    // URLs and Access
    table.string('external_url').notNullable();
    table.string('preview_url');
    table.string('thumbnail_url');
    table.string('cover_image_url');
    table.enum('access_type', ['free', 'preview', 'subscription', 'purchase']).defaultTo('free');
    table.string('access_url');
    
    // Content Information
    table.enum('content_type', ['book', 'article', 'paper', 'video', 'audio', 'podcast', 'document']).notNullable();
    table.enum('format', ['pdf', 'epub', 'html', 'video', 'audio', 'text']).defaultTo('pdf');
    table.string('file_size');
    table.integer('duration_minutes'); // For videos/audio
    
    // User Interaction
    table.text('user_notes');
    table.json('user_tags').defaultTo('[]');
    table.integer('user_rating'); // 1-5 stars
    table.text('user_review');
    table.boolean('is_favorite').defaultTo(false);
    table.enum('reading_status', ['want_to_read', 'currently_reading', 'completed', 'abandoned']).defaultTo('want_to_read');
    table.integer('reading_progress').defaultTo(0); // Percentage
    
    // Organization
    table.string('collection_name'); // User-defined collection
    table.json('folders').defaultTo('[]'); // Folder hierarchy
    table.integer('sort_order').defaultTo(0);
    
    // Import Status
    table.boolean('is_imported').defaultTo(false); // Imported to internal library
    table.uuid('imported_library_item_id').references('id').inTable('library_items').onDelete('SET NULL');
    table.timestamp('imported_at');
    table.uuid('imported_by').references('id').inTable('users').onDelete('SET NULL');
    
    // Sharing and Collaboration
    table.boolean('is_shared').defaultTo(false);
    table.enum('sharing_scope', ['private', 'institution', 'public']).defaultTo('private');
    table.json('shared_with_users').defaultTo('[]'); // Specific user IDs
    table.json('shared_with_roles').defaultTo('[]'); // Specific roles
    
    // Metadata and Caching
    table.json('raw_metadata').defaultTo('{}'); // Original API response
    table.timestamp('metadata_updated_at');
    table.boolean('metadata_needs_refresh').defaultTo(false);
    table.integer('access_count').defaultTo(0);
    table.timestamp('last_accessed_at');
    
    // Quality and Validation
    table.decimal('quality_score', 3, 2); // 0-5 based on metadata completeness
    table.boolean('is_verified').defaultTo(false); // Manually verified by librarian
    table.uuid('verified_by').references('id').inTable('users').onDelete('SET NULL');
    table.timestamp('verified_at');
    
    // Metadata
    table.timestamps(true, true);
    table.timestamp('deleted_at');
    
    // Indexes
    table.index(['institution_id']);
    table.index(['user_id']);
    table.index(['source']);
    table.index(['external_id']);
    table.index(['content_type']);
    table.index(['access_type']);
    table.index(['is_favorite']);
    table.index(['reading_status']);
    table.index(['is_imported']);
    table.index(['is_shared']);
    table.index(['sharing_scope']);
    table.index(['collection_name']);
    table.index(['created_at']);
    table.index(['last_accessed_at']);
    
    // Composite indexes
    table.index(['institution_id', 'user_id']);
    table.index(['source', 'external_id']);
    table.index(['user_id', 'collection_name']);
    table.index(['user_id', 'reading_status']);
    table.index(['institution_id', 'is_shared']);
    
    // Unique constraints
    table.unique(['user_id', 'source', 'external_id']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('external_library_bookmarks');
};