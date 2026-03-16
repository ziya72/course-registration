// Setup faculty numbers for test data
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function setupFacultyNumbers() {
  try {
    console.log('🔧 Setting up faculty numbers for test data...\n');
    
    const branches = ['CSE', 'ECE', 'ME', 'EE', 'CE', 'CHE', 'BT', 'AM', 'PE', 'IT'];
    const branchNames = {
      'CSE': 'Computer Science & Engineering',
      'ECE': 'Electronics & Communication Engineering', 
      'ME': 'Mechanical Engineering',
      'EE': 'Electrical Engineering',
      'CE': 'Civil Engineering',
      'CHE': 'Chemical Engineering',
      'BT': 'Biotechnology',
      'AM': 'Applied Mathematics',
      'PE': 'Petroleum Engineering',
      'IT': 'Information Technology'
    };
    
    // Create faculty numbers for 500 test students
    const facultyNumbers = [];
    
    for (let i = 1; i <= 500; i++) {
      const branchIndex = (i - 1) % branches.length;
      const branch = branches[branchIndex];
      const facultyNo = `24${branch}BEA${String(i).padStart(3, '0')}`;
      
      facultyNumbers.push({
        faculty_no: facultyNo,
        admission_year: 2024,
        branch_code: branch,
        branch_name: branchNames[branch],
        roll_number: String(i).padStart(3, '0'),
        program_type: 'B.Tech'
      });
    }
    
    // Bulk insert faculty numbers
    console.log(`📊 Creating ${facultyNumbers.length} faculty numbers...`);
    
    const result = await prisma.facultyNumber.createMany({
      data: facultyNumbers,
      skipDuplicates: true
    });
    
    console.log(`✅ Created ${result.count} faculty numbers`);
    
    // Also create a test admin user
    const bcrypt = require('bcrypt');
    const adminPassword = await bcrypt.hash('admin123', 10);
    
    await prisma.admin.upsert({
      where: { email: 'admin@myamu.ac.in' },
      create: {
        admin_id: 'ADMIN001',
        name: 'System Administrator',
        email: 'admin@myamu.ac.in',
        password_hash: adminPassword,
        is_active: true
      },
      update: {
        password_hash: adminPassword,
        is_active: true
      }
    });
    
    console.log('✅ Test admin created: admin@myamu.ac.in / admin123');
    
    console.log('\n🎉 Setup complete! You can now upload the test CSV file.');
    
  } catch (error) {
    console.error('❌ Error setting up faculty numbers:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

setupFacultyNumbers();