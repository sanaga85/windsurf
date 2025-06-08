/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('library_borrowings', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('item_id').references('id').inTable('library_items').onDelete('CASCADE');
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.uuid('borrowed_by').references('id').inTable('users').onDelete('SET NULL'); // Who processed the borrowing
    table.uuid('returned_by').references('id').inTable('users').onDelete('SET NULL'); // Who processed the return
    
    // Borrowing Information
    table.timestamp('borrowed_at').defaultTo(knex.fn.now());
    table.timestamp('due_date').notNullable();
    table.timestamp('returned_at');
    table.enum('status', ['borrowed', 'returned', 'overdue', 'lost', 'damaged']).defaultTo('borrowed');
    
    // Fine Information
    table.decimal('fine_amount', 10, 2).defaultTo(0);
    table.boolean('fine_paid').defaultTo(false);
    table.timestamp('fine_paid_at');
    table.text('fine_reason');
    
    // Renewal Information
    table.integer('renewal_count').defaultTo(0);
    table.integer('max_renewals').defaultTo(2);
    table.timestamp('last_renewed_at');
    
    // Condition Information
    table.enum('condition_at_borrow', ['excellent', 'good', 'fair', 'poor']).defaultTo('good');
    table.enum('condition_at_return', ['excellent', 'good', 'fair', 'poor']);
    table.text('condition_notes');
    
    // Metadata
    table.json('metadata').defaultTo('{}');
    table.timestamps(true, true);
    
    // Indexes
    table.index(['item_id']);
    table.index(['user_id']);
    table.index(['status']);
    table.index(['borrowed_at']);
    table.index(['due_date']);
    table.index(['returned_at']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('library_borrowings');
};