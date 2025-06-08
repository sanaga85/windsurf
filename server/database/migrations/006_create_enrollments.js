/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema
    .createTable('user_enrollments', function(table) {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.uuid('program_id').references('id').inTable('programs').onDelete('CASCADE').nullable();
      table.uuid('class_id').references('id').inTable('classes').onDelete('CASCADE').nullable();
      table.uuid('subject_id').references('id').inTable('subjects').onDelete('CASCADE').nullable();
      table.uuid('enrolled_by').references('id').inTable('users').onDelete('SET NULL');
      
      table.timestamp('enrolled_at').defaultTo(knex.fn.now());
      table.timestamp('starts_at');
      table.timestamp('ends_at');
      table.enum('status', ['active', 'completed', 'dropped', 'suspended']).defaultTo('active');
      table.decimal('progress_percentage', 5, 2).defaultTo(0);
      table.json('grades').defaultTo('{}');
      table.text('notes');
      
      table.timestamps(true, true);
      
      table.index(['user_id']);
      table.index(['program_id']);
      table.index(['class_id']);
      table.index(['subject_id']);
      table.index(['status']);
      table.index(['enrolled_at']);
    })
    .createTable('faculty_assignments', function(table) {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('faculty_id').references('id').inTable('users').onDelete('CASCADE');
      table.uuid('program_id').references('id').inTable('programs').onDelete('CASCADE').nullable();
      table.uuid('class_id').references('id').inTable('classes').onDelete('CASCADE').nullable();
      table.uuid('subject_id').references('id').inTable('subjects').onDelete('CASCADE').nullable();
      table.uuid('assigned_by').references('id').inTable('users').onDelete('SET NULL');
      
      table.timestamp('assigned_at').defaultTo(knex.fn.now());
      table.timestamp('starts_at');
      table.timestamp('ends_at');
      table.enum('role', ['primary', 'assistant', 'guest']).defaultTo('primary');
      table.boolean('is_active').defaultTo(true);
      table.text('responsibilities');
      
      table.timestamps(true, true);
      
      table.index(['faculty_id']);
      table.index(['program_id']);
      table.index(['class_id']);
      table.index(['subject_id']);
      table.index(['is_active']);
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema
    .dropTable('faculty_assignments')
    .dropTable('user_enrollments');
};