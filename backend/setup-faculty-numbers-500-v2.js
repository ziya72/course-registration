// Setup faculty numbers for 500 test students (v2)
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function setupFacultyNumbers500v2() {
  try {
    console.log('🔧 Setting up faculty numbers for 500 test students (v2)...\n');
    
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
    
    // Create faculty numbers for 500 test students (3000-3499 range)
    const facultyNumbers = [];
    
    for (let i = 0; i < 500; i++) {
      const branchIndex = i % branches.length;
      const branch = branches[branchIndex];
      const facultyNo = `24${branch}BEA${String(3000 + i).padStart(4, '0')}`;
      
      facultyNumbers.push({
        faculty_no: facultyNo,
        admission_year: 2024,
        branch_code: branch,
        branch_name: branchNames[branch],
        roll_number: String(3000 + i).padStart(4, '0'),
        program_type: 'B.Tech'
      });
    }
    
    console.log(`📊 Creating ${facultyNumbers.length} faculty numbers...`);
    console.log(`📋 Range: 24CSEBEA3000 to 24ITBEA3499`);
    
    const result = await prisma.facultyNumber.createMany({
      data: facultyNumbers,
      skipDuplicates: true
    });
    
    console.log(`✅ Created ${result.count} new faculty numbers`);
    console.log('🎉 Setup complete! You can now upload test-students-500-v2.csv');
    console.log('\n🚀 Expected Performance:');
    console.log('   • 10 batches of 50 students each');
    console.log('   • Processing time: 3-8 seconds');
    console.log('   • Speed: ~60-150 records/second');
    
  } catch (error) {
    console.error('❌ Error setting up faculty numbers:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

setupFacultyNumbers500v2();