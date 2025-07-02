'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { setupDefaultDepartments } from '@/lib/setup-departments';
import { getCurrentUser } from '@/lib/auth';

export function SupabaseTest() {
  const [testResults, setTestResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const runTests = async () => {
    setIsLoading(true);
    const results: any = {
      envVars: {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL,
        key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Present' : 'Missing',
      },
      connection: null,
      departments: null,
      departmentSetup: null,
      auth: null,
    };

    try {
      // Test 1: Check environment variables
      console.log('Testing environment variables...');
      
      // Test 2: Test basic connection
      console.log('Testing Supabase connection...');
      const { data: connectionTest, error: connectionError } = await supabase
        .from('departments')
        .select('count')
        .limit(1);
      
      results.connection = connectionError ? 
        { error: connectionError.message } : 
        { success: true, data: connectionTest };

      // Test 3: Test departments table
      console.log('Testing departments table...');
      const { data: departments, error: deptError } = await supabase
        .from('departments')
        .select('*');
      
      results.departments = deptError ? 
        { error: deptError.message } : 
        { success: true, count: departments?.length || 0, data: departments };

      // Test 4: Setup departments if none exist
      if (!deptError && (!departments || departments.length === 0)) {
        console.log('Setting up default departments...');
        try {
          const setupResult = await setupDefaultDepartments();
          results.departmentSetup = { success: true, data: setupResult };
        } catch (setupError: any) {
          results.departmentSetup = { error: setupError.message };
        }
      }

      // Test 5: Test auth
      console.log('Testing auth...');
      const { data: authData, error: authError } = await supabase.auth.getUser();
      
      results.auth = authError ? 
        { error: authError.message } : 
        { success: true, user: authData.user ? 'Logged in' : 'Not logged in' };

    } catch (error: any) {
      results.error = error.message;
    }

    setTestResults(results);
    setIsLoading(false);
  };

  const setupDepartments = async () => {
    setIsLoading(true);
    try {
      const result = await setupDefaultDepartments();
      setTestResults({
        ...testResults,
        departmentSetup: { success: true, data: result }
      });
    } catch (error: any) {
      setTestResults({
        ...testResults,
        departmentSetup: { error: error.message }
      });
    }
    setIsLoading(false);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Supabase Connection Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex space-x-2">
          <Button onClick={runTests} disabled={isLoading}>
            {isLoading ? 'Running Tests...' : 'Test Supabase Connection'}
          </Button>
          <Button onClick={setupDepartments} disabled={isLoading} variant="outline">
            Setup Departments
          </Button>
        </div>
        
        {testResults && (
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold">Environment Variables:</h3>
              <pre className="bg-gray-100 p-2 rounded text-sm overflow-x-auto">
                {JSON.stringify(testResults.envVars, null, 2)}
              </pre>
            </div>
            
            <div>
              <h3 className="font-semibold">Connection Test:</h3>
              <pre className="bg-gray-100 p-2 rounded text-sm overflow-x-auto">
                {JSON.stringify(testResults.connection, null, 2)}
              </pre>
            </div>
            
            <div>
              <h3 className="font-semibold">Departments Table:</h3>
              <pre className="bg-gray-100 p-2 rounded text-sm overflow-x-auto">
                {JSON.stringify(testResults.departments, null, 2)}
              </pre>
            </div>

            {testResults.departmentSetup && (
              <div>
                <h3 className="font-semibold">Department Setup:</h3>
                <pre className="bg-gray-100 p-2 rounded text-sm overflow-x-auto">
                  {JSON.stringify(testResults.departmentSetup, null, 2)}
                </pre>
              </div>
            )}
            
            <div>
              <h3 className="font-semibold">Auth Test:</h3>
              <pre className="bg-gray-100 p-2 rounded text-sm overflow-x-auto">
                {JSON.stringify(testResults.auth, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}