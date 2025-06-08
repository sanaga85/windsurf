/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema
    .createTable('notifications', function(table) {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('institution_id').references('id').inTable('institutions').onDelete('CASCADE');
      table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.uuid('created_by').references('id').inTable('users').onDelete('SET NULL');
      
      table.string('title').notNullable();
      table.text('message').notNullable();
      table.enum('type', ['info', 'warning', 'error', 'success', 'reminder']).defaultTo('info');
      table.enum('category', ['system', 'library', 'course', 'assignment', 'announcement', 'reminder']).defaultTo('system');
      table.json('metadata').defaultTo('{}');
      
      table.boolean('is_read').defaultTo(false);
      table.timestamp('read_at');
      table.boolean('is_sent').defaultTo(false);
      table.timestamp('sent_at');
      table.timestamp('scheduled_for');
      
      // Delivery channels
      table.boolean('send_email').defaultTo(false);
      table.boolean('send_sms').defaultTo(false);
      table.boolean('send_push').defaultTo(true);
      
      table.timestamps(true, true);
      
      table.index(['user_id']);
      table.index(['institution_id']);
      table.index(['type']);
      table.index(['category']);
      table.index(['is_read']);
      table.index(['is_sent']);
      table.index(['scheduled_for']);
      table.index(['created_at']);
    })
    .createTable('announcements', function(table) {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('institution_id').references('id').inTable('institutions').onDelete('CASCADE');
      table.uuid('created_by').references('id').inTable('users').onDelete('CASCADE');
      
      table.string('title').notNullable();
      table.text('content').notNullable();
      table.enum('type', ['general', 'urgent', 'academic', 'administrative']).defaultTo('general');
      table.json('target_roles').defaultTo('[]'); // which roles should see this
      table.json('target_users').defaultTo('[]'); // specific users
      
      table.boolean('is_published').defaultTo(false);
      table.timestamp('published_at');
      table.timestamp('expires_at');
      table.boolean('send_notification').defaultTo(true);
      table.boolean('pin_to_top').defaultTo(false);
      
      table.timestamps(true, true);
      
      table.index(['institution_id']);
      table.index(['created_by']);
      table.index(['type']);
      table.index(['is_published']);
      table.index(['published_at']);
      table.index(['expires_at']);
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema
    .dropTable('announcements')
    .dropTable('notifications');
};