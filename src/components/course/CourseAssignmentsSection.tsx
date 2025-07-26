import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { BookOpen, Calendar as CalendarIcon, Edit, Trash2, Plus, MoreVertical } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/App';
import { format } from 'date-fns';

const mamanNumbers = ['11', '12', '13', '14', '15', '16', '17', '18'];
const mamachNumbers = ['01', '02', '03', '04', '05', '06', '07'];

const assignmentTypes = [
  { value: 'maman', label: 'ממ"ן', icon: '📋', color: '#f97316' },
  { value: 'mamach', label: 'ממ"ח', icon: '💻', color: '#8b5cf6' },
  { value: 'homework', label: 'עבודת בית', icon: '📝', color: '#3b82f6' },
  { value: 'project', label: 'פרויקט', icon: '💼', color: '#10b981' },
  { value: 'essay', label: 'חיבור', icon: '📄', color: '#ec4899' }
];

interface Assignment {
  id: string;
  course_id: string;
  title: string;
  assignment_type: string;
  due_date: string;
  due_time?: string;
  description?: string;
  created_by: string;
  verified: boolean;
  created_at: string;
  updated_at: string;
  assignment_number?: string | null;
  creator_profile?: {
    id: string;
    name: string;
    avatar_url?: string;
  };
}

interface AssignmentFormData {
  assignment_type: string;
  assignment_number?: string;
  title: string;
  description: string;
  due_date: Date;
  due_time: string;
}

interface CourseAssignmentsSectionProps {
  courseId: string;
  courseName: string;
}

// קריאה עם JOIN ל-profiles
const useCourseAssignments = (courseId: string) => {
  return useQuery({
    queryKey: ['course-assignments', courseId],
    queryFn: async () => {
      if (!courseId) return [];
      const { data, error } = await supabase
        .from('course_assignments')
        .select(`
          *,
          creator_profile:created_by (
            id, name, avatar_url
          )
        `)
        .eq('course_id', courseId)
        .order('due_date', { ascending: true });
      if (error) throw error;
      return data as Assignment[];
    },
    enabled: !!courseId,
  });
};

const useCreateAssignment = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (assignmentData: Omit<Assignment, 'id' | 'created_at' | 'updated_at' | 'creator_profile'>) => {
      // השג את המשתמש
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('יש להתחבר');
      const { data, error } = await supabase
        .from('course_assignments')
        .insert({
          ...assignmentData,
          created_by: user.id,
          verified: false,
        })
        .select(`
          *, creator_profile:created_by (id, name, avatar_url)
        `)
        .single();
      if (error) throw error;
      return data as Assignment;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['course-assignments', data.course_id] });
      toast({ title: "עבודה נוספה", description: "העבודה נוספה בהצלחה" });
    },
    onError: (err: any) => {
      toast({ title: "שגיאה", description: err?.message || "שגיאה", variant: "destructive" });
    }
  });
};

const useUpdateAssignment = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updateData }: Partial<Assignment> & { id: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('יש להתחבר');
      const { data, error } = await supabase
        .from('course_assignments')
        .update({
          ...updateData,
          updated_at: new Date().toISOString(),
          updated_by: user.id,
        })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Assignment;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['course-assignments', data.course_id] });
      toast({ title: "עבודה עודכנה", description: "העבודה עודכנה בהצלחה" });
    },
    onError: (err: any) => {
      toast({ title: "שגיאה", description: err?.message || "שגיאה", variant: "destructive" });
    }
  });
};

const useDeleteAssignment = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const { error } = await supabase
        .from('course_assignments')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-assignments'] });
      toast({ title: "עבודה נמחקה", description: "העבודה נמחקה בהצלחה" });
    },
    onError: (err: any) => {
      toast({ title: "שגיאה", description: err?.message || "שגיאה", variant: "destructive" });
    }
  });
};

