/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('content', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('institution_id').references('id').inTable('institutions').onDelete('CASCADE');
    table.uuid('course_id').references('id').inTable('courses').onDelete('CASCADE');
    table.uuid('uploaded_by').references('id').inTable('users').onDelete('SET NULL');
    
    // Content Information
    table.string('title').notNullable();
    table.text('description');
    table.enum('type', ['pdf', 'video', 'audio', 'epub', 'document', 'url']).notNullable();
    table.string('file_url');
    table.string('file_name');
    table.string('original_name');
    table.string('mime_type');
    table.bigInteger('file_size'); // in bytes
    table.integer('duration'); // for video/audio in seconds
    table.integer('page_count'); // for documents
    table.string('thumbnail_url');
    
    // Content Organization
    table.integer('sort_order').defaultTo(0);
    table.boolean('is_required').defaultTo(false);
    table.boolean('is_downloadable').defaultTo(true);
    table.boolean('is_streamable').defaultTo(true);
    table.json('access_rules').defaultTo('{}');
    
    // Content Metadata
    table.string('author');
    table.string('publisher');
    table.string('edition');
    table.string('isbn');
    table.integer('publication_year');
    table.string('language').defaultTo('en');
    table.json('tags').defaultTo('[]');
    table.json('categories').defaultTo('[]');
    
    // Processing Status
    table.enum('processing_status', ['pending', 'processing', 'completed', 'failed']).defaultTo('completed');
    table.text('processing_error');
    table.json('processing_metadata').defaultTo('{}');
    
    // Analytics
    table.integer('view_count').defaultTo(0);
    table.integer('download_count').defaultTo(0);
    table.timestamp('last_accessed');
    
    // Status
    table.boolean('is_active').defaultTo(true);
    table.boolean('is_published').defaultTo(false);
    table.timestamp('published_at');
    
    // Metadata
    table.json('metadata').defaultTo('{}');
    table.timestamps(true, true);
    table.timestamp('deleted_at');
    
    // Indexes
    table.index(['institution_id']);
    table.index(['course_id']);
    table.index(['uploaded_by']);
    table.index(['type']);
    table.index(['is_active']);
    table.index(['is_published']);
    table.index(['sort_order']);
    table.index(['processing_status']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('content');
};