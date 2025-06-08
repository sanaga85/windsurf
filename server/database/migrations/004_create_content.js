/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema
    .createTable('content', function(table) {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('institution_id').references('id').inTable('institutions').onDelete('CASCADE');
      table.uuid('chapter_id').references('id').inTable('chapters').onDelete('CASCADE');
      table.uuid('uploaded_by').references('id').inTable('users').onDelete('SET NULL');
      
      table.string('title').notNullable();
      table.text('description');
      table.enum('type', ['pdf', 'mp4', 'mp3', 'epub', 'docx', 'image', 'url']).notNullable();
      table.string('file_url');
      table.string('file_path');
      table.string('original_filename');
      table.bigInteger('file_size');
      table.string('mime_type');
      table.integer('duration_seconds'); // for video/audio
      table.integer('page_count'); // for documents
      table.json('metadata').defaultTo('{}');
      
      table.boolean('is_active').defaultTo(true);
      table.boolean('is_public').defaultTo(false);
      table.integer('sort_order').defaultTo(0);
      table.json('access_permissions').defaultTo('{}');
      
      table.timestamps(true, true);
      table.timestamp('deleted_at');
      
      table.index(['institution_id']);
      table.index(['chapter_id']);
      table.index(['type']);
      table.index(['is_active']);
      table.index(['uploaded_by']);
    })
    .createTable('user_content_progress', function(table) {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.uuid('content_id').references('id').inTable('content').onDelete('CASCADE');
      
      table.integer('progress_percentage').defaultTo(0);
      table.integer('current_page');
      table.integer('current_time_seconds'); // for video/audio
      table.json('bookmarks').defaultTo('[]');
      table.json('highlights').defaultTo('[]');
      table.json('notes').defaultTo('[]');
      table.timestamp('last_accessed_at');
      table.integer('total_time_spent').defaultTo(0); // in seconds
      
      table.timestamps(true, true);
      
      table.index(['user_id']);
      table.index(['content_id']);
      table.index(['last_accessed_at']);
      table.unique(['user_id', 'content_id']);
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema
    .dropTable('user_content_progress')
    .dropTable('content');
};