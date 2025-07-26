import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
    await Promise.all([
      fetchTutors(),
      fetchRequests()
    ]);
  };

  const fetchTutors = async () => {
    const { data } = await supabase.from('tutors').select('*');
    setTutors(data || []);
  };

  const fetchRequests = async () => {
    const { data } = await supabase
      .from('tutor_applications')
      .select('*')
      .eq('status', 'pending');
    setRequests(data || []);
  };

  const handleApproveRequest = async (id) => {
    setErrorMsg('');
    const request = requests.find(r => r.id === id);
    if (!request) return;
    
    try {
      // Create new tutor with only required fields that exist in current schema
      const { data: tutorInsert, error: tutorError } = await supabase
        .from('tutors')
        .insert({
          name: request.name || 'מורה חדש',
          subjects: request.subjects || [],
          hourly_rate: request.hourly_rate || 100,
          location: request.location || '',
          rating: 0,
          reviews_count: 0,
          is_online: false,
          is_verified: true
        })
        .select()
        .single();
      
      if (tutorError || !tutorInsert) throw tutorError || new Error('בעיה ביצירת מורה');

      // Update application status
      await supabase
        .from('tutor_applications')
        .update({ status: 'approved' })
        .eq('id', id);

      fetchAll();
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>אימייל</TableHead>
                  <TableHead>מיקום</TableHead>
                  <TableHead>מחיר</TableHead>
                  <TableHead>טלפון</TableHead>
                  <TableHead>פעולות</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tutors.map((tutor) => (
                  <TableRow key={tutor.id}>
                    <TableCell className="font-medium">{tutor.email}</TableCell>
                    <TableCell>{tutor.location}</TableCell>
                    <TableCell>{tutor.hourly_rate} ₪/שעה</TableCell>
                    <TableCell>{tutor.phone}</TableCell>
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
          </CardContent>
        </Card>
      )}

      {activeTab === 'requests' && (
        <Card>
          <CardHeader>
            <CardTitle>בקשות הצטרפות חדשות</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>שם</TableHead>
                  <TableHead>אימייל</TableHead>
                  <TableHead>טלפון</TableHead>
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
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TutorsManagement;