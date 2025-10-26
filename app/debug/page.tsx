'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui';

export default function DebugPage() {
  const [result, setResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const testFamilyCreation = async () => {
    setIsLoading(true);
    setResult('Starting debug test...\n');

    try {
      // Generate test data
      const timestamp = Date.now();
      const testEmail = `debug-${timestamp}@test.com`;
      const testPassword = 'testpass123';
      const familyCode = Math.random().toString(36).substring(2, 8).toUpperCase();

      setResult(prev => prev + `Test email: ${testEmail}\n`);
      setResult(prev => prev + `Family code: ${familyCode}\n`);

      // Step 1: Create auth user
      setResult(prev => prev + 'Creating auth user...\n');
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: testEmail,
        password: testPassword,
      });

      if (authError) {
        setResult(prev => prev + `Auth error: ${authError.message}\n`);
        return;
      }

      setResult(prev => prev + `Auth user created: ${authData.user?.id}\n`);

      // Step 2: Sign in if needed
      if (!authData.session) {
        setResult(prev => prev + 'No session, signing in...\n');
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: testEmail,
          password: testPassword,
        });

        if (signInError) {
          setResult(prev => prev + `Sign in error: ${signInError.message}\n`);
          return;
        }
        setResult(prev => prev + 'Signed in successfully\n');
      }

      // Step 3: Create family
      setResult(prev => prev + 'Creating family...\n');
      const { data: familyData, error: familyError } = await supabase
        .from('families')
        .insert({
          name: `Debug Family ${timestamp}`,
          code: familyCode,
        })
        .select()
        .single();

      if (familyError) {
        setResult(prev => prev + `Family error: ${familyError.message}\n`);
        setResult(prev => prev + `Family error details: ${JSON.stringify(familyError, null, 2)}\n`);
        return;
      }

      setResult(prev => prev + `Family created: ${familyData.id}\n`);

      // Step 4: Create user profile
      setResult(prev => prev + 'Creating user profile...\n');
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          id: authData.user!.id,
          email: testEmail,
          name: `Debug User ${timestamp}`,
          role: 'GUILD_MASTER',
          family_id: familyData.id,
        })
        .select()
        .single();

      if (profileError) {
        setResult(prev => prev + `Profile error: ${profileError.message}\n`);
        setResult(prev => prev + `Profile error details: ${JSON.stringify(profileError, null, 2)}\n`);
        return;
      }

      setResult(prev => prev + `Profile created: ${JSON.stringify(profileData, null, 2)}\n`);

      // Step 5: Verify profile accessibility
      setResult(prev => prev + 'Verifying profile access...\n');
      const { data: verifyData, error: verifyError } = await supabase
        .from('user_profiles')
        .select('id, name, role, family_id')
        .eq('id', authData.user!.id)
        .single();

      if (verifyError) {
        setResult(prev => prev + `Verify error: ${verifyError.message}\n`);
        setResult(prev => prev + `Verify error details: ${JSON.stringify(verifyError, null, 2)}\n`);
        return;
      }

      setResult(prev => prev + `Profile verified: ${JSON.stringify(verifyData, null, 2)}\n`);
      setResult(prev => prev + 'SUCCESS: All steps completed!\n');

    } catch (err) {
      setResult(prev => prev + `Unexpected error: ${err}\n`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Database Debug Page</h1>

        <Button
          onClick={testFamilyCreation}
          isLoading={isLoading}
          className="mb-4"
        >
          {isLoading ? 'Testing...' : 'Test Family Creation Process'}
        </Button>

        <div className="bg-gray-800 p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Debug Output:</h2>
          <pre className="whitespace-pre-wrap text-sm text-green-300 font-mono">
            {result || 'Click the button to run debug test...'}
          </pre>
        </div>
      </div>
    </div>
  );
}
