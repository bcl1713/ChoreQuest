import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseKey = 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH';
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testFamilyJoining() {
  console.log('🧪 Testing family joining functionality...');

  // Test 1: Check if we can lookup a known family code
  const testFamilyCode = 'A0GX31';
  console.log(`\n1. Testing family lookup for code: ${testFamilyCode}`);

  try {
    const { data: familyData, error: familyError } = await supabase
      .from('families')
      .select('id, name, code')
      .eq('code', testFamilyCode)
      .single();

    console.log('Family lookup result:', { familyData, familyError });

    if (familyError) {
      console.error('❌ Family lookup failed:', familyError.message);
      console.error('Error details:', {
        message: familyError.message,
        details: familyError.details,
        hint: familyError.hint,
        code: familyError.code
      });
      return;
    }

    if (!familyData) {
      console.error('❌ No family found with code:', testFamilyCode);
      return;
    }

    console.log('✅ Family found:', familyData);

    // Test 2: Try to simulate the registration process
    console.log('\n2. Testing user registration with family code...');

    const testUser = {
      email: `test-${Date.now()}@example.com`,
      password: 'testpass123',
      name: 'Test User',
      familyCode: testFamilyCode
    };

    console.log('Test user data:', { ...testUser, password: '[HIDDEN]' });

    // Create auth user
    console.log('Creating auth user...');
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: testUser.email,
      password: testUser.password,
    });

    if (authError) {
      console.error('❌ Auth user creation failed:', authError.message);
      return;
    }

    if (!authData.user) {
      console.error('❌ No user returned from auth signup');
      return;
    }

    console.log('✅ Auth user created:', authData.user.id);

    // Create user profile
    console.log('Creating user profile...');
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        id: authData.user.id,
        email: testUser.email,
        name: testUser.name,
        role: 'YOUNG_HERO',
        family_id: familyData.id,
      })
      .select()
      .single();

    if (profileError) {
      console.error('❌ Profile creation failed:', profileError.message);
      console.error('Profile error details:', {
        message: profileError.message,
        details: profileError.details,
        hint: profileError.hint,
        code: profileError.code
      });
      return;
    }

    console.log('✅ User profile created:', profileData);
    console.log('✅ Family joining test completed successfully!');

  } catch (err) {
    console.error('❌ Unexpected error during family joining test:', err);
  }
}

testFamilyJoining();