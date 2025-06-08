const bcrypt = require('bcryptjs');

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  // Clear existing data
  await knex('users').del();
  await knex('institutions').del();

  // Create demo institution
  const [institutionId] = await knex('institutions').insert({
    name: 'Demo University',
    slug: 'demo-university',
    subdomain: 'demo',
    type: 'university',
    email: 'admin@demo.scholarbridgelms.com',
    phone: '+1234567890',
    address: '123 Education Street, Learning City, LC 12345',
    website: 'https://demo.scholarbridgelms.com',
    is_active: true,
    is_trial: true,
    trial_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    branding: JSON.stringify({
      primaryColor: '#1976d2',
      secondaryColor: '#dc004e',
      logoUrl: null,
      faviconUrl: null
    }),
    settings: JSON.stringify({
      allowSelfRegistration: false,
      requireEmailVerification: true,
      sessionTimeout: 30,
      maxLoginAttempts: 5
    }),
    features: JSON.stringify({
      library: true,
      analytics: true,
      webinars: false,
      blog: false
    })
  }).returning('id');

  // Create SuperAdmin user (not tied to any institution)
  const superAdminPassword = await bcrypt.hash('SuperAdmin123!', 12);
  await knex('users').insert({
    username: 'superadmin',
    email: 'superadmin@scholarbridgelms.com',
    phone: '+1234567891',
    password_hash: superAdminPassword,
    first_name: 'Super',
    last_name: 'Admin',
    role: 'super_admin',
    institution_id: null, // SuperAdmin is not tied to any institution
    is_active: true,
    force_password_change: false,
    permissions: JSON.stringify([])
  });

  // Create Institution Admin for demo institution
  const adminPassword = await bcrypt.hash('Admin123!', 12);
  await knex('users').insert({
    username: 'admin',
    email: 'admin@demo.scholarbridgelms.com',
    phone: '+1234567892',
    password_hash: adminPassword,
    first_name: 'Institution',
    last_name: 'Admin',
    role: 'institution_admin',
    institution_id: institutionId,
    is_active: true,
    force_password_change: false,
    permissions: JSON.stringify([])
  });

  // Create Faculty user
  const facultyPassword = await bcrypt.hash('Faculty123!', 12);
  await knex('users').insert({
    username: 'faculty',
    email: 'faculty@demo.scholarbridgelms.com',
    phone: '+1234567893',
    password_hash: facultyPassword,
    first_name: 'John',
    last_name: 'Faculty',
    role: 'faculty',
    institution_id: institutionId,
    is_active: true,
    force_password_change: false,
    permissions: JSON.stringify([])
  });

  // Create Student user
  const studentPassword = await bcrypt.hash('Student123!', 12);
  await knex('users').insert({
    username: 'student',
    email: 'student@demo.scholarbridgelms.com',
    phone: '+1234567894',
    password_hash: studentPassword,
    first_name: 'Jane',
    last_name: 'Student',
    role: 'student',
    institution_id: institutionId,
    is_active: true,
    force_password_change: false,
    permissions: JSON.stringify([])
  });

  // Create Librarian user
  const librarianPassword = await bcrypt.hash('Librarian123!', 12);
  await knex('users').insert({
    username: 'librarian',
    email: 'librarian@demo.scholarbridgelms.com',
    phone: '+1234567895',
    password_hash: librarianPassword,
    first_name: 'Bob',
    last_name: 'Librarian',
    role: 'librarian',
    institution_id: institutionId,
    is_active: true,
    force_password_change: false,
    permissions: JSON.stringify([])
  });

  console.log('✅ Initial seed data created successfully!');
  console.log('');
  console.log('🏢 Demo Institution:');
  console.log('   URL: http://demo.localhost');
  console.log('   Name: Demo University');
  console.log('');
  console.log('👤 Default Users:');
  console.log('   SuperAdmin: superadmin / SuperAdmin123! (admin.localhost)');
  console.log('   Admin: admin / Admin123! (demo.localhost)');
  console.log('   Faculty: faculty / Faculty123! (demo.localhost)');
  console.log('   Student: student / Student123! (demo.localhost)');
  console.log('   Librarian: librarian / Librarian123! (demo.localhost)');
  console.log('');
};