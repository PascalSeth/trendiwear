require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

const adapter = new PrismaPg({
  connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter,
});

async function setupTrialsForExistingProfessionals() {
  try {
    console.log('\n🚀 Starting setup of subscription trials for existing professionals...\n');

    // Find all professionals without ProfessionalTrial records
    const professionalsWithoutTrialRecords = await prisma.professionalProfile.findMany({
      where: {
        trial: null, // No ProfessionalTrial record
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
          },
        },
      },
    });

    if (professionalsWithoutTrialRecords.length === 0) {
      console.log('✅ All professionals already have trial records set!\n');
      await prisma.$disconnect();
      return;
    }

    console.log(`📊 Found ${professionalsWithoutTrialRecords.length} professionals without trial records\n`);

    const now = new Date();
    const trialEndDate = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000); // 90 days

    let successCount = 0;
    let errorCount = 0;

    // Create ProfessionalTrial records for each professional
    for (const professional of professionalsWithoutTrialRecords) {
      try {
        // Create ProfessionalTrial record
        const trial = await prisma.professionalTrial.create({
          data: {
            professionalId: professional.id,
            startDate: professional.trialStartDate || now,
            endDate: professional.trialEndDate || trialEndDate,
            daysRemaining: 90,
            completed: false,
          },
        });
        
        // Also update the Profile itself for direct access
        await prisma.professionalProfile.update({
          where: { id: professional.id },
          data: {
            trialStartDate: trial.startDate,
            trialEndDate: trial.endDate,
            isOnTrial: true,
            subscriptionStatus: 'TRIAL'
          }
        });

        console.log(`✓ ${professional.user.firstName || 'Professional'} (${professional.user.email})`);
        console.log(`  Business: ${professional.businessName}`);
        console.log(`  Trial Record Created: ${trial.startDate.toLocaleDateString()} → ${trial.endDate.toLocaleDateString()}`);
        console.log(`  Status: Trial activated\n`);

        successCount++;
      } catch (error) {
        console.error(
          `✗ Failed to create trial for ${professional.user.email}:`,
          error instanceof Error ? error.message : 'Unknown error'
        );
        errorCount++;
      }
    }

    // Summary
    console.log('\n' + '='.repeat(70));
    console.log('📈 MIGRATION SUMMARY');
    console.log('='.repeat(70));
    console.log(`✅ Successfully set up trials: ${successCount} professionals`);
    console.log(`❌ Failed: ${errorCount} professionals`);
    console.log(`⏰ Trial duration: 90 days`);
    console.log(`📅 Trial start date: ${now.toLocaleDateString()}`);
    console.log(`📅 Trial end date: ${trialEndDate.toLocaleDateString()}`);
    console.log('='.repeat(70) + '\n');

    console.log('🎉 Setup completed successfully!');
  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the setup
setupTrialsForExistingProfessionals();
