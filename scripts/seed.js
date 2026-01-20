// scripts/seed.js
// Run: node scripts/seed.js

const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

const uri = process.env.MONGODB_URI;

if (!uri) {
  console.error('❌ MONGODB_URI not found in .env.local');
  process.exit(1);
}

async function seed() {
  const client = new MongoClient(uri);

  try {
    console.log('🔌 Connecting to MongoDB...');
    await client.connect();
    console.log('✅ Connected to MongoDB Atlas\n');

    const db = client.db('attendance_system');
    const lecturersCollection = db.collection('lecturers');

    // Check if lecturers already exist
    const existingCount = await lecturersCollection.countDocuments();
    
    if (existingCount > 0) {
      console.log(`⚠️  Database already has ${existingCount} lecturer(s)`);
      console.log('Do you want to:');
      console.log('1. Skip seeding (keep existing data)');
      console.log('2. Add more test lecturers');
      console.log('3. Clear all and reseed\n');
      
      // For automation, we'll just skip if data exists
      console.log('📊 Existing lecturers:');
      const existing = await lecturersCollection.find({}).toArray();
      existing.forEach((lec, i) => {
        console.log(`   ${i + 1}. ${lec.name} (${lec.email}) - ${lec.department}`);
      });
      console.log('\n✅ Seed skipped - data already exists');
      return;
    }

    console.log('🔐 Hashing passwords...');
    const hashedPassword = await bcrypt.hash('password123', 10);

    console.log('👥 Creating test lecturers...\n');

    const testLecturers = [
      {
        name: 'John Smith',
        email: 'john.smith@gmail.com',
        password: hashedPassword,
        department: 'Computer Science',
        university: 'Tech University',
        bio: 'Senior lecturer specializing in algorithms and data structures',
        createdAt: new Date(),
        lastLogin: null,
        lastLoginMethod: null
      },
      {
        name: 'Sarah Johnson',
        email: 'sarah.johnson@gmail.com',
        password: hashedPassword,
        department: 'Mathematics',
        university: 'Tech University',
        bio: 'Associate professor in applied mathematics',
        createdAt: new Date(),
        lastLogin: null,
        lastLoginMethod: null
      },
      {
        name: 'Michael Chen',
        email: 'michael.chen@outlook.com',
        password: hashedPassword,
        department: 'Engineering',
        university: 'Tech University',
        bio: 'Lecturer in mechanical engineering and robotics',
        createdAt: new Date(),
        lastLogin: null,
        lastLoginMethod: null
      },
      {
        name: 'Emily Davis',
        email: 'test@example.com',
        password: hashedPassword,
        department: 'Physics',
        university: 'Tech University',
        bio: 'Professor of quantum physics and astronomy',
        createdAt: new Date(),
        lastLogin: null,
        lastLoginMethod: null
      },
      {
        name: 'David Williams',
        email: 'david.williams@hotmail.com',
        password: hashedPassword,
        department: 'Biology',
        university: 'Tech University',
        bio: 'Research lecturer in molecular biology',
        createdAt: new Date(),
        lastLogin: null,
        lastLoginMethod: null
      }
    ];

    const result = await lecturersCollection.insertMany(testLecturers);
    console.log(`✅ Successfully inserted ${result.insertedCount} lecturers!\n`);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📝 TEST CREDENTIALS - Use these to login:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    testLecturers.forEach((lec, i) => {
      console.log(`${i + 1}. ${lec.name} (${lec.department})`);
      console.log(`   📧 Email: ${lec.email}`);
      console.log(`   🔒 Password: password123\n`);
    });

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎯 Quick Test:');
    console.log('   1. Visit http://localhost:3000/login');
    console.log('   2. Use: test@example.com / password123');
    console.log('   3. Or click any OAuth button (simulated)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Create indexes for better performance
    await lecturersCollection.createIndex({ email: 1 }, { unique: true });
    console.log('📑 Created email index for faster lookups');

  } catch (error) {
    console.error('❌ Seed error:', error.message);
    if (error.code === 11000) {
      console.log('💡 Tip: Duplicate email detected. Some test users may already exist.');
    }
  } finally {
    await client.close();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

// Run the seed
seed().catch(console.error);