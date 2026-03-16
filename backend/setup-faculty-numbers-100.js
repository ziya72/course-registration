// Setup faculty numbers for 100 test students
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function setupFacultyNumbers100() {
  try {
    console.log('🔧 Setting up faculty numbers for 100 test students...\n');
    
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
    
    // Create faculty numbers for 100 test students (600-699 range)
    const facultyNumbers = [];
    
    for (let i = 0; i < 100; i++) {
      const branchIndex = i % branches.length;
      const branch = branches[branchIndex];
      const facultyNo = `24${branch}BEA${String(600 + i).padStart(3, '0')}`;
      
      facultyNumbers.push({
        faculty_no: facultyNo,
        admission_year: 2024,
        branch_code: branch,
        branch_name: branchNames[branch],
        roll_number: String(600 + i).padStart(3, '0'),
        program_type: 'B.Tech'
      });
    }
    
    console.log(`📊 Creating ${facultyNumbers.length} faculty numbers...`);
    
    const result = await prisma.facultyNumber.createMany({
      data: facultyNumbers,
      skipDuplicates: true
    });
    
    console.log(`✅ Created ${result.count} new faculty numbers`);
    console.log('🎉 Setup complete! You can now upload test-students-100.csv');
    
  } catch (error) {
    console.error('❌ Error setting up faculty numbers:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

setupFacultyNumbers100();