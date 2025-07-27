import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { GraduationCap, CheckCircle, XCircle } from 'lucide-react';

const TutorsManagement = () => {
  const [activeTab, setActiveTab] = useState('approved');
  const [tutors, setTutors] = useState([]);
  const [requests, setRequests] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setErrorMsg('');
    await Promise.all([
      fetchTutors(),
      fetchRequests()
    ]);
  };

  // שליפת מורים כולל JOIN לקורסים דרך tutor_courses
  const fetchTutors = async () => {
    const { data, error } = await supabase
      .from('tutors')
      .select(`
        *,
        tutor_courses (
          id,
          course_id,
          course: courses (
            id,
            name_he,
            category
          )
        )
      `)
      .order('created_at', { ascending: false });
    if (error) setErrorMsg(error.message);
    setTutors(data || []);
  };

  // שליפת בקשות הצטרפות
  const fetchRequests = async () => {
    const { data, error } = await supabase
      .from('tutor_applications')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    if (error) setErrorMsg(error.message);
    setRequests(data || []);
  };

  // אישור בקשה - כולל קישור לכל קורס אמיתי במערכת
  const handleApproveRequest = async (id) => {
    setErrorMsg('');
    const request = requests.find(r => r.id === id);
    if (!request) {
      setErrorMsg('לא נמצאה בקשה');
      return;
    }
    try {
      // יצירת מורה בטבלת tutors
      const { data: tutorInsert, error: tutorError } = await supabase
        .from('tutors')
        .insert({
          name: request.name || 'מורה חדש',
          hourly_rate: request.hourly_rate || 100,
          location: request.location || '',
          rating: 0,
          reviews_count: 0,
          is_online: false,
          is_verified: true,
          email: request.email || null,
          phone: request.phone || null,
          avatar_url: request.avatar_url || null,
          experience: request.experience || null,
          description: request.description || null,
          availability: request.availability || null,
        })
        .select()
        .single();

      if (tutorError || !tutorInsert) throw tutorError || new Error('בעיה ביצירת מורה');

      // --- קישור קורסים אמיתי ---
      let courseIds = [];
      // כל הקורסים האפשריים מהמערכת
      const { data: allCourses, error: coursesError } = await supabase
        .from('courses')
        .select('id, name_he, code');
      if (coursesError) throw coursesError;

      if (Array.isArray(request.subjects)) {
        for (const subj of request.subjects) {
          // חפש קוד קורס בסוגריים או חפש לפי שם
          const codeMatch = subj.match(/\(([^)]+)\)/);
          const code = codeMatch ? codeMatch[1].trim() : '';
          const name = subj.replace(/ \([^)]+\)/, '').replace(/ - ציון: \d+/, '').trim();

          // קישור לפי code או name
          const courseObj = allCourses.find(
            c => (code && c.code === code) || c.name_he === name
          );
          if (courseObj) {
            courseIds.push(courseObj.id);
          }
        }
      }

      // שמירת קישורים בטבלת tutor_courses
      if (courseIds.length > 0) {
        const tutorCourses = courseIds.map((courseId) => ({
          tutor_id: tutorInsert.id,
          course_id: courseId,
        }));
        const { error: courseError } = await supabase.from('tutor_courses').insert(tutorCourses);
        if (courseError) setErrorMsg("המורה אושר, אך לא נשמרו כל הקורסים: " + courseError.message);
      }

      // עדכון סטטוס הבקשה ל־approved
      await supabase
        .from('tutor_applications')
        .update({ status: 'approved' })
        .eq('id', id);

      await fetchAll();
    } catch (e) {
      setErrorMsg('שגיאה: ' + (e.message || e));
    }
  };

  const handleRejectRequest = async (id) => {
    await supabase.from('tutor_applications').update({ status: 'rejected' }).eq('id', id);
    fetchRequests();
  };

  const handleDeleteTutor = async (id) => {
    await supabase.from('tutors').delete().eq('id', id);
    await supabase.from('tutor_courses').delete().eq('tutor_id', id);
    fetchTutors();
  };

  return (
    <div className="space-y-6 p-4">
      <div className="flex gap-4">
        <Button
          variant={activeTab === 'approved' ? 'default' : 'outline'}
          onClick={() => setActiveTab('approved')}
        >
          מורים מאושרים
        </Button>
        <Button
          variant={activeTab === 'requests' ? 'default' : 'outline'}
          onClick={() => setActiveTab('requests')}
        >
          בקשות חדשות ({requests.length})
        </Button>
      </div>
      {errorMsg && (
        <div className="bg-red-100 text-red-800 px-4 py-3 rounded-lg border border-red-300 text-center font-bold">
          {errorMsg}
        </div>
      )}

      {activeTab === 'approved' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5" />
              מורים פרטיים מאושרים
            </CardTitle>
          </CardHeader>
          <CardContent>
            {tutors.length === 0 ? (
              <div className="py-6 text-center text-gray-400">אין מורים מאושרים כרגע.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>אווטאר</TableHead>
                    <TableHead>שם</TableHead>
                    <TableHead>אימייל</TableHead>
                    <TableHead>מיקום</TableHead>
                    <TableHead>מחיר</TableHead>
                    <TableHead>טלפון</TableHead>
                    <TableHead>קורסים</TableHead>
                    <TableHead>פעולות</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tutors.map((tutor) => (
                    <TableRow key={tutor.id}>
                      <TableCell>
                        {tutor.avatar_url && (
                          <img src={tutor.avatar_url} alt={tutor.name} className="w-10 h-10 rounded-full border" />
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{tutor.name}</TableCell>
                      <TableCell>{tutor.email}</TableCell>
                      <TableCell>{tutor.location}</TableCell>
                      <TableCell>{tutor.hourly_rate} ₪/שעה</TableCell>
                      <TableCell>{tutor.phone}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {(tutor.tutor_courses || []).map((tc) =>
                            tc.course?.name_he ? (
                              <span key={tc.course.id} className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">
                                {tc.course.name_he}
                              </span>
                            ) : null
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteTutor(tutor.id)}
                        >
                          מחק
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'requests' && (
        <Card>
          <CardHeader>
            <CardTitle>בקשות הצטרפות חדשות</CardTitle>
          </CardHeader>
          <CardContent>
            {requests.length === 0 ? (
              <div className="py-6 text-center text-gray-400">אין בקשות חדשות.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>שם</TableHead>
                    <TableHead>אימייל</TableHead>
                    <TableHead>טלפון</TableHead>
                    <TableHead>אווטאר</TableHead>
                    <TableHead>פעולות</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className="font-medium">{request.name}</TableCell>
                      <TableCell>{request.email}</TableCell>
                      <TableCell>{request.phone}</TableCell>
                      <TableCell>
                        {request.avatar_url && (
                          <img src={request.avatar_url} alt={request.name} className="w-10 h-10 rounded-full border" />
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleApproveRequest(request.id)}
                          >
                            <CheckCircle className="w-4 h-4 ml-1" />
                            אשר
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleRejectRequest(request.id)}
                          >
                            <XCircle className="w-4 h-4 ml-1" />
                            דחה
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TutorsManagement;
