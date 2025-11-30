
import {
  config
} from 'dotenv';
import {
  resolve
} from 'path';
import { createServiceSupabaseClient } from '../lib/supabase-server';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });
// Also try .env if .env.local doesn't exist or lacks variables
config({ path: resolve(process.cwd(), '.env') });

const supabase = createServiceSupabaseClient();

async function setGold(userName: string, newAmount: number, reason: string) {
  console.log(`\n=== Admin Gold Adjustment ===`);
  console.log(`Target User:   "${userName}"`);
  console.log(`New Amount:    ${newAmount} gold`);
  console.log(`Reason:        "${reason}"`);
  console.log(`-----------------------------`);

  // 1. Find the user profile
  const { data: users, error: userError } = await supabase
    .from('user_profiles')
    .select('id, name, family_id')
    .ilike('name', userName);

  if (userError) {
    console.error('Error finding user:', userError.message);
    process.exit(1);
  }

  if (!users || users.length === 0) {
    console.error(`No user found with name "${userName}"`);
    process.exit(1);
  }

  const user = users[0];
  console.log(`Found User:    ${user.name} (${user.id})`);

  // 2. Get current character
  const { data: character, error: charError } = await supabase
    .from('characters')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (charError) {
    console.error('Error finding character:', charError.message);
    process.exit(1);
  }

  const oldAmount = character.gold || 0;
  const diff = newAmount - oldAmount;
  console.log(`Current Gold:  ${oldAmount}`);
  console.log(`Change:        ${diff > 0 ? '+' : ''}${diff}`);

  if (diff === 0) {
    console.log('No change needed. Exiting.');
    return;
  }

  // 3. Update Gold
  const { error: updateError } = await supabase
    .from('characters')
    .update({ gold: newAmount })
    .eq('id', character.id);

  if (updateError) {
    console.error('Failed to update gold:', updateError.message);
    process.exit(1);
  }

  console.log('✅ Gold updated successfully.');

  // 4. Log Transaction
  // We try to log this to the transactions table for audit purposes
  const { error: txError } = await supabase
    .from('transactions')
    .insert({
      user_id: user.id,
      type: 'BONUS_AWARD', // Closest fit for admin adjustment
      description: `Admin Adjustment: ${reason}`,
      gold_change: diff,
      xp_change: 0,
      gems_change: 0,
      honor_change: 0
    });

  if (txError) {
    console.error('⚠️ Gold updated, but failed to create transaction log:', txError.message);
  } else {
    console.log('✅ Transaction log created.');
  }
}

// Read args
const args = process.argv.slice(2);
if (args.length < 3) {
  console.error('Usage: npx tsx scripts/admin-set-gold.ts <username> <amount> <reason>');
  process.exit(1);
}

const [userArg, amountArg, reasonArg] = args;
const amount = parseInt(amountArg, 10);

if (isNaN(amount)) {
  console.error('Invalid amount provided.');
  process.exit(1);
}

setGold(userArg, amount, reasonArg).catch(e => console.error(e));
