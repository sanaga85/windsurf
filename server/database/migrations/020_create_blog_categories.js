/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('blog_categories', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('institution_id').references('id').inTable('institutions').onDelete('CASCADE');
    table.uuid('parent_id').references('id').inTable('blog_categories').onDelete('CASCADE');
    table.uuid('created_by').references('id').inTable('users').onDelete('SET NULL');
    
    // Category Information
    table.string('name').notNullable();
    table.string('slug').notNullable();
    table.text('description');
    table.string('color').defaultTo('#1976d2');
    table.string('icon');
    table.string('image_url');
    
    // Hierarchy and Organization
    table.integer('level').defaultTo(1);
    table.string('path'); // Full path like "parent/child/grandchild"
    table.integer('sort_order').defaultTo(0);
    table.boolean('is_featured').defaultTo(false);
    
    // SEO and Meta
    table.string('meta_title');
    table.text('meta_description');
    table.json('meta_keywords').defaultTo('[]');
    
    // Visibility and Access
    table.boolean('is_active').defaultTo(true);
    table.enum('visibility', ['public', 'private', 'members_only']).defaultTo('public');
    table.json('allowed_roles').defaultTo('[]');
    
    // Statistics
    table.integer('post_count').defaultTo(0);
    table.integer('total_views').defaultTo(0);
    table.timestamp('last_post_at');
    
    // Content Settings
    table.boolean('allow_posts').defaultTo(true);
    table.boolean('require_approval').defaultTo(false);
    table.json('allowed_post_types').defaultTo('[]');
    table.json('category_settings').defaultTo('{}');
    
    // Metadata
    table.timestamps(true, true);
    table.timestamp('deleted_at');
    
    // Indexes
    table.index(['institution_id']);
    table.index(['parent_id']);
    table.index(['slug']);
    table.index(['is_active']);
    table.index(['is_featured']);
    table.index(['visibility']);
    table.index(['sort_order']);
    table.index(['level']);
    
    // Composite indexes
    table.index(['institution_id', 'slug']);
    table.index(['institution_id', 'is_active']);
    table.index(['parent_id', 'sort_order']);
    
    // Unique constraints
    table.unique(['institution_id', 'slug']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('blog_categories');
};