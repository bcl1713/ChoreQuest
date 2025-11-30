import {
  config
} from 'dotenv';
import {
  resolve
} from 'path';
import {
  createServiceSupabaseClient
} from '../lib/supabase-server';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });
// Also try .env if .env.local doesn't exist or lacks variables
config({ path: resolve(process.cwd(), '.env') });

const supabase = createServiceSupabaseClient();

async function auditGold(userName: string) {
  console.log(`Starting gold audit for user: "${userName}"...`);

  // 1. Find the user profile
  const { data: users, error: userError } = await supabase
    .from('user_profiles')
    .select('id, name, family_id')
    .ilike('name', userName);

  if (userError) {
    console.error('Error finding user:', userError.message);
    return;
  }

  if (!users || users.length === 0) {
    console.error(`No user found with name "${userName}"`);
    return;
  }

  if (users.length > 1) {
    console.warn(`Multiple users found with name "${userName}". Using the first one: ${users[0].name} (${users[0].id})`);
  }

  const user = users[0];
  console.log(`Found User: ${user.name} (ID: ${user.id})`);

  // 2. Get the character to see current gold
  const { data: character, error: charError } = await supabase
    .from('characters')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (charError) {
    console.error('Error finding character:', charError.message);
    return;
  }

  console.log(`Character: ${character.name}`);
  console.log(`Current Gold Balance: ${character.gold}`);
  console.log('----------------------------------------');

  // 3. Get transaction history
  const { data: transactions, error: transError } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true }); // Ascending to calculate running balance

  if (transError) {
    console.error('Error fetching transactions:', transError.message);
    return;
  }

  if (!transactions || transactions.length === 0) {
    console.log('No transaction history found.');
    return;
  }

  console.log(`Found ${transactions.length} transactions.`);
  console.log('Calculating history...');
  console.log('----------------------------------------');
  console.log('Date                 | Type             | Change | Balance (Calc) | Description');
  console.log('---------------------|------------------|--------|----------------|-------------------');

  let calculatedBalance = 0;

  // Adjust width for formatting
  const fmt = (str: string, len: number) => (str || '').padEnd(len).slice(0, len);
  const fmtNum = (num: number | null, len: number) => (num !== null ? num.toString() : '0').padStart(len);

  for (const tx of transactions) {
    const change = tx.gold_change || 0;
    if (change === 0) continue; // Skip non-gold transactions if any

    calculatedBalance += change;
    
    const date = new Date(tx.created_at || '').toISOString().replace('T', ' ').slice(0, 19);
    const type = fmt(tx.type, 16);
    const changeStr = fmtNum(change, 6);
    const balStr = fmtNum(calculatedBalance, 14);
    const desc = tx.description || '';

    console.log(`${date} | ${type} | ${changeStr} | ${balStr} | ${desc}`);
  }

  console.log('----------------------------------------');
  console.log(`Calculated Balance from History: ${calculatedBalance}`);
  console.log(`Actual Stored Balance:           ${character.gold}`);
  
  const diff = (character.gold || 0) - calculatedBalance;
  if (diff !== 0) {
    console.log(`\nWARNING: Discrepancy of ${diff} gold detected!`);
    console.log('The transaction history does not sum up to the current balance.');
    console.log('Possible reasons: Manual DB edits, missing transaction logs for some actions, or initial balance was not 0.');
  } else {
    console.log('\nHistory matches current balance perfectly.');
  }
}

// Run the audit
const targetUser = process.argv[2] || 'Towner';
auditGold(targetUser).catch(e => console.error(e));
