import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar, Plus, Edit, Trash2, Search } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// זיהוי לפי סמסטר
function getExamSessionsBySemester(semester: string = ''): string[] {
  if (/קיץ|summer/i.test(semester)) {
    // סמסטר קיץ (רק א, ב)
    return ['מועד א', 'מועד ב'];
  }
  // סמסטר רגיל (א1, א2, ב)
  return ['מועד א1', 'מועד א2', 'מועד ב'];
}

const examFormats = ['פרונטלי', 'מקוון', 'היברידי', 'טייק הום'];

const ExamsManagement = () => {
  const [editingExam, setEditingExam] = useState<any>(null);
  const [filterCourse, setFilterCourse] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [formData, setFormData] = useState({
    exam_type: '',
    exam_session: '',
    exam_date: '',
    exam_time: '09:00',
    location: '',
    format: 'פרונטלי',
    notes: ''
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // שליפת קורסים כולל סמסטר
  const { data: courses = [] } = useQuery({
    queryKey: ['courses-for-exams'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select(`
          id,
          name_he,
          code,
          semester,
          institutions (
            name_he
          )
        `)
        .order('name_he');
      if (error) throw error;
      return data;
    }
  });

  // שליפת מועדים
  const { data: examDates = [] } = useQuery({
    queryKey: ['all-exam-dates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exam_dates')
        .select(`
          *,
          courses (
            name_he,
            code,
            semester,
            institutions (
              name_he
            )
          )
        `)
        .order('exam_date', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  // ניתוח אפשרויות מועדים לפי הקורס שנבחר
  const currentSemester = useMemo(() => {
    if (!selectedCourse) return '';
    const course = courses.find((c: any) => c.id === selectedCourse);
    return course?.semester || '';
  }, [selectedCourse, courses]);

  const examSessions = useMemo(() => getExamSessionsBySemester(currentSemester), [currentSemester]);

  const createExamMutation = useMutation({
    mutationFn: async (examData: any) => {
      const { error } = await supabase.from('exam_dates').insert([examData]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-exam-dates'] });
      setIsDialogOpen(false);
      resetForm();
      toast({ title: "הצלחה", description: "המועד נוצר בהצלחה" });
    }
  });

  const updateExamMutation = useMutation({
    mutationFn: async ({ id, ...examData }: any) => {
      const { error } = await supabase.from('exam_dates').update(examData).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-exam-dates'] });
      setIsDialogOpen(false);
      setEditingExam(null);
      resetForm();
      toast({ title: "הצלחה", description: "המועד עודכן בהצלחה" });
    }
  });

  const deleteExamMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('exam_dates').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-exam-dates'] });
      toast({ title: "הצלחה", description: "המועד נמחק בהצלחה" });
    }
  });

  function resetForm() {
    setFormData({
      exam_type: '',
      exam_session: '', // ייבחר לפי קורס
      exam_date: '',
      exam_time: '09:00',
      location: '',
      format: 'פרונטלי',
      notes: ''
    });
    setSelectedCourse('');
  }

  // מילוי נתוני עריכה
  useEffect(() => {
    if (editingExam) {
      setFormData({
        exam_type: editingExam.exam_type || '',
        exam_session: editingExam.exam_session || '',
        exam_date: editingExam.exam_date || '',
        exam_time: editingExam.exam_time || '09:00',
        location: editingExam.location || '',
        format: editingExam.format || 'פרונטלי',
        notes: editingExam.notes || ''
      });
      setSelectedCourse(editingExam.course_id || '');
    }
  }, [editingExam]);

  const handleEdit = (exam: any) => {
    setEditingExam(exam);
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse) {
      toast({ title: 'שגיאה', description: 'יש לבחור קורס', variant: 'destructive' });
      return;
    }
    if (!formData.exam_session) {
      toast({ title: 'שגיאה', description: 'יש לבחור מועד', variant: 'destructive' });
      return;
    }
    const examData = { course_id: selectedCourse, ...formData };
    if (editingExam) {
      updateExamMutation.mutate({ id: editingExam.id, ...examData });
    } else {
      createExamMutation.mutate(examData);
    }
  };

  const handleDeleteExam = (id: string) => {
    if (confirm('האם אתה בטוח שברצונך למחוק את המועד?')) {
      deleteExamMutation.mutate(id);
    }
  };

  const getFilteredExams = () => {
    return examDates.filter((exam: any) => {
      const matchesCourse = filterCourse === 'all' || exam.course_id === filterCourse;
      const matchesSearch =
        !searchTerm ||
        exam.courses?.name_he?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exam.courses?.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exam.exam_type?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCourse && matchesSearch;
    });
  };

  const getSessionBadgeColor = (session: string) => {
    if (session.startsWith('מועד א')) return 'bg-blue-100 text-blue-800';
    if (session === 'מועד ב') return 'bg-green-100 text-green-800';
    if (session === 'מועד ג') return 'bg-orange-100 text-orange-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              ניהול מועדי בחינות - התאמה אוטומטית לפי סמסטר
            </CardTitle>
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) {
                setEditingExam(null);
                resetForm();
              }
            }}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setEditingExam(null);
                  resetForm();
                  setIsDialogOpen(true);
                }}>
                  <Plus className="w-4 h-4 ml-2" />
                  הוסף מועד בחינה
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {editingExam ? 'עריכת מועד בחינה' : 'הוספת מועד בחינה חדש'}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="course">קורס</Label>
                    <Select value={selectedCourse} onValueChange={setSelectedCourse} required>
                      <SelectTrigger>
                        <SelectValue placeholder="בחר קורס" />
                      </SelectTrigger>
                      <SelectContent>
                        {courses.map((course: any) => (
                          <SelectItem key={course.id} value={course.id}>
                            {course.name_he} ({course.code}) {course.semester ? `- ${course.semester}` : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="exam_type">סוג בחינה</Label>
                      <Input
                        id="exam_type"
                        value={formData.exam_type}
                        onChange={e => setFormData(prev => ({ ...prev, exam_type: e.target.value }))}
                        placeholder="בחינה סופית"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="exam_session">מועד</Label>
                      <Select
                        value={formData.exam_session}
                        onValueChange={value => setFormData(prev => ({ ...prev, exam_session: value }))}
                        disabled={!selectedCourse}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="בחר מועד" />
                        </SelectTrigger>
                        <SelectContent>
                          {examSessions.map((session: string) => (
                            <SelectItem key={session} value={session}>
                              {session}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="exam_date">תאריך</Label>
                      <Input
                        id="exam_date"
                        type="date"
                        value={formData.exam_date}
                        onChange={e => setFormData(prev => ({ ...prev, exam_date: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="exam_time">שעה</Label>
                      <Input
                        id="exam_time"
                        type="time"
                        value={formData.exam_time}
                        onChange={e => setFormData(prev => ({ ...prev, exam_time: e.target.value }))}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="location">מיקום (אופציונלי)</Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={e => setFormData(prev => ({ ...prev, location: e.target.value }))}
                      placeholder="אולם 101, בניין ראשי"
                    />
                  </div>
                  <div>
                    <Label htmlFor="format">פורמט</Label>
                    <Select
                      value={formData.format}
                      onValueChange={value => setFormData(prev => ({ ...prev, format: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {examFormats.map((format: string) => (
                          <SelectItem key={format} value={format}>
                            {format}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="notes">הערות (אופציונלי)</Label>
                    <Input
                      id="notes"
                      value={formData.notes}
                      onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="הערות נוספות על הבחינה"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsDialogOpen(false);
                        setEditingExam(null);
                        resetForm();
                      }}>
                      ביטול
                    </Button>
                    <Button type="submit">
                      {editingExam ? 'עדכן' : 'הוסף'} מועד
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>

        <CardContent>
          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="חיפוש לפי שם קורס, קוד או סוג בחינה..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterCourse} onValueChange={setFilterCourse}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="סנן לפי קורס" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">כל הקורסים</SelectItem>
                {courses.map((course: any) => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.name_he}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Exams Table */}
          <div className="border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>קורס</TableHead>
                  <TableHead>מועד</TableHead>
                  <TableHead>סוג בחינה</TableHead>
                  <TableHead>תאריך</TableHead>
                  <TableHead>שעה</TableHead>
                  <TableHead>מיקום</TableHead>
                  <TableHead>פורמט</TableHead>
                  <TableHead>פעולות</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {getFilteredExams().length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      לא נמצאו מועדי בחינה
                    </TableCell>
                  </TableRow>
                ) : (
                  getFilteredExams().map((exam: any) => (
                    <TableRow key={exam.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{exam.courses?.name_he}</div>
                          <div className="text-sm text-gray-500">{exam.courses?.code}</div>
                          <div className="text-xs text-gray-400">{exam.courses?.institutions?.name_he}</div>
                          <div className="text-xs text-gray-400">{exam.courses?.semester}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getSessionBadgeColor(exam.exam_session)}>
                          {exam.exam_session || 'מועד א'}
                        </Badge>
                      </TableCell>
                      <TableCell>{exam.exam_type}</TableCell>
                      <TableCell>
                        {exam.exam_date ? new Date(exam.exam_date).toLocaleDateString('he-IL') : '-'}
                      </TableCell>
                      <TableCell>{exam.exam_time}</TableCell>
                      <TableCell>{exam.location || 'לא צוין'}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{exam.format}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(exam)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteExam(exam.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExamsManagement;
