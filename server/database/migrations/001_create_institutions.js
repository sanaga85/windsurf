exports.up = function(knex) {
  return knex.schema.createTable('institutions', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name').notNullable();
    table.string('slug').unique().notNullable();
    table.string('subdomain').unique().notNullable();
    table.enum('type', ['school', 'university', 'corporate', 'coaching']).notNullable();
    table.string('email').unique();
    table.string('phone');
    table.text('address');
    table.string('website');
    
    // Branding
    table.string('logo_url');
    table.string('favicon_url');
    table.json('theme_colors').defaultTo('{}');
    table.json('branding_config').defaultTo('{}');
    
    // Configuration
    table.json('settings').defaultTo('{}');
    table.json('features').defaultTo('{}');
    table.boolean('is_active').defaultTo(true);
    table.boolean('is_trial').defaultTo(true);
    table.timestamp('trial_ends_at');
    table.string('subscription_plan');
    table.timestamp('subscription_ends_at');
    
    // Limits
    table.integer('max_users').defaultTo(100);
    table.bigInteger('max_storage').defaultTo(1073741824); // 1GB in bytes
    table.integer('max_courses').defaultTo(50);
    
    // Metadata
    table.timestamps(true, true);
    table.timestamp('deleted_at');
    
    // Indexes
    table.index(['slug']);
    table.index(['subdomain']);
    table.index(['type']);
    table.index(['is_active']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('institutions');
};