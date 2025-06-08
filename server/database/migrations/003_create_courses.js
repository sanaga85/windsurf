/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema
    .createTable('programs', function(table) {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('institution_id').references('id').inTable('institutions').onDelete('CASCADE');
      table.string('name').notNullable();
      table.string('code');
      table.text('description');
      table.integer('duration_months');
      table.integer('total_credits');
      table.json('admission_criteria').defaultTo('{}');
      table.boolean('is_active').defaultTo(true);
      table.integer('sort_order').defaultTo(0);
      table.timestamps(true, true);
      table.timestamp('deleted_at');
      
      table.index(['institution_id']);
      table.index(['is_active']);
    })
    .createTable('classes', function(table) {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('institution_id').references('id').inTable('institutions').onDelete('CASCADE');
      table.uuid('program_id').references('id').inTable('programs').onDelete('CASCADE').nullable();
      table.string('name').notNullable();
      table.string('code');
      table.text('description');
      table.integer('academic_year');
      table.integer('semester');
      table.boolean('is_active').defaultTo(true);
      table.integer('sort_order').defaultTo(0);
      table.timestamps(true, true);
      table.timestamp('deleted_at');
      
      table.index(['institution_id']);
      table.index(['program_id']);
      table.index(['is_active']);
    })
    .createTable('subjects', function(table) {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('institution_id').references('id').inTable('institutions').onDelete('CASCADE');
      table.uuid('class_id').references('id').inTable('classes').onDelete('CASCADE');
      table.string('name').notNullable();
      table.string('code');
      table.text('description');
      table.integer('credits');
      table.json('prerequisites').defaultTo('[]');
      table.boolean('is_active').defaultTo(true);
      table.integer('sort_order').defaultTo(0);
      table.timestamps(true, true);
      table.timestamp('deleted_at');
      
      table.index(['institution_id']);
      table.index(['class_id']);
      table.index(['is_active']);
    })
    .createTable('chapters', function(table) {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('institution_id').references('id').inTable('institutions').onDelete('CASCADE');
      table.uuid('subject_id').references('id').inTable('subjects').onDelete('CASCADE');
      table.string('name').notNullable();
      table.text('description');
      table.json('learning_objectives').defaultTo('[]');
      table.integer('estimated_hours');
      table.boolean('is_active').defaultTo(true);
      table.integer('sort_order').defaultTo(0);
      table.timestamps(true, true);
      table.timestamp('deleted_at');
      
      table.index(['institution_id']);
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
    .dropTable('chapters')
    .dropTable('subjects')
    .dropTable('classes')
    .dropTable('programs');
};