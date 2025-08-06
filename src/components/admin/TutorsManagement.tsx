import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { GraduationCap, CheckCircle, XCircle, Pencil, Trash2, PlusCircle, RefreshCw } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';

interface Course {
  id: string;
  name_he: string;
  code?: string;
}
interface TutorCourse {
  id: string;
  course_id: string;
  course?: Course;
}
interface Tutor {
  id: string;
  name: string;
  hourly_rate?: number;
  location?: string;
  rating?: number;
  reviews_count?: number;
  is_online?: boolean;
  is_verified?: boolean;
  email?: string;
  phone?: string;
  avatar_url?: string;
  experience?: string;
  description?: string;
  availability?: string;
  tutor_courses?: TutorCourse[];
}
interface TutorRequest {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  avatar_url?: string;
  hourly_rate?: number;
  location?: string;
  experience?: string;
  description?: string;
  availability?: string;
  subjects?: string[];
  status?: string;
}

const TutorsManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'approved' | 'requests'>('approved');
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [requests, setRequests] = useState<TutorRequest[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [editDialog, setEditDialog] = useState<{ open: boolean; tutor?: Tutor }>({ open: false });

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setErrorMsg('');
    await Promise.all([fetchTutors(), fetchRequests(), fetchCourses()]);
  };

  const fetchTutors = async () => {
    const { data, error } = await supabase
      .from('tutors')
      .select(`
        *,
        tutor_courses (
          id,
          course_id,
          course:courses (
            id,
            name_he,
            code
          )
        )
      `)
      .order('created_at', { ascending: false });
    if (error) setErrorMsg(error.message);
    setTutors((data as Tutor[]) || []);
  };

  const fetchRequests = async () => {
    const { data, error } = await supabase
      .from('tutor_applications')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    if (error) setErrorMsg(error.message);
    setRequests((data as TutorRequest[]) || []);
  };

  const fetchCourses = async () => {
    const { data, error } = await supabase.from('courses').select('id, name_he, code');
    if (error) setErrorMsg(error.message);
    setCourses((data as Course[]) || []);
  };

  const handleApproveRequest = async (id: string) => {
    setErrorMsg('');
    const request = requests.find(r => r.id === id);
    if (!request) {
      setErrorMsg('לא נמצאה בקשה');
      return;
    }
    try {
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

      // קישור קורסים אוטומטית אם יש נושאים
      let courseIds: string[] = [];
      if (Array.isArray(request.subjects)) {
        for (const subj of request.subjects) {
          const name = subj.replace(/ \([^)]+\)/, '').replace(/ - ציון: \d+/, '').trim();
          const codeMatch = subj.match(/\(([^)]+)\)/);
          const code = codeMatch ? codeMatch[1].trim() : '';
          const courseObj = courses.find(c => (code && c.code === code) || c.name_he === name);
          if (courseObj) courseIds.push(courseObj.id);
        }
      }

      if (courseIds.length > 0) {
        const tutorCourses = courseIds.map(course_id => ({ tutor_id: tutorInsert.id, course_id }));
        const { error: courseError } = await supabase.from('tutor_courses').insert(tutorCourses);
        if (courseError) setErrorMsg("המורה אושר, אך לא נשמרו כל הקורסים: " + courseError.message);
      }

      await supabase.from('tutor_applications').update({ status: 'approved' }).eq('id', id);
      await fetchAll();
    } catch (e: any) {
      setErrorMsg('שגיאה: ' + (e.message || e));
    }
  };

  const handleRejectRequest = async (id: string) => {
    await supabase.from('tutor_applications').update({ status: 'rejected' }).eq('id', id);
    fetchRequests();
  };

  const handleDeleteTutor = async (id: string) => {
    await supabase.from('tutors').delete().eq('id', id);
    await supabase.from('tutor_courses').delete().eq('tutor_id', id);
    fetchTutors();
  };

  // פתיחת דיאלוג עריכה
  const openEditDialog = (tutor: Tutor) => setEditDialog({ open: true, tutor });
  const closeEditDialog = () => setEditDialog({ open: false, tutor: undefined });

  // שמירת עריכה
  const handleSaveEdit = async (updated: Tutor, selectedCourses: string[]) => {
    // עדכון מורה
    const { error } = await supabase.from('tutors').update({
      name: updated.name,
      hourly_rate: updated.hourly_rate,
      location: updated.location,
      email: updated.email,
      phone: updated.phone,
      avatar_url: updated.avatar_url,
      experience: updated.experience,
      description: updated.description,
      availability: updated.availability,
      is_online: updated.is_online,
      is_verified: updated.is_verified,
    }).eq('id', updated.id);
    if (error) {
      toast.error('שגיאה בעדכון: ' + error.message);
      return;
    }

    // עדכון קורסים למורה
    // מוחק את הישנים ומכניס את החדשים (אפשר לשפר ל-diff בהמשך)
    await supabase.from('tutor_courses').delete().eq('tutor_id', updated.id);
    if (selectedCourses.length > 0) {
      await supabase.from('tutor_courses').insert(
        selectedCourses.map(course_id => ({ tutor_id: updated.id, course_id }))
      );
    }

    toast.success('עודכן בהצלחה!');
    closeEditDialog();
    fetchTutors();
  };

  return (
    <div className="space-y-6 p-4">
      <div className="flex gap-4">
        <Button variant={activeTab === 'approved' ? 'default' : 'outline'} onClick={() => setActiveTab('approved')}>מורים מאושרים</Button>
        <Button variant={activeTab === 'requests' ? 'default' : 'outline'} onClick={() => setActiveTab('requests')}>בקשות חדשות ({requests.length})</Button>
        <Button variant="ghost" onClick={fetchAll} title="רענן"><RefreshCw className="w-5 h-5" /></Button>
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
                    <TableHead>סטטוס</TableHead>
                    <TableHead>פעולות</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tutors.map((tutor) => (
                    <TableRow key={tutor.id}>
                      <TableCell>
                        {tutor.avatar_url ? (
                          <img src={tutor.avatar_url} alt={tutor.name} className="w-10 h-10 rounded-full border" />
                        ) : <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center font-bold text-xl text-gray-500">?</div>}
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
                        <span className={`px-2 py-1 rounded text-xs font-bold ${tutor.is_verified ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {tutor.is_verified ? 'מאושר' : 'ממתין'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm"><Pencil className="w-4 h-4" /> ערוך</Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-lg">
                              <DialogHeader>
                                <DialogTitle>עריכת מורה</DialogTitle>
                              </DialogHeader>
                              <EditTutorForm
                                tutor={tutor}
                                courses={courses}
                                onSave={handleSaveEdit}
                                onCancel={closeEditDialog}
                              />
                            </DialogContent>
                          </Dialog>
                          <Button variant="destructive" size="sm" onClick={() => handleDeleteTutor(tutor.id)}>
                            <Trash2 className="w-4 h-4" /> מחק
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
                          <Button variant="default" size="sm" onClick={() => handleApproveRequest(request.id)}>
                            <CheckCircle className="w-4 h-4 ml-1" /> אשר
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => handleRejectRequest(request.id)}>
                            <XCircle className="w-4 h-4 ml-1" /> דחה
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

// קומפוננטת טופס עריכת מורה
const EditTutorForm: React.FC<{
  tutor: Tutor;
  courses: Course[];
  onSave: (tutor: Tutor, selectedCourses: string[]) => void;
  onCancel: () => void;
}> = ({ tutor, courses, onSave, onCancel }) => {
  const [form, setForm] = useState<Tutor>({ ...tutor });
  const [selectedCourses, setSelectedCourses] = useState<string[]>(
    (tutor.tutor_courses || []).map(tc => tc.course_id)
  );
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleCheckbox = (courseId: string) => {
    setSelectedCourses((prev) =>
      prev.includes(courseId)
        ? prev.filter(id => id !== courseId)
        : [...prev, courseId]
    );
  };

  return (
    <form
      className="space-y-4 max-w-xl"
      onSubmit={e => {
        e.preventDefault();
        onSave({ ...form, id: tutor.id }, selectedCourses);
      }}
    >
      <div className="flex gap-2">
        <img src={form.avatar_url || ''} alt={form.name} className="w-16 h-16 rounded-full border" />
        <div className="flex flex-col gap-1 flex-1">
          <Input name="name" value={form.name} onChange={handleChange} required placeholder="שם מלא" />
          <Input name="email" value={form.email || ''} onChange={handleChange} placeholder="אימייל" />
          <Input name="phone" value={form.phone || ''} onChange={handleChange} placeholder="טלפון" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Input name="hourly_rate" value={form.hourly_rate || ''} onChange={handleChange} type="number" placeholder="מחיר לשעה" />
        <Input name="location" value={form.location || ''} onChange={handleChange} placeholder="מיקום" />
      </div>
      <div>
        <textarea
          name="description"
          className="w-full p-2 rounded border"
          value={form.description || ''}
          onChange={handleChange}
          placeholder="תיאור קצר/ניסיון"
        />
      </div>
      <div>
        <label className="font-semibold mb-1 block">קורסים שמורים מלמד</label>
        <div className="flex flex-wrap gap-2">
          {courses.map((course) => (
            <label key={course.id} className="flex items-center gap-2 bg-blue-50 rounded p-1 px-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedCourses.includes(course.id)}
                onChange={() => handleCheckbox(course.id)}
              />
              <span className="text-xs">{course.name_he}</span>
            </label>
          ))}
        </div>
      </div>
      <div className="flex gap-2 justify-end pt-2">
        <Button type="submit" variant="default">שמור שינויים</Button>
        <Button type="button" variant="outline" onClick={onCancel}>ביטול</Button>
      </div>
    </form>
  );
};

export default TutorsManagement;
