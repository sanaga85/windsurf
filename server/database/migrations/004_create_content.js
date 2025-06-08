/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('content', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('institution_id').references('id').inTable('institutions').onDelete('CASCADE');
    table.uuid('course_id').references('id').inTable('courses').onDelete('CASCADE');
    table.uuid('uploaded_by').references('id').inTable('users').onDelete('SET NULL');
    
    // Content Information
    table.string('title').notNullable();
    table.text('description');
    table.enum('type', ['pdf', 'video', 'audio', 'epub', 'document', 'url']).notNullable();
    table.string('file_url');
    table.string('file_name');
    table.string('original_name');
    table.string('mime_type');
    table.bigInteger('file_size'); // in bytes
    table.integer('duration'); // for video/audio in seconds
    table.integer('page_count'); // for documents
    table.string('thumbnail_url');
    
    // Content Organization and Path
    table.string('content_path', 500); // For folder structure like "/course1/chapter1/lesson1"
    table.string('folder_path', 500); // Physical folder path
    table.integer('version').defaultTo(1); // For version control
    table.uuid('original_content_id').references('id').inTable('content').onDelete('SET NULL');
    table.boolean('is_latest_version').defaultTo(true);
    table.text('version_notes'); // Change notes for this version
    
    // Enhanced File Information
    table.string('original_filename');
    table.string('file_extension');
    table.bigInteger('file_size_bytes').defaultTo(0);
    table.string('file_hash'); // For duplicate detection
    table.string('checksum'); // For integrity verification
    
    // Content Processing and Optimization
    table.json('processing_status').defaultTo('{}'); // Status of various processing tasks
    table.json('optimization_status').defaultTo('{}'); // Compression, thumbnail generation, etc.
    table.string('thumbnail_small_url'); // Small thumbnail (150x150)
    table.string('thumbnail_medium_url'); // Medium thumbnail (300x300)
    table.string('thumbnail_large_url'); // Large thumbnail (600x600)
    table.string('preview_url'); // Preview/sample content
    
    // Video/Audio Specific
    table.integer('duration_seconds').defaultTo(0); // For video/audio content
    table.string('video_resolution'); // 720p, 1080p, 4K, etc.
    table.integer('video_bitrate'); // kbps
    table.string('audio_bitrate'); // kbps
    table.decimal('fps', 5, 2); // Frames per second for video
    table.json('video_tracks').defaultTo('[]'); // Multiple video tracks
    table.json('audio_tracks').defaultTo('[]'); // Multiple audio tracks
    table.json('subtitle_tracks').defaultTo('[]'); // Subtitle/caption tracks
    
    // Document Specific
    table.integer('word_count').defaultTo(0); // For text-based content
    table.integer('character_count').defaultTo(0);
    table.string('document_language').defaultTo('en');
    table.boolean('has_images').defaultTo(false);
    table.boolean('has_tables').defaultTo(false);
    table.boolean('has_forms').defaultTo(false);
    table.boolean('is_searchable').defaultTo(false); // OCR processed
    
    // Content Accessibility
    table.boolean('has_captions').defaultTo(false);
    table.boolean('has_transcripts').defaultTo(false);
    table.boolean('has_audio_description').defaultTo(false);
    table.boolean('is_screen_reader_friendly').defaultTo(false);
    table.json('accessibility_features').defaultTo('[]');
    table.decimal('accessibility_score', 3, 2).defaultTo(0); // 0-5
    
    // Content Quality and Moderation
    table.decimal('quality_score', 3, 2).defaultTo(0); // 0-5 based on various factors
    table.boolean('is_moderated').defaultTo(false);
    table.uuid('moderated_by').references('id').inTable('users').onDelete('SET NULL');
    table.timestamp('moderated_at');
    table.text('moderation_notes');
    table.enum('moderation_status', ['pending', 'approved', 'rejected', 'flagged']).defaultTo('pending');
    
    // Content Analytics and Engagement
    table.integer('view_count').defaultTo(0);
    table.integer('download_count').defaultTo(0);
    table.integer('share_count').defaultTo(0);
    table.integer('bookmark_count').defaultTo(0);
    table.integer('like_count').defaultTo(0);
    table.integer('comment_count').defaultTo(0);
    table.decimal('average_rating', 3, 2).defaultTo(0);
    table.integer('rating_count').defaultTo(0);
    table.decimal('completion_rate', 5, 2).defaultTo(0); // Percentage of users who complete
    table.decimal('engagement_score', 5, 2).defaultTo(0); // Overall engagement metric
    
    // Learning Analytics
    table.integer('average_time_spent_seconds').defaultTo(0);
    table.decimal('difficulty_level', 3, 2).defaultTo(0); // 1-5 scale
    table.json('learning_outcomes').defaultTo('[]');
    table.json('prerequisites').defaultTo('[]');
    table.json('related_content').defaultTo('[]'); // IDs of related content
    table.integer('estimated_study_time_minutes').defaultTo(0);
    
    // Content Licensing and Rights
    table.string('license_type').defaultTo('all_rights_reserved');
    table.text('license_details');
    table.string('copyright_holder');
    table.string('attribution_required');
    table.boolean('commercial_use_allowed').defaultTo(false);
    table.boolean('derivative_works_allowed').defaultTo(false);
    table.boolean('redistribution_allowed').defaultTo(false);
    
    // External Content Integration
    table.string('external_url'); // For external content links
    table.string('external_platform'); // YouTube, Vimeo, etc.
    table.string('external_id'); // Platform-specific ID
    table.json('external_metadata').defaultTo('{}');
    table.timestamp('external_last_synced');
    table.boolean('external_auto_sync').defaultTo(false);
    
    // Content Scheduling and Availability
    table.timestamp('available_from');
    table.timestamp('available_until');
    table.json('availability_rules').defaultTo('{}'); // Complex availability rules
    table.boolean('is_time_restricted').defaultTo(false);
    table.json('time_restrictions').defaultTo('{}'); // Specific time windows
    
    // Content Security
    table.boolean('is_encrypted').defaultTo(false);
    table.string('encryption_key_id');
    table.boolean('drm_protected').defaultTo(false);
    table.json('drm_settings').defaultTo('{}');
    table.boolean('watermark_enabled').defaultTo(false);
    table.json('watermark_settings').defaultTo('{}');
    table.boolean('download_disabled').defaultTo(false);
    table.boolean('print_disabled').defaultTo(false);
    table.boolean('copy_disabled').defaultTo(false);
    
    // Content Backup and Archival
    table.boolean('is_backed_up').defaultTo(false);
    table.timestamp('last_backup_at');
    table.string('backup_location');
    table.boolean('is_archived').defaultTo(false);
    table.timestamp('archived_at');
    table.string('archive_location');
    table.enum('retention_policy', ['indefinite', 'academic_year', 'custom']).defaultTo('indefinite');
    table.timestamp('retention_until');
    
    // Content Collaboration
    table.boolean('allow_collaboration').defaultTo(false);
    table.json('collaborators').defaultTo('[]'); // User IDs with edit access
    table.boolean('track_changes').defaultTo(false);
    table.json('change_history').defaultTo('[]');
    table.uuid('last_edited_by').references('id').inTable('users').onDelete('SET NULL');
    table.timestamp('last_edited_at');
    
    // Content Organization
    table.integer('sort_order').defaultTo(0);
    table.boolean('is_required').defaultTo(false);
    table.boolean('is_downloadable').defaultTo(true);
    table.boolean('is_streamable').defaultTo(true);
    table.json('access_rules').defaultTo('{}');
    
    // Content Metadata
    table.string('author');
    table.string('publisher');
    table.string('edition');
    table.string('isbn');
    table.integer('publication_year');
    table.string('language').defaultTo('en');
    table.json('tags').defaultTo('[]');
    table.json('categories').defaultTo('[]');
    
    // Processing Status
    table.enum('processing_status', ['pending', 'processing', 'completed', 'failed']).defaultTo('completed');
    table.text('processing_error');
    table.json('processing_metadata').defaultTo('{}');
    
    // Analytics
    table.timestamp('last_accessed');
    
    // Status
    table.boolean('is_active').defaultTo(true);
    table.boolean('is_published').defaultTo(false);
    table.timestamp('published_at');
    
    // Metadata
    table.json('metadata').defaultTo('{}');
    table.timestamps(true, true);
    table.timestamp('deleted_at');
    
    // Indexes
    table.index(['institution_id']);
    table.index(['course_id']);
    table.index(['uploaded_by']);
    table.index(['type']);
    table.index(['is_active']);
    table.index(['is_published']);
    table.index(['sort_order']);
    table.index(['processing_status']);
    table.index(['content_path']);
    table.index(['version']);
    table.index(['is_latest_version']);
    table.index(['file_hash']);
    table.index(['file_extension']);
    table.index(['duration_seconds']);
    table.index(['quality_score']);
    table.index(['moderation_status']);
    table.index(['average_rating']);
    table.index(['available_from']);
    table.index(['available_until']);
    table.index(['is_archived']);
    table.index(['external_platform']);
    table.index(['license_type']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('content');
};