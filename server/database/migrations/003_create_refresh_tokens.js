exports.up = function(knex) {
  return knex.schema.createTable('refresh_tokens', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.string('token').unique().notNullable();
    table.timestamp('expires_at').notNullable();
    table.string('device_info');
    table.string('ip_address');
    table.string('user_agent');
    table.boolean('is_revoked').defaultTo(false);
    table.timestamp('revoked_at');
    table.timestamps(true, true);
    
    // Indexes
    table.index(['user_id']);
    table.index(['token']);
    table.index(['expires_at']);
    table.index(['is_revoked']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('refresh_tokens');
};