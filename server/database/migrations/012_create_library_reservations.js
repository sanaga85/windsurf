/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('library_reservations', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('item_id').references('id').inTable('library_items').onDelete('CASCADE');
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
    
    // Reservation Information
    table.timestamp('reserved_at').defaultTo(knex.fn.now());
    table.timestamp('expires_at').notNullable(); // When reservation expires
    table.timestamp('notified_at'); // When user was notified item is available
    table.enum('status', ['active', 'fulfilled', 'expired', 'cancelled']).defaultTo('active');
    table.integer('queue_position').defaultTo(1); // Position in reservation queue
    
    // Fulfillment Information
    table.timestamp('fulfilled_at');
    table.uuid('fulfilled_by').references('id').inTable('users').onDelete('SET NULL');
    table.text('cancellation_reason');
    
    // Metadata
    table.json('metadata').defaultTo('{}');
    table.timestamps(true, true);
    
    // Indexes
    table.index(['item_id']);
    table.index(['user_id']);
    table.index(['status']);
    table.index(['reserved_at']);
    table.index(['expires_at']);
    table.index(['queue_position']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('library_reservations');
};