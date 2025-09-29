#!/usr/bin/env node

/**
 * Create demo family data for Supabase
 * This script creates "The Smith Family" with parent@demo.com for E2E testing
 */

const { createClient } = require('@supabase/supabase-js');

// Supabase configuration for local development
const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseKey = 'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz'; // service_role key for admin operations

const supabase = createClient(supabaseUrl, supabaseKey);

async function createDemoFamily() {
  try {
    console.log('🌱 Creating demo family data...');

    // Check if demo family already exists
    const { data: existingFamily } = await supabase
      .from('families')
      .select('*')
      .eq('code', 'DEMO123')
      .single();

    if (existingFamily) {
      console.log('✅ Demo family already exists');
      return;
    }

    // Create demo family
    const { data: family, error: familyError } = await supabase
      .from('families')
      .insert({
        name: 'The Smith Family',
        code: 'DEMO123',
      })
      .select()
      .single();

    if (familyError) {
      throw familyError;
    }

    console.log('👨‍👩‍👧‍👦 Created demo family:', family.name);

    // Create demo parent user via auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: 'parent@demo.com',
      password: 'password123',
      email_confirm: true
    });

    if (authError) {
      throw authError;
    }

    console.log('👤 Created demo user auth:', authData.user.email);

    // Create user profile
    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        id: authData.user.id,
        email: 'parent@demo.com',
        name: 'Sarah Smith',
        role: 'GUILD_MASTER',
        family_id: family.id,
      });

    if (profileError) {
      throw profileError;
    }

    // Create character
    const { error: characterError } = await supabase
      .from('characters')
      .insert({
        user_id: authData.user.id,
        name: 'Lady Sarah',
        class: 'HEALER',
        level: 10,
        xp: 2500,
        gold: 500,
        gems: 50,
        honor_points: 100,
      });

    if (characterError) {
      throw characterError;
    }

    // Create some quest templates
    const questTemplates = [
      {
        title: "Make Your Bed",
        description: "Tidy up your room by making your bed neatly",
        xp_reward: 25,
        gold_reward: 5,
        difficulty: 'EASY',
        category: 'DAILY',
        family_id: family.id,
        class_bonuses: {
          KNIGHT: 5,
          MAGE: 0,
          RANGER: 0,
          ROGUE: 2,
          HEALER: 0,
        },
      },
      {
        title: "Homework Quest",
        description: "Complete your daily homework assignments",
        xp_reward: 50,
        gold_reward: 10,
        difficulty: 'MEDIUM',
        category: 'DAILY',
        family_id: family.id,
        class_bonuses: {
          KNIGHT: 0,
          MAGE: 15,
          RANGER: 0,
          ROGUE: 0,
          HEALER: 5,
        },
      },
    ];

    const { error: questError } = await supabase
      .from('quest_templates')
      .insert(questTemplates);

    if (questError) {
      throw questError;
    }

    console.log('📜 Created quest templates');

    // Create reward store items
    const rewards = [
      {
        name: "Extra Screen Time",
        description: "30 minutes of additional device/TV time",
        cost: 50,
        family_id: family.id,
      },
      {
        name: "Stay Up 30 Minutes Later",
        description: "Extend bedtime by 30 minutes on weekend",
        cost: 75,
        family_id: family.id,
      },
    ];

    const { error: rewardError } = await supabase
      .from('rewards')
      .insert(rewards);

    if (rewardError) {
      throw rewardError;
    }

    console.log('🏪 Created reward store items');

    console.log('✅ Demo family setup completed successfully!');
    console.log(`
📊 Created:
- Demo family: ${family.name} (${family.code})
- Demo user: parent@demo.com / password123
- Character: Lady Sarah (HEALER, Level 10)
- Quest templates and rewards

🔐 Demo login credentials:
- Parent: parent@demo.com / password123
`);

  } catch (error) {
    console.error('❌ Failed to create demo family:', error);
    process.exit(1);
  }
}

createDemoFamily();