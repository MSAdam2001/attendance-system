const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

async function addUser() {
  const client = new MongoClient(process.env.MONGODB_URI);

  try {
    console.log('🔌 Connecting to MongoDB...');
    await client.connect();
    console.log('✅ Connected!\n');

    const db = client.db('attendance_system');
    const hashedPassword = await bcrypt.hash('password123', 10);

    console.log('👤 Adding your account...');
    
    await db.collection('lecturers').insertOne({
      name: 'Mujaheed Said',
      email: 'mujaheedsaid8001@gmail.com',
      password: hashedPassword,
      department: 'Computer Science',
      university: 'Tech University',
      createdAt: new Date(),
      lastLogin: null,
      lastLoginMethod: null
    });

    console.log('✅ SUCCESS! Your account has been added!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📝 YOUR LOGIN CREDENTIALS:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email: mujaheedsaid8001@gmail.com');
    console.log('🔒 Password: password123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('🌐 Go to: http://localhost:3000/login');

  } catch (error) {
    if (error.code === 11000) {
      console.log('✅ Good news! Your account already exists!\n');
      console.log('📧 Email: mujaheedsaid8001@gmail.com');
      console.log('🔒 Password: password123');
    } else {
      console.error('❌ Error:', error.message);
    }
  } finally {
    await client.close();
    console.log('\n👋 Done!');
  }
}

addUser();