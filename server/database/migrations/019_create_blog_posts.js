/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('blog_posts', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('institution_id').references('id').inTable('institutions').onDelete('CASCADE');
    table.uuid('author_id').references('id').inTable('users').onDelete('SET NULL');
    table.uuid('category_id').references('id').inTable('blog_categories').onDelete('SET NULL');
    
    // Content Information
    table.string('title').notNullable();
    table.string('slug').notNullable();
    table.text('excerpt');
    table.text('content').notNullable();
    table.text('content_html'); // Processed HTML content
    table.string('featured_image_url');
    table.string('featured_image_alt');
    table.json('gallery_images').defaultTo('[]');
    
    // SEO and Meta
    table.string('meta_title');
    table.text('meta_description');
    table.json('meta_keywords').defaultTo('[]');
    table.string('canonical_url');
    table.json('open_graph_data').defaultTo('{}');
    table.json('twitter_card_data').defaultTo('{}');
    
    // Publishing
    table.enum('status', ['draft', 'pending_review', 'scheduled', 'published', 'archived']).defaultTo('draft');
    table.timestamp('published_at');
    table.timestamp('scheduled_for');
    table.uuid('published_by').references('id').inTable('users').onDelete('SET NULL');
    table.boolean('is_featured').defaultTo(false);
    table.boolean('is_sticky').defaultTo(false);
    table.integer('sort_order').defaultTo(0);
    
    // Visibility and Access
    table.enum('visibility', ['public', 'private', 'password_protected', 'members_only']).defaultTo('public');
    table.string('password_hash'); // For password-protected posts
    table.json('allowed_roles').defaultTo('[]');
    table.json('allowed_users').defaultTo('[]');
    
    // Content Organization
    table.json('tags').defaultTo('[]');
    table.json('categories').defaultTo('[]');
    table.string('series_name'); // For post series
    table.integer('series_order');
    table.uuid('parent_post_id').references('id').inTable('blog_posts').onDelete('SET NULL');
    
    // Engagement
    table.boolean('allow_comments').defaultTo(true);
    table.boolean('allow_likes').defaultTo(true);
    table.boolean('allow_shares').defaultTo(true);
    table.integer('view_count').defaultTo(0);
    table.integer('like_count').defaultTo(0);
    table.integer('comment_count').defaultTo(0);
    table.integer('share_count').defaultTo(0);
    table.decimal('average_rating', 3, 2).defaultTo(0);
    table.integer('rating_count').defaultTo(0);
    
    // Reading Time and Analytics
    table.integer('word_count').defaultTo(0);
    table.integer('estimated_reading_time').defaultTo(0); // in minutes
    table.json('reading_analytics').defaultTo('{}');
    table.decimal('bounce_rate', 5, 2).defaultTo(0);
    table.decimal('average_time_on_page', 8, 2).defaultTo(0); // seconds
    
    // Collaboration and Workflow
    table.uuid('editor_id').references('id').inTable('users').onDelete('SET NULL');
    table.timestamp('last_edited_at');
    table.text('editor_notes');
    table.json('revision_history').defaultTo('[]');
    table.boolean('needs_review').defaultTo(false);
    table.uuid('reviewer_id').references('id').inTable('users').onDelete('SET NULL');
    table.timestamp('reviewed_at');
    table.text('review_notes');
    
    // Localization
    table.string('language').defaultTo('en');
    table.uuid('original_post_id').references('id').inTable('blog_posts').onDelete('SET NULL');
    table.json('translations').defaultTo('{}'); // Language code -> post ID mapping
    
    // External Integration
    table.string('external_url'); // For external blog posts
    table.string('source_platform'); // medium, wordpress, etc.
    table.string('source_post_id');
    table.timestamp('last_synced_at');
    table.boolean('auto_sync').defaultTo(false);
    
    // Newsletter and Email
    table.boolean('include_in_newsletter').defaultTo(false);
    table.boolean('newsletter_sent').defaultTo(false);
    table.timestamp('newsletter_sent_at');
    table.integer('newsletter_open_rate').defaultTo(0);
    table.integer('newsletter_click_rate').defaultTo(0);
    
    // Monetization (Future)
    table.boolean('is_premium').defaultTo(false);
    table.decimal('price', 10, 2).defaultTo(0);
    table.string('payment_link');
    table.integer('purchase_count').defaultTo(0);
    
    // Metadata
    table.json('custom_fields').defaultTo('{}');
    table.json('metadata').defaultTo('{}');
    table.timestamps(true, true);
    table.timestamp('deleted_at');
    
    // Indexes
    table.index(['institution_id']);
    table.index(['author_id']);
    table.index(['category_id']);
    table.index(['slug']);
    table.index(['status']);
    table.index(['published_at']);
    table.index(['is_featured']);
    table.index(['is_sticky']);
    table.index(['visibility']);
    table.index(['language']);
    table.index(['series_name']);
    table.index(['view_count']);
    table.index(['like_count']);
    
    // Composite indexes
    table.index(['institution_id', 'status']);
    table.index(['institution_id', 'published_at']);
    table.index(['author_id', 'status']);
    table.index(['status', 'published_at']);
    table.index(['is_featured', 'published_at']);
    table.index(['series_name', 'series_order']);
    
    // Unique constraints
    table.unique(['institution_id', 'slug']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('blog_posts');
};