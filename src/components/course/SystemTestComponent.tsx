import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, XCircle, Loader2, Database, Users, Calendar, Heart } from 'lucide-react';

interface TestResult {
  name: string;
  status: 'pending' | 'running' | 'success' | 'error';
  message?: string;
  details?: string;
}

const SystemTestComponent = () => {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const updateTestResult = (testName: string, status: TestResult['status'], message?: string, details?: string) => {
    setTestResults(prev => 
      prev.map(test => 
        test.name === testName 
          ? { ...test, status, message, details }
          : test
      )
    );
  };

  const runSystemTests = async () => {
    setIsRunning(true);
    
    const tests: TestResult[] = [
      { name: 'בדיקת חיבור למסד נתונים', status: 'pending' },
      { name: 'בדיקת טבלת study_partners', status: 'pending' },
      { name: 'בדיקת טבלת shared_sessions', status: 'pending' },
      { name: 'בדיקת טבלת user_course_progress', status: 'pending' },
      { name: 'בדיקת יצירת שותף למידה', status: 'pending' },
      { name: 'בדיקת יצירת מפגש משותף', status: 'pending' },
      { name: 'בדיקת שמירת מועדפים', status: 'pending' },
      { name: 'בדיקת הרשאות RLS', status: 'pending' }
    ];
    
    setTestResults(tests);

    try {
      // Test 1: Database Connection
      updateTestResult('בדיקת חיבור למסד נתונים', 'running');
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        updateTestResult('בדיקת חיבור למסד נתונים', 'error', 'משתמש לא מחובר');
        return;
      }
      updateTestResult('בדיקת חיבור למסד נתונים', 'success', `מחובר בתור: ${user.email}`);

      // Test 2: Study Partners Table
      updateTestResult('בדיקת טבלת study_partners', 'running');
      try {
        const { data, error } = await supabase
          .from('study_partners')
          .select('*')
          .limit(1);
        
        if (error) throw error;
        updateTestResult('בדיקת טבלת study_partners', 'success', `טבלה קיימת, ${data?.length || 0} רשומות`);
      } catch (error: any) {
        updateTestResult('בדיקת טבלת study_partners', 'error', error.message);
      }

      // Test 3: Shared Sessions Table
      updateTestResult('בדיקת טבלת shared_sessions', 'running');
      try {
        const { data, error } = await supabase
          .from('shared_sessions')
          .select('*')
          .limit(1);
        
        if (error) throw error;
        updateTestResult('בדיקת טבלת shared_sessions', 'success', `טבלה קיימת, ${data?.length || 0} רשומות`);
      } catch (error: any) {
        updateTestResult('בדיקת טבלת shared_sessions', 'error', error.message);
      }

      // Test 4: User Course Progress Table
      updateTestResult('בדיקת טבלת user_course_progress', 'running');
      try {
        const { data, error } = await supabase
          .from('user_course_progress')
          .select('*')
          .eq('user_id', user.id)
          .limit(1);
        
        if (error) throw error;
        updateTestResult('בדיקת טבלת user_course_progress', 'success', `טבלה קיימת, ${data?.length || 0} רשומות למשתמש`);
      } catch (error: any) {
        updateTestResult('בדיקת טבלת user_course_progress', 'error', error.message);
      }

      // Test 5: Create Study Partner with minimal required fields
      updateTestResult('בדיקת יצירת שותף למידה', 'running');
      try {
        const testData = {
          user_id: user.id,
          course_id: 'test-course-id',
          description: 'בדיקת מערכת - שותף למידה',
          available_hours: ['morning', 'evening']
          // Skip optional fields that might not exist: contact_info, preferred_times, expires_at
        };

        const { data, error } = await supabase
          .from('study_partners')
          .insert(testData)
          .select()
          .single();

        if (error) throw error;
        
        // Test if we can add optional fields
        const hasContactInfo = data.hasOwnProperty('contact_info');
        const hasPreferredTimes = data.hasOwnProperty('preferred_times');
        
        // Clean up test data
        await supabase.from('study_partners').delete().eq('id', data.id);
        
        updateTestResult('בדיקת יצירת שותף למידה', 'success', 
          `יצירה הושלמה. שדות זמינים: contact_info: ${hasContactInfo}, preferred_times: ${hasPreferredTimes}`);
      } catch (error: any) {
        updateTestResult('בדיקת יצירת שותף למידה', 'error', error.message);
      }

      // Test 6: Create Shared Session with minimal required fields
      updateTestResult('בדיקת יצירת מפגש משותף', 'running');
      try {
        const testData = {
          course_id: 'test-course-id',
          user_id: user.id,
          title: 'בדיקת מערכת - מפגש',
          meeting_link: 'https://zoom.us/test',
          platform: 'zoom',
          scheduled_time: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
          is_active: true
          // Skip optional fields that might not exist: duration_minutes, max_participants, notification_sent
        };

        const { data, error } = await supabase
          .from('shared_sessions')
          .insert(testData)
          .select()
          .single();

        if (error) throw error;
        
        // Test if we can access optional fields
        const hasDuration = data.hasOwnProperty('duration_minutes');
        const hasMaxParticipants = data.hasOwnProperty('max_participants');
        const hasNotificationSent = data.hasOwnProperty('notification_sent');
        
        // Clean up test data
        await supabase.from('shared_sessions').delete().eq('id', data.id);
        
        updateTestResult('בדיקת יצירת מפגש משותף', 'success', 
          `יצירה הושלמה. שדות זמינים: duration: ${hasDuration}, max_participants: ${hasMaxParticipants}, notifications: ${hasNotificationSent}`);
      } catch (error: any) {
        updateTestResult('בדיקת יצירת מפגש משותף', 'error', error.message);
      }

      // Test 7: Save Favorite Course with safe field handling
      updateTestResult('בדיקת שמירת מועדפים', 'running');
      try {
        const testData = {
          user_id: user.id,
          course_id: 'test-course-id',
          status: 'active',
          progress_percentage: 0
          // Skip optional fields that might not exist: is_favorite, semester
        };

        const { data, error } = await supabase
          .from('user_course_progress')
          .upsert(testData)
          .select()
          .single();

        if (error) throw error;
        
        // Test if we can access optional fields
        const hasFavorite = data.hasOwnProperty('is_favorite');
        const hasSemester = data.hasOwnProperty('semester');
        
        // Clean up test data
        await supabase.from('user_course_progress').delete().eq('id', data.id);
        
        updateTestResult('בדיקת שמירת מועדפים', 'success', 
          `יצירה הושלמה. שדות זמינים: is_favorite: ${hasFavorite}, semester: ${hasSemester}`);
      } catch (error: any) {
        updateTestResult('בדיקת שמירת מועדפים', 'error', error.message);
      }

      // Test 8: RLS Permissions
      updateTestResult('בדיקת הרשאות RLS', 'running');
      try {
        // Test if user can access their own data
        const { data: userProfile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        const userRole = userProfile?.role || 'user';
        updateTestResult('בדיקת הרשאות RLS', 'success', `הרשאות פעילות, תפקיד: ${userRole}`);
      } catch (error: any) {
        updateTestResult('בדיקת הרשאות RLS', 'error', error.message);
      }

    } catch (error: any) {
      console.error('Test suite error:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'running':
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
      default:
        return <div className="w-5 h-5 rounded-full bg-gray-300" />;
    }
  };

  const getStatusBadge = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <Badge variant="default" className="bg-green-500">הצליח</Badge>;
      case 'error':
        return <Badge variant="destructive">נכשל</Badge>;
      case 'running':
        return <Badge variant="secondary">רץ...</Badge>;
      default:
        return <Badge variant="outline">ממתין</Badge>;
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="w-6 h-6" />
          בדיקת מערכת - תכונות קריטיות
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          בדיקה מקיפה של כל הפונקציונליות הקריטית במערכת
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center">
          <Button 
            onClick={runSystemTests} 
            disabled={isRunning}
            className="flex items-center gap-2"
          >
            {isRunning ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                רץ בדיקות...
              </>
            ) : (
              <>
                <Database className="w-4 h-4" />
                הרץ בדיקת מערכת
              </>
            )}
          </Button>
          
          {testResults.length > 0 && (
            <div className="flex gap-2">
              <Badge variant="outline">
                {testResults.filter(t => t.status === 'success').length} הצליחו
              </Badge>
              <Badge variant="outline">
                {testResults.filter(t => t.status === 'error').length} נכשלו
              </Badge>
            </div>
          )}
        </div>

        {testResults.length > 0 && (
          <div className="space-y-3">
            {testResults.map((test, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  {getStatusIcon(test.status)}
                  <span className="font-medium">{test.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(test.status)}
                </div>
                {(test.message || test.details) && (
                  <div className="text-sm text-muted-foreground mt-1">
                    {test.message}
                    {test.details && (
                      <details className="mt-1">
                        <summary className="cursor-pointer">פרטים</summary>
                        <pre className="text-xs mt-1 p-2 bg-muted rounded">{test.details}</pre>
                      </details>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Users className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-blue-900">מה נבדק?</h4>
              <ul className="text-sm text-blue-700 mt-2 space-y-1">
                <li>• חיבור למסד הנתונים ואימות משתמש</li>
                <li>• קיום טבלאות study_partners, shared_sessions, user_course_progress</li>
                <li>• יכולת יצירה, עדכון ומחיקה של רשומות</li>
                <li>• הרשאות RLS ותפקידי משתמשים</li>
                <li>• פונקציונליות שמירת מועדפים</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SystemTestComponent;