-- Test User Profile INSERT Policies
-- This migration helps debug the user profile creation issue

-- Create a temporary function to test user profile insertion
-- This will help us debug if RLS policies are blocking user profile creation

CREATE OR REPLACE FUNCTION test_user_profile_insert(
  test_user_id UUID,
  test_email TEXT,
  test_name TEXT,
  test_family_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
  insert_error TEXT;
BEGIN
  -- Try to insert a test user profile
  BEGIN
    INSERT INTO user_profiles (id, email, name, role, family_id)
    VALUES (test_user_id, test_email, test_name, 'GUILD_MASTER', test_family_id);

    result := jsonb_build_object(
      'success', true,
      'message', 'User profile inserted successfully'
    );
  EXCEPTION
    WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS insert_error = MESSAGE_TEXT;
      result := jsonb_build_object(
        'success', false,
        'error', insert_error,
        'sqlstate', SQLSTATE
      );
  END;

  RETURN result;
END;
$$;

-- Create a function to check RLS policies for a user
CREATE OR REPLACE FUNCTION check_user_profile_policies(test_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
  policy_check TEXT;
BEGIN
  -- Check if the user would be allowed to insert their profile
  BEGIN
    -- Test the INSERT policy condition
    IF test_user_id IS NOT NULL THEN
      result := jsonb_build_object(
        'success', true,
        'message', 'User ID is valid for profile creation',
        'user_id', test_user_id
      );
    ELSE
      result := jsonb_build_object(
        'success', false,
        'message', 'User ID is NULL',
        'user_id', test_user_id
      );
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS policy_check = MESSAGE_TEXT;
      result := jsonb_build_object(
        'success', false,
        'error', policy_check,
        'sqlstate', SQLSTATE
      );
  END;

  RETURN result;
END;
$$;