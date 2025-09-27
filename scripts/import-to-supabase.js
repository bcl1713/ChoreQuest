#!/usr/bin/env node

/**
 * Supabase Import Script for ChoreQuest Migration
 *
 * Imports data exported from PostgreSQL into Supabase with proper
 * UUID conversion and auth user creation.
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Initialize Supabase client (will be configured with environment variables)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Mapping from old CUID IDs to new UUIDs
const idMappings = new Map();

function generateUUID(oldId) {
  if (!idMappings.has(oldId)) {
    idMappings.set(oldId, uuidv4());
  }
  return idMappings.get(oldId);
}

function transformFieldNames(obj) {
  const transformed = {};
  for (const [key, value] of Object.entries(obj)) {
    // Convert camelCase to snake_case
    const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
    transformed[snakeKey] = value;
  }
  return transformed;
}

async function readExportData(tableName) {
  try {
    const filePath = path.join(__dirname, '../data-export', `${tableName}.json`);
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.warn(`⚠️  No export data found for ${tableName}: ${error.message}`);
    return [];
  }
}

async function createAuthUsers(users) {
  console.log('Creating Supabase Auth users...');
  const authUsers = [];

  for (const user of users) {
    try {
      // Note: In a real migration, you'd need to handle password migration
      // For now, we'll create users with temporary passwords they need to reset
      const { data: authUser, error } = await supabase.auth.admin.createUser({
        email: user.email,
        password: 'TemporaryPassword123!', // Users will need to reset
        email_confirm: true
      });

      if (error) {
        console.error(`❌ Failed to create auth user for ${user.email}:`, error.message);
        continue;
      }

      // Map old user ID to new auth user ID
      idMappings.set(user.id, authUser.user.id);
      authUsers.push(authUser.user);

      console.log(`✅ Created auth user: ${user.email} (${authUser.user.id})`);

    } catch (error) {
      console.error(`❌ Error creating auth user for ${user.email}:`, error.message);
    }
  }

  return authUsers;
}

async function importTable(tableName, data, transformFn = null) {
  if (data.length === 0) {
    console.log(`⏭️  Skipping ${tableName} (no data)`);
    return;
  }

  console.log(`Importing ${data.length} records to ${tableName}...`);

  try {
    const transformedData = data.map(record => {
      let transformed = transformFn ? transformFn(record) : record;
      transformed = transformFieldNames(transformed);
      return transformed;
    });

    const { data: result, error } = await supabase
      .from(tableName)
      .insert(transformedData);

    if (error) {
      console.error(`❌ Error importing ${tableName}:`, error.message);
      return;
    }

    console.log(`✅ Imported ${transformedData.length} records to ${tableName}`);

  } catch (error) {
    console.error(`❌ Error importing ${tableName}:`, error.message);
  }
}

async function importDatabase() {
  try {
    console.log('🚀 Starting Supabase import...\n');

    // Read all export data
    const families = await readExportData('families');
    const users = await readExportData('users');
    const characters = await readExportData('characters');
    const questTemplates = await readExportData('quest_templates');
    const questInstances = await readExportData('quest_instances');
    const bossBattles = await readExportData('boss_battles');
    const bossBattleParticipants = await readExportData('boss_battle_participants');
    const transactions = await readExportData('transactions');
    const rewards = await readExportData('rewards');
    const rewardRedemptions = await readExportData('reward_redemptions');
    const achievements = await readExportData('achievements');
    const userAchievements = await readExportData('user_achievements');
    const sosRequests = await readExportData('sos_requests');

    // Step 1: Create auth users first
    if (users.length > 0) {
      await createAuthUsers(users);
    }

    // Step 2: Import families with ID mapping
    await importTable('families', families, (record) => ({
      ...record,
      id: generateUUID(record.id)
    }));

    // Step 3: Import user profiles
    await importTable('user_profiles', users, (record) => ({
      id: idMappings.get(record.id), // Use auth user ID
      email: record.email,
      name: record.name,
      role: record.role,
      family_id: idMappings.get(record.familyId),
      created_at: record.createdAt,
      updated_at: record.updatedAt
    }));

    // Step 4: Import characters
    await importTable('characters', characters, (record) => ({
      ...record,
      id: generateUUID(record.id),
      user_id: idMappings.get(record.userId)
    }));

    // Step 5: Import quest templates
    await importTable('quest_templates', questTemplates, (record) => ({
      ...record,
      id: generateUUID(record.id),
      family_id: idMappings.get(record.familyId)
    }));

    // Step 6: Import quest instances
    await importTable('quest_instances', questInstances, (record) => ({
      ...record,
      id: generateUUID(record.id),
      family_id: idMappings.get(record.familyId),
      template_id: record.templateId ? idMappings.get(record.templateId) : null,
      assigned_to_id: record.assignedToId ? idMappings.get(record.assignedToId) : null,
      created_by_id: idMappings.get(record.createdById)
    }));

    // Step 7: Import boss battles
    await importTable('boss_battles', bossBattles, (record) => ({
      ...record,
      id: generateUUID(record.id),
      family_id: idMappings.get(record.familyId)
    }));

    // Step 8: Import boss battle participants
    await importTable('boss_battle_participants', bossBattleParticipants, (record) => ({
      ...record,
      id: generateUUID(record.id),
      boss_battle_id: idMappings.get(record.bossBattleId),
      user_id: idMappings.get(record.userId)
    }));

    // Step 9: Import transactions
    await importTable('transactions', transactions, (record) => ({
      ...record,
      id: generateUUID(record.id),
      user_id: idMappings.get(record.userId),
      related_id: record.relatedId ? idMappings.get(record.relatedId) : null
    }));

    // Step 10: Import rewards
    await importTable('rewards', rewards, (record) => ({
      ...record,
      id: generateUUID(record.id),
      family_id: idMappings.get(record.familyId)
    }));

    // Step 11: Import reward redemptions
    await importTable('reward_redemptions', rewardRedemptions, (record) => ({
      ...record,
      id: generateUUID(record.id),
      user_id: idMappings.get(record.userId),
      reward_id: idMappings.get(record.rewardId),
      approved_by: record.approvedBy ? idMappings.get(record.approvedBy) : null
    }));

    // Step 12: Import achievements
    await importTable('achievements', achievements, (record) => ({
      ...record,
      id: generateUUID(record.id)
    }));

    // Step 13: Import user achievements
    await importTable('user_achievements', userAchievements, (record) => ({
      ...record,
      id: generateUUID(record.id),
      user_id: idMappings.get(record.userId),
      achievement_id: idMappings.get(record.achievementId)
    }));

    // Step 14: Import SOS requests
    await importTable('sos_requests', sosRequests, (record) => ({
      ...record,
      id: generateUUID(record.id),
      requester_id: idMappings.get(record.requesterId),
      helper_id: record.helperId ? idMappings.get(record.helperId) : null
    }));

    console.log('\n✅ Import completed successfully!');
    console.log('📝 Note: All users have temporary passwords and must reset them on first login.');

  } catch (error) {
    console.error('❌ Import failed:', error);
    process.exit(1);
  }
}

// Run import if called directly
if (require.main === module) {
  importDatabase();
}

module.exports = { importDatabase };