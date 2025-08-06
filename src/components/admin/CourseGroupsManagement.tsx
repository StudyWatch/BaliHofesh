import React, { useState, useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { MessageSquare, Plus, Edit2, Trash2, ExternalLink, Search, Users, XCircle } from 'lucide-react';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { useCourses } from '@/hooks/useCourses';
import { useCreateCourseGroup, useUpdateCourseGroup } from '@/hooks/useCourseGroups';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface CourseGroupForm {
  course_id: string;
  whatsapp_link?: string;
  discord_link?: string;
}

const CourseGroupsManagement = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<any>(null);
  const [formData, setFormData] = useState<CourseGroupForm>({ course_id: '', whatsapp_link: '', discord_link: '' });
  const [search, setSearch] = useState('');
  const [courseSearch, setCourseSearch] = useState('');
  const [courseDropdownOpen, setCourseDropdownOpen] = useState(false);
  const courseInputRef = useRef<HTMLInputElement>(null);

  const { toast } = useToast();
  const { data: courses } = useCourses();
  const createGroupMutation = useCreateCourseGroup();
  const updateGroupMutation = useUpdateCourseGroup();
  const queryClient = useQueryClient();

  // קבוצות
  const { data: allGroups, isLoading } = useQuery({
    queryKey: ['all-course-groups'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('course_groups')
        .select(`
          *, courses (
            id, name_he, code, institutions (name_he)
          )
        `)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  // חיפוש קבוצות
  const filteredGroups = useMemo(() => {
    if (!search) return allGroups;
    const searchLower = search.toLowerCase();
    return (allGroups || []).filter((group: any) =>
      group.courses?.name_he?.toLowerCase().includes(searchLower) ||
      group.courses?.code?.toLowerCase().includes(searchLower) ||
      group.courses?.institutions?.name_he?.toLowerCase().includes(searchLower)
    );
  }, [search, allGroups]);

  // חיפוש קורסים בטופס
  const filteredCourses = useMemo(() => {
    if (!courseSearch) return courses || [];
    const term = courseSearch.toLowerCase();
    return (courses || []).filter((course) =>
      course.name_he?.toLowerCase().includes(term) ||
      course.code?.toLowerCase().includes(term) ||
      course.institutions?.name_he?.toLowerCase().includes(term)
    );
  }, [courseSearch, courses]);

  const deleteMutation = useMutation({
    mutationFn: async (groupId: string) => {
      const { error } = await supabase.from('course_groups').delete().eq('id', groupId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-course-groups'] });
      toast({ title: 'קבוצה נמחקה', description: 'קבוצת הקורס נמחקה בהצלחה' });
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.course_id) {
      toast({ title: 'שגיאה', description: 'יש לבחור קורס', variant: 'destructive' });
      return;
    }
    if (!formData.whatsapp_link && !formData.discord_link) {
      toast({ title: 'שגיאה', description: 'יש להוסיף לפחות קישור אחד', variant: 'destructive' });
      return;
    }
    try {
      if (editingGroup) {
        await updateGroupMutation.mutateAsync({ id: editingGroup.id, ...formData });
        toast({ title: 'קבוצה עודכנה', description: 'פרטי הקבוצה עודכנו בהצלחה' });
      } else {
        await createGroupMutation.mutateAsync(formData);
        toast({ title: 'קבוצה נוצרה', description: 'קבוצת הקורס נוצרה בהצלחה' });
      }
      setIsDialogOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['all-course-groups'] });
    } catch {
      toast({ title: 'שגיאה', description: 'אירעה שגיאה בשמירת הקבוצה', variant: 'destructive' });
    }
  };

  const resetForm = () => {
    setFormData({ course_id: '', whatsapp_link: '', discord_link: '' });
    setEditingGroup(null);
    setCourseSearch('');
  };

  const startEdit = (group: any) => {
    setEditingGroup(group);
    setFormData({
      course_id: group.course_id,
      whatsapp_link: group.whatsapp_link || '',
      discord_link: group.discord_link || '',
    });
    setCourseSearch(group.courses ? `${group.courses.code} - ${group.courses.name_he}` : '');
    setIsDialogOpen(true);
  };

  const openDialog = () => {
    resetForm();
    setIsDialogOpen(true);
    setTimeout(() => {
      courseInputRef.current?.focus();
    }, 100);
  };

  if (isLoading) {
    return (
      <div className="w-full flex flex-col items-center justify-center py-16">
        <Users className="w-12 h-12 animate-pulse text-blue-400 mb-4" />
        <div className="text-lg text-blue-600">טוען קבוצות...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header וחיפוש */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5">
        <div>
          <h2 className="text-2xl font-bold text-blue-800 dark:text-blue-100">ניהול קבוצות קורסים</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm">מצא קישורי WhatsApp/Discord בקלות לכל קורס!</p>
        </div>
        <div className="flex items-center gap-2">
          <Input
            placeholder="חפש קורס, מוסד או קוד..."
            className="max-w-xs border-blue-200 dark:border-blue-900"
            value={search}
            onChange={e => setSearch(e.target.value)}
            prefix={<Search />}
          />
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-blue-600 to-purple-500 text-white shadow"
                onClick={openDialog}>
                <Plus className="w-4 h-4 mr-2" />
                הוסף קבוצה
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{editingGroup ? 'עריכת קבוצת קורס' : 'הוספת קבוצת קורס חדשה'}</DialogTitle>
                <DialogDescription>
                  {editingGroup ? 'ערוך קישורים קיימים' : 'צור קישורים חדשים עבור קורס'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* בחירת קורס מתקדמת */}
                <div>
                  <Label htmlFor="course-search">בחר קורס</Label>
                  <div className="relative">
                    <Input
                      id="course-search"
                      ref={courseInputRef}
                      autoComplete="off"
                      placeholder="הקלד שם/קוד קורס..."
                      value={courseSearch}
                      onChange={e => {
                        setCourseSearch(e.target.value);
                        setCourseDropdownOpen(true);
                        setFormData({ ...formData, course_id: '' });
                      }}
                      onFocus={() => setCourseDropdownOpen(true)}
                      className="mb-2"
                    />
                    {/* Dropdown של תוצאות */}
                    {courseDropdownOpen && (
                      <div className="absolute z-20 bg-white dark:bg-gray-900 w-full max-h-48 overflow-y-auto border rounded-xl shadow mt-1">
                        {filteredCourses.length > 0 ? (
                          filteredCourses.map(course => (
                            <button
                              key={course.id}
                              type="button"
                              className={`block w-full text-right px-4 py-2 hover:bg-blue-50 dark:hover:bg-blue-900 
                                ${formData.course_id === course.id ? "bg-blue-100 dark:bg-blue-800 font-bold" : ""}`}
                              onClick={() => {
                                setFormData({ ...formData, course_id: course.id });
                                setCourseSearch(`${course.code} - ${course.name_he}`);
                                setCourseDropdownOpen(false);
                              }}
                            >
                              {course.code} - {course.name_he}
                              <span className="ml-1 text-xs text-gray-400">{course.institutions?.name_he}</span>
                            </button>
                          ))
                        ) : (
                          <div className="px-4 py-2 text-gray-400 text-sm">לא נמצאו קורסים</div>
                        )}
                      </div>
                    )}
                    {/* איקס לאיפוס בחירה */}
                    {formData.course_id && (
                      <button
                        type="button"
                        onClick={() => {
                          setCourseSearch('');
                          setFormData({ ...formData, course_id: '' });
                          setCourseDropdownOpen(true);
                          courseInputRef.current?.focus();
                        }}
                        className="absolute left-2 top-2 text-gray-400 hover:text-red-500"
                        title="נקה בחירה"
                      >
                        <XCircle className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                  {formData.course_id && (
                    <div className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                      קורס נבחר: <b>{courseSearch}</b>
                    </div>
                  )}
                </div>
                {/* WhatsApp */}
                <div>
                  <Label htmlFor="whatsapp">קישור WhatsApp</Label>
                  <Input
                    id="whatsapp"
                    type="url"
                    placeholder="https://chat.whatsapp.com/..."
                    value={formData.whatsapp_link}
                    onChange={e => setFormData({ ...formData, whatsapp_link: e.target.value })}
                  />
                </div>
                {/* Discord */}
                <div>
                  <Label htmlFor="discord">קישור Discord</Label>
                  <Input
                    id="discord"
                    type="url"
                    placeholder="https://discord.gg/..."
                    value={formData.discord_link}
                    onChange={e => setFormData({ ...formData, discord_link: e.target.value })}
                  />
                </div>
                {/* כפתורים */}
                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">{editingGroup ? 'עדכן' : 'הוסף'}</Button>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    ביטול
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* קבוצות */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {(filteredGroups || []).map((group: any) => (
          <Card key={group.id} className="rounded-2xl shadow hover:shadow-xl transition">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-lg text-blue-900 dark:text-blue-100">
                    {group.courses.code} - {group.courses.name_he}
                  </CardTitle>
                  <p className="text-xs text-gray-500">
                    {group.courses.institutions?.name_he}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" onClick={() => startEdit(group)} title="עריכה">
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(group.id)} title="מחיקה">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3">
                {group.whatsapp_link && (
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-100 text-green-800 px-2 py-1 rounded-full">
                      <MessageSquare className="w-3 h-3 mr-1" />
                      WhatsApp
                    </Badge>
                    <a
                      href={group.whatsapp_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                    >
                      מעבר לקבוצה
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
                {group.discord_link && (
                  <div className="flex items-center gap-2">
                    <Badge className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                      <MessageSquare className="w-3 h-3 mr-1" />
                      Discord
                    </Badge>
                    <a
                      href={group.discord_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                    >
                      מעבר לקבוצה
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        {(filteredGroups?.length === 0 || !filteredGroups) && (
          <Card>
            <CardContent className="text-center py-10">
              <MessageSquare className="w-14 h-14 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">לא נמצאו קבוצות קורסים</h3>
              <p className="text-muted-foreground mb-4">
                נסה לשנות את החיפוש, או להוסיף קבוצה חדשה
              </p>
              <Button onClick={openDialog} className="bg-blue-600 text-white">
                <Plus className="w-4 h-4 mr-2" />
                הוסף קבוצה חדשה
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default CourseGroupsManagement;
