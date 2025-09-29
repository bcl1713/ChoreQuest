#!/usr/bin/env node

/**
 * Create demo user through Supabase auth
 */

const { createClient } = require('@supabase/supabase-js');

// Use anon key for normal auth operations
const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvY2FsaG9zdCIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzU5MTA2NjMxLCJleHAiOjE3OTA2NDI2MzF9.NkngKkUpeZJRgEwsTAOQFzauIXVPgHsx7M6afIk3iZ8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createDemoUser() {
  try {
    console.log('🌱 Creating demo user...');

    // Check if user already exists
    const { data: existingProfile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('email', 'parent@demo.com')
      .single();

    if (existingProfile) {
      console.log('✅ Demo user already exists');
      return;
    }

    // Get demo family
    const { data: family, error: familyError } = await supabase
      .from('families')
      .select('*')
      .eq('code', 'DEMO123')
      .single();

    if (familyError) {
      throw familyError;
    }

    // Register user through Supabase auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: 'parent@demo.com',
      password: 'password123',
      options: {
        data: {
          name: 'Sarah Smith',
          role: 'GUILD_MASTER',
          family_id: family.id,
        }
      }
    });

    if (authError) {
      throw authError;
    }

    console.log('👤 Created demo user auth:', authData.user.email);

    // Wait a moment for the trigger to create the profile
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Update user profile with proper role and family
    const { error: profileError } = await supabase
      .from('user_profiles')
      .update({
        name: 'Sarah Smith',
        role: 'GUILD_MASTER',
        family_id: family.id,
      })
      .eq('id', authData.user.id);

    if (profileError) {
      console.log('Profile update error (may be normal):', profileError.message);
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
      console.log('Character creation error:', characterError.message);
    } else {
      console.log('🧙‍♀️ Created demo character: Lady Sarah');
    }

    console.log('✅ Demo user setup completed successfully!');
    console.log(`
🔐 Demo login credentials:
- Email: parent@demo.com
- Password: password123
- Family: The Smith Family (DEMO123)
- Character: Lady Sarah (HEALER, Level 10)
`);

  } catch (error) {
    console.error('❌ Failed to create demo user:', error);
    process.exit(1);
  }
}

createDemoUser();