exports.up = function(knex) {
  return knex.schema.createTable('courses', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('institution_id').references('id').inTable('institutions').onDelete('CASCADE');
    table.uuid('parent_id').references('id').inTable('courses').onDelete('CASCADE');
    
    // Course Information
    table.string('name').notNullable();
    table.string('code');
    table.text('description');
    table.string('thumbnail_url');
    table.integer('level').defaultTo(1); // 1=Class/Program, 2=Subject/Semester, 3=Chapter/Course, 4=Section
    table.string('level_type'); // class, subject, chapter, section, program, semester, course, department, module, batch, topic, subtopic
    table.integer('sort_order').defaultTo(0);
    
    // Academic Information
    table.integer('credits');
    table.integer('duration_hours');
    table.date('start_date');
    table.date('end_date');
    table.json('schedule').defaultTo('{}'); // For batches/classes
    table.string('academic_year');
    table.string('semester');
    
    // Status and Visibility
    table.boolean('is_active').defaultTo(true);
    table.boolean('is_published').defaultTo(false);
    table.enum('visibility', ['public', 'private', 'restricted']).defaultTo('private');
    table.json('access_rules').defaultTo('{}');
    
    // Content and Progress
    table.integer('total_content_items').defaultTo(0);
    table.integer('estimated_duration').defaultTo(0); // in minutes
    table.json('learning_objectives').defaultTo('[]');
    table.json('prerequisites').defaultTo('[]');
    table.json('tags').defaultTo('[]');
    
    // Enrollment and Capacity
    table.integer('max_enrollment');
    table.integer('current_enrollment').defaultTo(0);
    table.boolean('auto_enroll').defaultTo(false);
    table.json('enrollment_rules').defaultTo('{}');
    
    // Metadata
    table.json('metadata').defaultTo('{}');
    table.timestamps(true, true);
    table.timestamp('deleted_at');
    
    // Indexes
    table.index(['institution_id']);
    table.index(['parent_id']);
    table.index(['level']);
    table.index(['level_type']);
    table.index(['is_active']);
    table.index(['is_published']);
    table.index(['code']);
    table.index(['sort_order']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('courses');
};