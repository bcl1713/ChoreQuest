
import {
  config
} from 'dotenv';
import {
  resolve
} from 'path';
import { createServiceSupabaseClient } from '../lib/supabase-server';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env') });

const supabase = createServiceSupabaseClient();

async function auditGoldRecalc(userName: string) {
  console.log(`Starting gold reconstruction audit for user: "${userName}"...`);

  // 1. Find the user profile
  const { data: users, error: userError } = await supabase
    .from('user_profiles')
    .select('id, name')
    .ilike('name', userName);

  if (userError || !users?.length) {
    console.error('User not found:', userError?.message);
    return;
  }
  const user = users[0];
  console.log(`User: ${user.name} (${user.id})`);

  // 2. Get current gold
  const { data: character, error: charError } = await supabase
    .from('characters')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (charError) {
    console.error('Character not found:', charError.message);
    return;
  }
  console.log(`Current Stored Gold: ${character.gold}`);

  // 3. Calculate Earnings from Quests
  // Only count APPROVED quests as they are the ones that pay out
  const { data: quests, error: questError } = await supabase
    .from('quest_instances')
    .select('*')
    .eq('assigned_to_id', user.id)
    .eq('status', 'APPROVED');

  if (questError) {
    console.error('Error fetching quests:', questError.message);
    return;
  }

  let totalEarned = 0;
  console.log('\n--- Quest Earnings ---');
  console.log('Date       | Quest                          | Base | Vol% | Str% | Total');
  console.log('-----------|--------------------------------|------|------|------|------');

  quests.forEach(q => {
    const base = q.gold_reward || 0;
    const volBonus = q.volunteer_bonus || 0;
    const strBonus = q.streak_bonus || 0;
    
    // Logic: Total = Base + (Base * Vol) + (Base * Str)
    const payout = Math.round(base + (base * volBonus) + (base * strBonus));
    
    totalEarned += payout;

    const date = new Date(q.completed_at || q.updated_at || '').toISOString().slice(0, 10);
    console.log(`${date} | ${q.title.padEnd(30).slice(0,30)} | ${base.toString().padStart(4)} | ${volBonus.toFixed(2)} | ${strBonus.toFixed(2)} | ${payout.toString().padStart(4)}`);
  });
  console.log('--------------------------------------------------------------------');
  console.log(`Total Earned from ${quests.length} quests: ${totalEarned}`);


  // 3b. Calculate Earnings from Achievements
  const { data: userAchievements, error: uaError } = await supabase
    .from('user_achievements')
    .select('*, achievements(*)')
    .eq('user_id', user.id);

  if (uaError) {
    console.error('Error fetching achievements:', uaError.message);
  } else if (userAchievements && userAchievements.length > 0) {
    console.log('\n--- Achievement Earnings ---');
    console.log('Date       | Achievement                    | Gold');
    console.log('-----------|--------------------------------|------');
    
    userAchievements.forEach(ua => {
      // @ts-ignore
      const ach = ua.achievements;
      if (!ach) return;
      
      const reward = ach.gold_reward || 0;
      if (reward === 0) return;

      totalEarned += reward;
      const date = new Date(ua.unlocked_at || '').toISOString().slice(0, 10);
      console.log(`${date} | ${ach.name.padEnd(30).slice(0,30)} | ${reward}`);
    });
    console.log('--------------------------------------------------------------------');
  }


  // 4. Calculate Spending from Redemptions
  // Sum costs of all redemptions EXCEPT those that were denied (refunded)
  const { data: redemptions, error: redError } = await supabase
    .from('reward_redemptions')
    .select('*')
    .eq('user_id', user.id);

  if (redError) {
    console.error('Error fetching redemptions:', redError.message);
    return;
  }

  let totalSpent = 0;
  console.log('\n--- Reward Redemptions (Spending) ---');
  console.log('Date       | Reward                         | Status   | Cost');
  console.log('-----------|--------------------------------|----------|------');

  redemptions.forEach(r => {
    if (r.status === 'DENIED') {
      // Denied requests are refunded, so net cost is 0. We skip adding to totalSpent.
      // (Or strictly: we could add cost then subtract refund, but skipping is cleaner)
      const date = new Date(r.requested_at || '').toISOString().slice(0, 10);
      console.log(`${date} | ${r.reward_name.padEnd(30).slice(0,30)} | ${r.status.padEnd(8)} | 0 (Refunded)`);
      return;
    }

    const cost = r.cost || 0;
    totalSpent += cost;
    
    const date = new Date(r.requested_at || '').toISOString().slice(0, 10);
    console.log(`${date} | ${r.reward_name.padEnd(30).slice(0,30)} | ${r.status.padEnd(8)} | ${cost}`);
  });
  console.log('--------------------------------------------------------------------');
  console.log(`Total Spent on rewards: ${totalSpent}`);

  // 5. Final Calculation
  const theoreticalBalance = totalEarned - totalSpent;
  const diff = character.gold - theoreticalBalance;

  console.log('\n=== SUMMARY ===');
  console.log(`Total Earned:        ${totalEarned}`);
  console.log(`Total Spent:        -${totalSpent}`);
  console.log(`Theoretical Balance: ${theoreticalBalance}`);
  console.log(`Actual Balance:      ${character.gold}`);
  console.log(`Discrepancy:         ${diff}`);
  
  if (diff !== 0) {
    console.log('\nPossible explanations for discrepancy:');
    console.log('1. Initial gold balance was not 0.');
    console.log('2. Manual database adjustments.');
    console.log('3. Bugs where gold was deducted/added without a record.');
    console.log('4. "Boss Battle" rewards or other sources not covered by quests.');
  }
}

const targetUser = process.argv[2] || 'Towner';
auditGoldRecalc(targetUser).catch(e => console.error(e));