const CourseAssignmentsSection: React.FC<CourseAssignmentsSectionProps> = ({ courseId, courseName }) => {
  const { user, isAdmin } = useAuth() as { user: any; isAdmin: boolean };
  const currentUserId = user?.id || '';

  const { data: assignments = [], isLoading } = useCourseAssignments(courseId);
  const createAssignmentMutation = useCreateAssignment();
  const updateAssignmentMutation = useUpdateAssignment();
  const deleteAssignmentMutation = useDeleteAssignment();
  const { toast } = useToast();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [showActions, setShowActions] = useState<string | null>(null);

  const [formData, setFormData] = useState<AssignmentFormData>({
    assignment_type: 'maman',
    assignment_number: '',
    title: '',
    description: '',
    due_date: new Date(),
    due_time: '23:59',
  });

  const resetForm = () => setFormData({
    assignment_type: 'maman',
    assignment_number: '',
    title: '',
    description: '',
    due_date: new Date(),
    due_time: '23:59',
  });

  const handleSubmit = async () => {
    let title = formData.title.trim();
    let assignment_number = formData.assignment_number;
    // עיצוב כותרת חכם לממן וממח
    if (formData.assignment_type === 'maman' && assignment_number) title = `ממ״ן ${assignment_number}`;
    if (formData.assignment_type === 'mamach' && assignment_number) title = `ממ״ח ${assignment_number}`;
    if (!title || (['maman', 'mamach'].includes(formData.assignment_type) && !assignment_number)) {
      toast({ title: "שגיאה", description: "יש למלא את כל השדות הנדרשים", variant: "destructive" });
      return;
    }
    const assignmentData: Omit<Assignment, 'id' | 'created_at' | 'updated_at' | 'creator_profile'> = {
      course_id: courseId,
      title,
      assignment_type: formData.assignment_type,
      assignment_number: assignment_number || null,
      description: formData.description,
      due_date: format(formData.due_date, 'yyyy-MM-dd'),
      due_time: formData.due_time,
      created_by: currentUserId,
      verified: false,
    };
    try {
      if (editingAssignment) {
        await updateAssignmentMutation.mutateAsync({ id: editingAssignment.id, ...assignmentData });
        toast({ title: "עבודה עודכנה", description: "העבודה עודכנה בהצלחה" });
      } else {
        await createAssignmentMutation.mutateAsync(assignmentData);
        toast({ title: "עבודה נוספה", description: "העבודה נוספה בהצלחה" });
      }
      setIsAddDialogOpen(false);
      setEditingAssignment(null);
      resetForm();
    } catch (err: any) {
      toast({ title: "שגיאה", description: err?.message || "שגיאה בשמירה", variant: "destructive" });
    }
  };

  const handleEdit = (assignment: Assignment) => {
    let assignment_number: string = assignment.assignment_number || '';
    if (!assignment_number && assignment.assignment_type === 'maman' && assignment.title.match(/(\d{2})$/))
      assignment_number = assignment.title.match(/(\d{2})$/)?.[1] || '';
    if (!assignment_number && assignment.assignment_type === 'mamach' && assignment.title.match(/(\d{2})$/))
      assignment_number = assignment.title.match(/(\d{2})$/)?.[1] || '';
    setEditingAssignment(assignment);
    setFormData({
      assignment_type: assignment.assignment_type,
      assignment_number,
      title: (assignment.assignment_type === 'maman' || assignment.assignment_type === 'mamach') ? '' : assignment.title,
      description: assignment.description || '',
      due_date: new Date(assignment.due_date),
      due_time: assignment.due_time || '23:59',
    });
    setIsAddDialogOpen(true);
  };

  const handleDelete = async (assignment: Assignment) => {
    const isOwner = assignment.creator_profile?.id === currentUserId;
    if (!(isAdmin || isOwner)) {
      toast({ title: 'שגיאה', description: 'רק יוצר המטלה או מנהל יכול למחוק מטלה זו.', variant: 'destructive' });
      return;
    }
    if (!window.confirm('האם למחוק את העבודה?')) return;
    await deleteAssignmentMutation.mutateAsync({ id: assignment.id });
  };

  // עיצוב קומפקטי וצבעוני
  const getTypeMeta = (type: string) =>
    assignmentTypes.find(t => t.value === type) || assignmentTypes[0];

  return (
    <div className="w-full" dir="rtl">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center font-bold text-lg gap-2">
          <BookOpen className="w-5 h-5 text-indigo-600" />
          <span>עבודות וממ"נים</span>
        </div>
        {user && (
          <button
            className="rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:to-blue-800 w-9 h-9 flex items-center justify-center text-white shadow transition"
            title="הוסף מטלה"
            onClick={() => { resetForm(); setEditingAssignment(null); setIsAddDialogOpen(true); }}
          >
            <Plus className="w-5 h-5" />
          </button>
        )}
      </div>
      {!user && (
        <div className="flex items-center gap-3 p-3 bg-orange-50 border border-orange-200 rounded-lg mb-3 text-orange-700 font-bold justify-center">
          נא להתחבר כדי להוסיף או לערוך מטלות.
        </div>
      )}
      {/* קומפקטי, צבעוני, RTL */}
      <div className="w-full" dir="rtl">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-blue-400" />
          </div>
        ) : assignments.length === 0 ? (
          // תצוגה מיוחדת כשאין עבודות או ממ"נים
          <div className="flex flex-col items-center justify-center p-7 rounded-2xl border shadow bg-gradient-to-br from-blue-50 to-white text-center mx-auto mt-4 max-w-lg">
            <BookOpen className="w-12 h-12 text-blue-300 mb-3" />
            <div className="font-bold text-xl text-gray-700 mb-1">אין מטלות או ממ"נים</div>
            <div className="text-sm text-gray-400">הוסף ממ"ן או עבודה חדשה עכשיו</div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3" dir="rtl">
            {assignments
              .slice()
              .sort((a, b) =>
                new Date(`${a.due_date}T${a.due_time || '23:59'}`).getTime() -
                new Date(`${b.due_date}T${b.due_time || '23:59'}`).getTime()
              )
              .map((assignment) => {
                const typeMeta = getTypeMeta(assignment.assignment_type);
                const isOwner = assignment.creator_profile?.id === currentUserId;
                const canDelete = isAdmin || isOwner;

                return (
                  <div
                    key={assignment.id}
                    className="relative rounded-2xl p-3 shadow-md hover:shadow-xl transition-all border border-gray-200 bg-white overflow-hidden group"
                    style={{
                      background: `linear-gradient(135deg, ${typeMeta.color}11 0%, white 70%)`,
                      borderInlineStart: `4px solid ${typeMeta.color}`,
                    }}
                  >
                    {/* רקע אייקון ענק חצי שקוף */}
                    <div className="absolute top-2 left-3 text-6xl opacity-10 pointer-events-none select-none" style={{ color: typeMeta.color }}>
                      {typeMeta.icon}
                    </div>
                    <div className="flex items-center gap-2 mb-2 z-10">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-lg shadow"
                        style={{ backgroundColor: typeMeta.color }}
                      >
                        {typeMeta.icon}
                      </div>
                      <div className="text-base font-semibold text-gray-900 truncate max-w-[110px]" title={assignment.title}>
                        {assignment.title}
                      </div>
                      <Popover>
                        <PopoverTrigger asChild>
                          <button
                            className="ml-auto text-gray-400 hover:text-indigo-600 p-1 transition"
                            onClick={() => setShowActions(assignment.id === showActions ? null : assignment.id)}
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent side="left" align="end" className="bg-white rounded-xl shadow-lg p-2 w-24 z-40 animate-fade-in-up" dir="rtl">
                          <button
                            className="flex w-full items-center gap-1 text-indigo-500 hover:text-indigo-700 px-2 py-1"
                            onClick={() => { setShowActions(null); handleEdit(assignment); }}>
                            <Edit className="w-4 h-4" /> עריכה
                          </button>
                          {canDelete && (
                            <button
                              className="flex w-full items-center gap-1 text-red-500 hover:text-red-700 px-2 py-1"
                              onClick={() => { setShowActions(null); handleDelete(assignment); }}>
                              <Trash2 className="w-4 h-4" /> מחיקה
                            </button>
                          )}
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-medium text-gray-600 z-10">
                      <CalendarIcon className="w-4 h-4" />
                      <span>{format(new Date(assignment.due_date), 'dd/MM')}</span>
                      <span className="text-gray-400">|</span>
                      <span>{assignment.due_time?.slice(0, 5)}</span>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {/* Dialog Add/Edit */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-md p-6 rounded-2xl shadow-2xl bg-gradient-to-br from-blue-50 to-white" dir="rtl" style={{ width: 440 }}>
          <DialogHeader>
            <DialogTitle className="text-xl font-bold mb-2">
              {editingAssignment ? 'עריכת מטלה' : 'הוספת מטלה חדשה'}
            </DialogTitle>
          </DialogHeader>
          <form className="flex flex-col gap-3" onSubmit={e => { e.preventDefault(); handleSubmit(); }} dir="rtl">
            <div className="flex flex-col md:flex-row gap-2 mb-2">
              <Select
                value={formData.assignment_type}
                onValueChange={value => setFormData(f => ({
                  ...f,
                  assignment_type: value,
                  assignment_number: '',
                  title: ''
                }))}
              >
                <SelectTrigger className="w-44 h-11 text-lg px-2">
                  <SelectValue placeholder="סוג מטלה" />
                </SelectTrigger>
                <SelectContent>
                  {assignmentTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      <span className="flex items-center gap-2 text-lg">{type.icon} {type.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formData.assignment_type === 'maman' && (
                <Select
                  value={formData.assignment_number || ''}
                  onValueChange={value => setFormData(f => ({ ...f, assignment_number: value }))}
                  required
                >
                  <SelectTrigger className="w-44 h-11 text-lg px-2">
                    <SelectValue placeholder="בחר מספר ממ״ן" />
                  </SelectTrigger>
                  <SelectContent>
                    {mamanNumbers.map(num => (
                      <SelectItem key={num} value={num}>ממ״ן {num}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {formData.assignment_type === 'mamach' && (
                <Select
                  value={formData.assignment_number || ''}
                  onValueChange={value => setFormData(f => ({ ...f, assignment_number: value }))}
                  required
                >
                  <SelectTrigger className="w-44 h-11 text-lg px-2">
                    <SelectValue placeholder="בחר מספר ממ״ח" />
                  </SelectTrigger>
                  <SelectContent>
                    {mamachNumbers.map(num => (
                      <SelectItem key={num} value={num}>ממ״ח {num}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {!(formData.assignment_type === 'maman' || formData.assignment_type === 'mamach') && (
                <Input
                  id="title"
                  value={formData.title}
                  onChange={e => setFormData(f => ({ ...f, title: e.target.value }))}
                  placeholder="שם המטלה*"
                  className="h-11 px-3 text-lg flex-1"
                  required
                  maxLength={30}
                  autoFocus
                />
              )}
            </div>
            {/* תאריך + שעה */}
            <div className="grid grid-cols-2 gap-2 items-center mb-2">
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="w-full h-11 text-base px-2 bg-white border border-gray-300 rounded flex items-center justify-center"
                  >
                    <CalendarIcon className="w-4 h-4 ml-1" />
                    {format(formData.due_date, 'dd/MM/yy')}
                  </button>
                </PopoverTrigger>
                <PopoverContent>
                  <Calendar
                    mode="single"
                    selected={formData.due_date}
                    onSelect={date => date && setFormData(f => ({ ...f, due_date: date }))}
                  />
                </PopoverContent>
              </Popover>
              <Input
                id="time"
                type="time"
                value={formData.due_time}
                onChange={e => setFormData(f => ({ ...f, due_time: e.target.value }))}
                className="w-full h-11 px-2 text-base"
                placeholder="שעה"
              />
            </div>
            <Textarea
              id="description"
              value={formData.description}
              onChange={e => setFormData(f => ({ ...f, description: e.target.value }))}
              placeholder="הערות/תיאור (לא חובה)"
              rows={2}
              className="mt-1 text-base"
            />
            <div className="flex justify-between pt-3">
              <button type="button" onClick={() => { setIsAddDialogOpen(false); setEditingAssignment(null); resetForm(); }}
                className="text-base border border-gray-300 rounded px-4 py-2 bg-white">ביטול</button>
              <button type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2 rounded-lg font-bold text-base shadow"
                disabled={createAssignmentMutation.isPending || updateAssignmentMutation.isPending}
              >
                {editingAssignment ? 'עדכן' : 'הוסף'}
              </button>
              {(createAssignmentMutation.isPending || updateAssignmentMutation.isPending) && (
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400" /> שומר...
                </span>
              )}
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CourseAssignmentsSection;
