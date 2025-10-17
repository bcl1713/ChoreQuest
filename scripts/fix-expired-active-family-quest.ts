/**
 * Script to fix characters with expired active family quests
 *
 * This clears active_family_quest_id from characters when the quest has expired.
 * Run with: npx tsx scripts/fix-expired-active-family-quest.ts
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing required environment variables:');
  console.error('- SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function fixExpiredActiveFamilyQuests() {
  console.log('🔍 Finding characters with expired active family quests...\n');

  const now = new Date().toISOString();

  // Find all characters with an active_family_quest_id
  const { data: characters, error: charError } = await supabase
    .from('characters')
    .select('id, user_id, active_family_quest_id')
    .not('active_family_quest_id', 'is', null);

  if (charError) {
    console.error('❌ Error fetching characters:', charError);
    process.exit(1);
  }

  if (!characters || characters.length === 0) {
    console.log('✅ No characters found with active family quests.');
    return;
  }

  console.log(`Found ${characters.length} character(s) with active family quests.\n`);

  let fixedCount = 0;
  let alreadyValidCount = 0;

  for (const character of characters) {
    // Check if the quest is expired
    const { data: quest, error: questError } = await supabase
      .from('quest_instances')
      .select('id, title, status, cycle_end_date, quest_type')
      .eq('id', character.active_family_quest_id)
      .single();

    if (questError) {
      console.log(`⚠️  Character ${character.id}: Could not find quest ${character.active_family_quest_id}`);
      console.log(`   Clearing the reference...`);

      const { error: clearError } = await supabase
        .from('characters')
        .update({ active_family_quest_id: null })
        .eq('id', character.id);

      if (clearError) {
        console.error(`   ❌ Error clearing: ${clearError.message}`);
      } else {
        console.log(`   ✅ Cleared non-existent quest reference\n`);
        fixedCount++;
      }
      continue;
    }

    // Check if quest has expired
    const questExpired = new Date(quest.cycle_end_date) < new Date(now);
    const questNotActive = !['CLAIMED', 'IN_PROGRESS'].includes(quest.status);

    if (questExpired || questNotActive) {
      console.log(`❌ Character ${character.id} has expired/invalid active quest:`);
      console.log(`   Quest: "${quest.title}" (${quest.id})`);
      console.log(`   Status: ${quest.status}`);
      console.log(`   End Date: ${quest.cycle_end_date}`);
      console.log(`   Expired: ${questExpired ? 'YES' : 'NO'}`);
      console.log(`   Clearing the reference...`);

      const { error: clearError } = await supabase
        .from('characters')
        .update({ active_family_quest_id: null })
        .eq('id', character.id);

      if (clearError) {
        console.error(`   ❌ Error clearing: ${clearError.message}`);
      } else {
        console.log(`   ✅ Successfully cleared!\n`);
        fixedCount++;
      }
    } else {
      console.log(`✅ Character ${character.id} has valid active quest: "${quest.title}"`);
      alreadyValidCount++;
    }
  }

  console.log('\n📊 Summary:');
  console.log(`   Fixed: ${fixedCount}`);
  console.log(`   Already Valid: ${alreadyValidCount}`);
  console.log(`   Total Checked: ${characters.length}`);
}

// Run the fix
fixExpiredActiveFamilyQuests()
  .then(() => {
    console.log('\n✅ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
