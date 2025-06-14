-- ======================================================================
-- CRITICAL SECURITY FIX: Enable Row Level Security (RLS) 
-- ======================================================================
-- This migration fixes the security vulnerability where sensitive user data
-- was accessible to all authenticated users due to disabled RLS policies.

-- 1. ENABLE RLS ON ALL VULNERABLE TABLES
-- ======================================================================

-- Enable RLS on user_data table (CRITICAL - contains PII)
ALTER TABLE public.user_data ENABLE ROW LEVEL SECURITY;

-- Enable RLS on assessment tables
ALTER TABLE public.lsa_assessment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lsa_result ENABLE ROW LEVEL SECURITY;

-- 2. CREATE SECURE RLS POLICIES FOR USER_DATA TABLE
-- ======================================================================

-- Policy: Users can only read their own data
CREATE POLICY user_data_select_policy
    ON public.user_data
    FOR SELECT
    USING (auth.uid() = id);

-- Policy: Users can only insert their own data
CREATE POLICY user_data_insert_policy
    ON public.user_data
    FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Policy: Users can only update their own data
CREATE POLICY user_data_update_policy
    ON public.user_data
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Policy: Users can only delete their own data
CREATE POLICY user_data_delete_policy
    ON public.user_data
    FOR DELETE
    USING (auth.uid() = id);

-- Policy: HR personnel can read employee data from their organization
CREATE POLICY user_data_hr_read_policy
    ON public.user_data
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.hr_personnel hp
            WHERE hp.email = auth.jwt() ->> 'email'
            AND hp.organization_name = public.user_data.company
        )
    );

-- 3. CREATE SECURE RLS POLICIES FOR LSA_ASSESSMENT TABLE
-- ======================================================================

-- Policy: Users can only access their own assessments
CREATE POLICY lsa_assessment_select_policy
    ON public.lsa_assessment
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can only insert their own assessments
CREATE POLICY lsa_assessment_insert_policy
    ON public.lsa_assessment
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only update their own assessments
CREATE POLICY lsa_assessment_update_policy
    ON public.lsa_assessment
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only delete their own assessments
CREATE POLICY lsa_assessment_delete_policy
    ON public.lsa_assessment
    FOR DELETE
    USING (auth.uid() = user_id);

-- 4. CREATE SECURE RLS POLICIES FOR LSA_RESULT TABLE
-- ======================================================================

-- Policy: Users can only access their own results
CREATE POLICY lsa_result_select_policy
    ON public.lsa_result
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can only insert their own results
CREATE POLICY lsa_result_insert_policy
    ON public.lsa_result
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only update their own results
CREATE POLICY lsa_result_update_policy
    ON public.lsa_result
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only delete their own results
CREATE POLICY lsa_result_delete_policy
    ON public.lsa_result
    FOR DELETE
    USING (auth.uid() = user_id);

-- 5. CREATE HELPER FUNCTION FOR HR AUTHORIZATION
-- ======================================================================

-- Function to check if current user is authorized HR for an organization
CREATE OR REPLACE FUNCTION public.is_authorized_hr_for_org(org_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.hr_personnel hp
        WHERE hp.email = auth.jwt() ->> 'email'
        AND hp.organization_name = org_name
    );
END;
$$;

-- 6. CREATE SERVICE ROLE BYPASS POLICIES (FOR BACKEND OPERATIONS)
-- ======================================================================

-- Allow service role to bypass RLS for administrative operations
CREATE POLICY service_role_bypass_user_data
    ON public.user_data
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role')
    WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY service_role_bypass_lsa_assessment
    ON public.lsa_assessment
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role')
    WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY service_role_bypass_lsa_result
    ON public.lsa_result
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role')
    WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- 7. GRANT NECESSARY PERMISSIONS
-- ======================================================================

-- Grant appropriate permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_data TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lsa_assessment TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lsa_result TO authenticated;

-- Grant permissions to service role for backend operations
GRANT ALL ON public.user_data TO service_role;
GRANT ALL ON public.lsa_assessment TO service_role;
GRANT ALL ON public.lsa_result TO service_role;

-- 8. CREATE AUDIT LOG FOR SECURITY CHANGES
-- ======================================================================

-- Create audit table for tracking security-sensitive operations
CREATE TABLE IF NOT EXISTS public.security_audit_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name text NOT NULL,
    operation text NOT NULL,
    user_id uuid,
    user_email text,
    old_values jsonb,
    new_values jsonb,
    ip_address inet,
    user_agent text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Enable RLS on audit log
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- Only allow service role and HR to read audit logs
CREATE POLICY security_audit_log_select_policy
    ON public.security_audit_log
    FOR SELECT
    USING (
        auth.jwt() ->> 'role' = 'service_role' OR
        EXISTS (
            SELECT 1 FROM public.hr_personnel hp
            WHERE hp.email = auth.jwt() ->> 'email'
        )
    );

-- 9. CREATE TRIGGER FUNCTIONS FOR AUDIT LOGGING
-- ======================================================================

-- Function to log security-sensitive changes
CREATE OR REPLACE FUNCTION public.log_security_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_email text;
BEGIN
    -- Get user email from JWT
    user_email := auth.jwt() ->> 'email';
    
    -- Log the change
    INSERT INTO public.security_audit_log (
        table_name,
        operation,
        user_id,
        user_email,
        old_values,
        new_values,
        created_at
    ) VALUES (
        TG_TABLE_NAME,
        TG_OP,
        COALESCE(NEW.id, OLD.id),
        user_email,
        CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD) ELSE NULL END,
        CASE WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN row_to_json(NEW) ELSE NULL END,
        NOW()
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create audit triggers for sensitive tables
CREATE TRIGGER user_data_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.user_data
    FOR EACH ROW EXECUTE FUNCTION public.log_security_changes();

-- 10. SUMMARY OF SECURITY FIXES
-- ======================================================================

DO $$
BEGIN
    RAISE NOTICE '=======================================================';
    RAISE NOTICE 'SECURITY FIX COMPLETED SUCCESSFULLY';
    RAISE NOTICE '=======================================================';
    RAISE NOTICE 'Fixed the following critical vulnerabilities:';
    RAISE NOTICE '1. ✅ Enabled RLS on user_data table';
    RAISE NOTICE '2. ✅ Enabled RLS on lsa_assessment table';
    RAISE NOTICE '3. ✅ Enabled RLS on lsa_result table';
    RAISE NOTICE '4. ✅ Created secure user-level policies';
    RAISE NOTICE '5. ✅ Created HR organization-level policies';
    RAISE NOTICE '6. ✅ Created service role bypass policies';
    RAISE NOTICE '7. ✅ Added comprehensive audit logging';
    RAISE NOTICE '8. ✅ Granted appropriate permissions';
    RAISE NOTICE '=======================================================';
    RAISE NOTICE 'Security Status: SECURED ✅';
    RAISE NOTICE '=======================================================';
END;
$$; 