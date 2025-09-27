#!/usr/bin/env node

/**
 * Database Export Script for ChoreQuest Supabase Migration
 *
 * Exports all data from the current PostgreSQL database to JSON files
 * that can be imported into Supabase after schema migration.
 */

const { PrismaClient } = require('../lib/generated/prisma');
const fs = require('fs').promises;
const path = require('path');

const prisma = new PrismaClient();

async function exportTable(tableName, prismaModel) {
  try {
    console.log(`Exporting ${tableName}...`);
    const data = await prismaModel.findMany();

    const exportPath = path.join(__dirname, '../data-export', `${tableName}.json`);
    await fs.writeFile(exportPath, JSON.stringify(data, null, 2));

    console.log(`✅ Exported ${data.length} records from ${tableName}`);
    return data.length;
  } catch (error) {
    console.error(`❌ Error exporting ${tableName}:`, error.message);
    return 0;
  }
}

async function exportDatabase() {
  try {
    // Create export directory
    const exportDir = path.join(__dirname, '../data-export');
    await fs.mkdir(exportDir, { recursive: true });

    console.log('🚀 Starting database export...\n');

    // Export all tables in dependency order
    const exports = [
      ['families', prisma.family],
      ['users', prisma.user],
      ['characters', prisma.character],
      ['quest_templates', prisma.questTemplate],
      ['quest_instances', prisma.questInstance],
      ['boss_battles', prisma.bossBattle],
      ['boss_battle_participants', prisma.bossBattleParticipant],
      ['transactions', prisma.transaction],
      ['rewards', prisma.reward],
      ['reward_redemptions', prisma.rewardRedemption],
      ['achievements', prisma.achievement],
      ['user_achievements', prisma.userAchievement],
      ['sos_requests', prisma.sOSRequest]
    ];

    let totalRecords = 0;

    for (const [tableName, model] of exports) {
      const count = await exportTable(tableName, model);
      totalRecords += count;
    }

    // Create export metadata
    const metadata = {
      exportDate: new Date().toISOString(),
      totalRecords,
      version: '1.0.0',
      source: 'ChoreQuest PostgreSQL',
      target: 'Supabase',
      notes: 'Pre-migration data export'
    };

    await fs.writeFile(
      path.join(exportDir, 'metadata.json'),
      JSON.stringify(metadata, null, 2)
    );

    console.log(`\n✅ Export completed successfully!`);
    console.log(`📊 Total records exported: ${totalRecords}`);
    console.log(`📁 Export location: ${exportDir}`);

  } catch (error) {
    console.error('❌ Export failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run export if called directly
if (require.main === module) {
  exportDatabase();
}

module.exports = { exportDatabase };