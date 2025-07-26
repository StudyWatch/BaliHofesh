import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { BookOpen, Calendar as CalendarIcon, Edit, Trash2, Plus } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

const mamanNumbers = ['11', '12', '13', '14', '15', '16', '17', '18'];
const mamachNumbers = ['01', '02', '03', '04', '05', '06', '07'];

const assignmentTypes = [
  { value: 'maman', label: 'ממ"ן', icon: '📋' },
  { value: 'mamach', label: 'ממ"ח', icon: '💻' },
  { value: 'homework', label: 'עבודת בית', icon: '📝' },
  { value: 'project', label: 'פרויקט', icon: '💼' },
  { value: 'essay', label: 'חיבור', icon: '📄' }
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

const useCourseAssignments = (courseId: string) => {
  return useQuery({
    queryKey: ['course-assignments', courseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('course_assignments')
        .select('*')
        .eq('course_id', courseId)
        .order('due_date', { ascending: true });
      if (error) throw error;
      return (data as any[]).map(row => ({
        ...row,
        type: row.assignment_type,
      })) as Assignment[];
    },
    enabled: !!courseId,
  });
};

const useCreateAssignment = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (assignmentData: Omit<Assignment, 'id' | 'created_at' | 'updated_at'>) => {
      const user = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('course_assignments')
        .insert({
          ...assignmentData,
          created_by: user.data.user?.id,
          verified: false,
        })
        .select()
        .single();
      if (error) throw error;
      return data as Assignment;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['course-assignments', data.course_id] });
      toast({ title: "עבודה נוספה", description: "העבודה נוספה בהצלחה" });
    },
    onError: () => {
      toast({ title: "שגיאה", description: "לא ניתן להוסיף את העבודה כרגע", variant: "destructive" });
    }
  });
};

const useUpdateAssignment = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updateData }: Partial<Assignment> & { id: string }) => {
      const user = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('course_assignments')
        .update({
          ...updateData,
          updated_at: new Date().toISOString(),
          updated_by: user.data.user?.id,
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
    onError: () => {
      toast({ title: "שגיאה", description: "לא ניתן לעדכן את העבודה כרגע", variant: "destructive" });
    }
  });
};

const useDeleteAssignment = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
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
    onError: () => {
      toast({ title: "שגיאה", description: "לא ניתן למחוק את העבודה כרגע", variant: "destructive" });
    }
  });
};

const CourseAssignmentsSection: React.FC<CourseAssignmentsSectionProps> = ({ courseId, courseName }) => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);

  const [formData, setFormData] = useState<AssignmentFormData>({
    assignment_type: 'maman',
    assignment_number: '',
    title: '',
    description: '',
    due_date: new Date(),
    due_time: '23:59',
  });

  const { data: assignments = [], isLoading } = useCourseAssignments(courseId);
  const createAssignmentMutation = useCreateAssignment();
  const updateAssignmentMutation = useUpdateAssignment();
  const deleteAssignmentMutation = useDeleteAssignment();
  const { toast } = useToast();

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
    if (formData.assignment_type === 'maman' && assignment_number) title = `ממ״ן ${assignment_number}`;
    if (formData.assignment_type === 'mamach' && assignment_number) title = `ממ״ח ${assignment_number}`;
    if (!title || (['maman', 'mamach'].includes(formData.assignment_type) && !assignment_number)) {
      toast({ title: "שגיאה", description: "יש למלא את כל השדות הנדרשים", variant: "destructive" });
      return;
    }
    const assignmentData = {
      course_id: courseId,
      title,
      assignment_type: formData.assignment_type,
      assignment_number: assignment_number || null,
      description: formData.description,
      due_date: format(formData.due_date, 'yyyy-MM-dd'),
      due_time: formData.due_time,
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
    } catch {
      toast({ title: "שגיאה", description: "לא ניתן לשמור את העבודה כרגע", variant: "destructive" });
    }
  };

  const handleEdit = (assignment: Assignment) => {
    setEditingAssignment(assignment);
    let assignment_number: string = assignment.assignment_number || '';
    if (!assignment_number && assignment.assignment_type === 'maman' && assignment.title.match(/(\d{2})$/))
      assignment_number = assignment.title.match(/(\d{2})$/)?.[1] || '';
    if (!assignment_number && assignment.assignment_type === 'mamach' && assignment.title.match(/(\d{2})$/))
      assignment_number = assignment.title.match(/(\d{2})$/)?.[1] || '';
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

  const handleDelete = async (assignmentId: string) => {
    if (window.confirm('האם למחוק את העבודה?')) {
      await deleteAssignmentMutation.mutateAsync(assignmentId);
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center font-bold text-lg gap-2">
          <BookOpen className="w-5 h-5 text-indigo-600" />
          <span>עבודות וממ"נים</span>
        </div>
        <button
          className="rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:to-blue-800 w-9 h-9 flex items-center justify-center text-white shadow transition"
          title="הוסף מטלה"
          onClick={() => { resetForm(); setEditingAssignment(null); setIsAddDialogOpen(true); }}
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>
      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-blue-400" />
        </div>
      ) : assignments.length === 0 ? (
        <div className="text-center text-gray-500 p-6 flex flex-col items-center">
          <BookOpen className="w-12 h-12 text-gray-300 mb-2" />
          <div className="font-bold text-base">אין מטלות או ממ"נים</div>
          <div className="text-xs text-gray-400">הוסף ממ"ן או עבודה עכשיו</div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {assignments.map((assignment) => (
            <div key={assignment.id} className="bg-white border border-gray-200 rounded-lg p-2 flex flex-col shadow-sm hover:shadow transition min-h-[74px]">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xl">{assignmentTypes.find(t => t.value === assignment.assignment_type)?.icon || '📝'}</span>
                <div className="flex gap-1">
                  <button className="text-indigo-500 hover:text-indigo-700" title="ערוך" onClick={() => handleEdit(assignment)}>
                    <Edit className="w-4 h-4" />
                  </button>
                  <button className="text-red-500 hover:text-red-700" title="מחק" onClick={() => handleDelete(assignment.id)}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="font-semibold text-[15px] truncate" title={assignment.title}>
                {assignment.title}
              </div>
              <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                <CalendarIcon className="w-3 h-3" />
                {format(new Date(assignment.due_date), 'dd/MM')}
              </div>
            </div>
          ))}
        </div>
      )}

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

            {/* שורה של תאריך ואז שעה תמיד! */}
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
