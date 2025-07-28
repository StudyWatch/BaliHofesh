import React, { useState, useEffect } from 'react';
import {
  Card, CardHeader, CardTitle, CardContent
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from '@/components/ui/dialog';
import {
  BookOpen, Plus, Edit, Trash2, Search, Calendar, Users
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Course {
  id: string;
  name_he: string;
  name_en?: string;
  code?: string;
  semester?: string;
  exam_date?: string;
  enable_collaboration: boolean;
  institution_id: string;
  created_at: string;
  updated_at: string;
}

interface Institution {
  id: string;
  name_he: string;
  name_en?: string;
}

const InstitutionsManagement = () => {
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get Open University institution
  const { data: openUniversity } = useQuery({
    queryKey: ['open-university'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('institutions')
        .select('*')
        .eq('name_he', 'האוניברסיטה הפתוחה')
        .single();
      if (error) throw error;
      return data as Institution;
    }
  });

  // Fetch courses for Open University
  const { data: courses = [], isLoading } = useQuery({
    queryKey: ['courses', openUniversity?.id],
    queryFn: async () => {
      if (!openUniversity?.id) return [];
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('institution_id', openUniversity.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Course[];
    },
    enabled: !!openUniversity?.id
  });

  // Add/Update/Delete Mutations
  const addCourseMutation = useMutation({
    mutationFn: async (courseData: Omit<Course, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('courses')
        .insert([courseData])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      queryClient.invalidateQueries({ queryKey: ['open-university-courses'] });
      setIsDialogOpen(false);
      setEditingCourse(null);
      toast({ title: "הצלחה", description: "הקורס נוסף בהצלחה" });
    },
    onError: (error: any) => {
      toast({
        title: "שגיאה",
        description: error.message || "שגיאה בהוספת הקורס",
        variant: "destructive",
      });
    }
  });

  const updateCourseMutation = useMutation({
    mutationFn: async ({ id, ...courseData }: Partial<Course> & { id: string }) => {
      const { data, error } = await supabase
        .from('courses')
        .update(courseData)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      queryClient.invalidateQueries({ queryKey: ['open-university-courses'] });
      setIsDialogOpen(false);
      setEditingCourse(null);
      toast({ title: "הצלחה", description: "הקורס עודכן בהצלחה" });
    },
    onError: (error: any) => {
      toast({
        title: "שגיאה",
        description: error.message || "שגיאה בעדכון הקורס",
        variant: "destructive",
      });
    }
  });

  const deleteCourseMutation = useMutation({
    mutationFn: async (courseId: string) => {
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', courseId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      queryClient.invalidateQueries({ queryKey: ['open-university-courses'] });
      toast({ title: "הצלחה", description: "הקורס נמחק בהצלחה" });
    },
    onError: (error: any) => {
      toast({
        title: "שגיאה",
        description: error.message || "שגיאה במחיקת הקורס",
        variant: "destructive",
      });
    }
  });

  // Filter courses
  const filteredCourses = courses.filter(course =>
    course.name_he.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.name_en?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSaveCourse = (courseData: Omit<Course, 'id' | 'created_at' | 'updated_at'>) => {
    const dataWithInstitution = {
      ...courseData,
      institution_id: openUniversity?.id || ''
    };
    if (editingCourse) {
      updateCourseMutation.mutate({ id: editingCourse.id, ...dataWithInstitution });
    } else {
      addCourseMutation.mutate(dataWithInstitution);
    }
  };

  const handleDeleteCourse = (courseId: string) => {
    if (confirm('האם אתה בטוח שברצונך למחוק את הקורס?')) {
      deleteCourseMutation.mutate(courseId);
    }
  };

  const handleAddCourse = () => {
    setEditingCourse(null);
    setIsDialogOpen(true);
  };

  const handleEditCourse = (course: Course) => {
    setEditingCourse(course);
    setIsDialogOpen(true);
  };

  if (!openUniversity) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p>טוען נתוני האוניברסיטה הפתוחה...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/80 dark:bg-blue-950/40 border-2 border-blue-100">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
            <BookOpen className="w-5 h-5" />
            <span>ניהול קורסי האוניברסיטה הפתוחה</span>
            <span className="text-base font-normal text-gray-400">({filteredCourses.length})</span>
          </CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleAddCourse} className="bg-green-600 hover:bg-green-700 flex gap-2 items-center">
                <Plus className="w-4 h-4 ml-1" />
                הוסף קורס חדש
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingCourse ? 'עריכת קורס' : 'הוספת קורס חדש'}
                </DialogTitle>
              </DialogHeader>
              <CourseForm
                course={editingCourse}
                onSave={handleSaveCourse}
                onCancel={() => setIsDialogOpen(false)}
                isLoading={addCourseMutation.isPending || updateCourseMutation.isPending}
              />
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <Input
              placeholder="חפש קורס לפי שם, קוד, או אנגלית..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-8 text-lg text-blue-600">טוען קורסים...</div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>שם הקורס</TableHead>
                  <TableHead>קוד</TableHead>
                  <TableHead>סמסטר</TableHead>
                  <TableHead>מועד בחינה</TableHead>
                  <TableHead>שיתוף פעולה</TableHead>
                  <TableHead>פעולות</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCourses.map((course) => (
                  <TableRow key={course.id}>
                    <TableCell className="font-medium">
                      <div>
                        <div className="font-semibold">{course.name_he}</div>
                        {course.name_en && (
                          <div className="text-sm text-gray-500">{course.name_en}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {course.code && (
                        <Badge variant="outline">{course.code}</Badge>
                      )}
                    </TableCell>
                    <TableCell>{course.semester || '-'}</TableCell>
                    <TableCell>
                      {course.exam_date ? (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(course.exam_date).toLocaleDateString('he-IL')}
                        </div>
                      ) : <span className="text-gray-400">-</span>}
                    </TableCell>
                    <TableCell>
                      {course.enable_collaboration ? (
                        <Badge className="bg-green-100 text-green-800">
                          <Users className="w-3 h-3 mr-1" />
                          זמין
                        </Badge>
                      ) : (
                        <Badge variant="secondary">לא זמין</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditCourse(course)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteCourse(course.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {filteredCourses.length === 0 && !isLoading && (
          <div className="text-center py-8">
            <BookOpen className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">אין קורסים</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm ? 'לא נמצאו קורסים המתאימים לחיפוש' : 'טרם נוספו קורסים למערכת'}
            </p>
            <Button onClick={handleAddCourse} className="bg-green-600 hover:bg-green-700">
              <Plus className="w-4 h-4 ml-2" />
              הוסף את הקורס הראשון
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const CourseForm = ({
  course,
  onSave,
  onCancel,
  isLoading
}: {
  course: Course | null;
  onSave: (data: Omit<Course, 'id' | 'created_at' | 'updated_at'>) => void;
  onCancel: () => void;
  isLoading: boolean;
}) => {
  const [formData, setFormData] = useState({
    name_he: course?.name_he || '',
    name_en: course?.name_en || '',
    code: course?.code || '',
    semester: course?.semester || '',
    exam_date: course?.exam_date || '',
    enable_collaboration: course?.enable_collaboration || false,
    institution_id: course?.institution_id || ''
  });

  useEffect(() => {
    if (course) {
      setFormData({
        name_he: course?.name_he || '',
        name_en: course?.name_en || '',
        code: course?.code || '',
        semester: course?.semester || '',
        exam_date: course?.exam_date || '',
        enable_collaboration: course?.enable_collaboration || false,
        institution_id: course?.institution_id || ''
      });
    } else {
      setFormData({
        name_he: '',
        name_en: '',
        code: '',
        semester: '',
        exam_date: '',
        enable_collaboration: false,
        institution_id: ''
      });
    }
  }, [course]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name_he">שם הקורס (עברית) *</Label>
          <Input
            id="name_he"
            value={formData.name_he}
            onChange={e => setFormData(prev => ({ ...prev, name_he: e.target.value }))}
            placeholder="למשל: מבוא למדעי המחשב"
            required
          />
        </div>
        <div>
          <Label htmlFor="name_en">שם הקורס (אנגלית)</Label>
          <Input
            id="name_en"
            value={formData.name_en}
            onChange={e => setFormData(prev => ({ ...prev, name_en: e.target.value }))}
            placeholder="e.g: Introduction to Computer Science"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="code">קוד הקורס</Label>
          <Input
            id="code"
            value={formData.code}
            onChange={e => setFormData(prev => ({ ...prev, code: e.target.value }))}
            placeholder="למשל: 20471"
          />
        </div>
        <div>
          <Label htmlFor="semester">סמסטר</Label>
          <Input
            id="semester"
            value={formData.semester}
            onChange={e => setFormData(prev => ({ ...prev, semester: e.target.value }))}
            placeholder="למשל: סמסטר א' תשפ״ה"
          />
        </div>
      </div>
      <div>
        <Label htmlFor="exam_date">מועד בחינה</Label>
        <Input
          id="exam_date"
          type="date"
          value={formData.exam_date}
          onChange={e => setFormData(prev => ({ ...prev, exam_date: e.target.value }))}
        />
      </div>
      <div className="flex items-center gap-2 pt-2">
        <Switch
          id="collaboration"
          checked={formData.enable_collaboration}
          onCheckedChange={checked => setFormData(prev => ({ ...prev, enable_collaboration: checked }))}
        />
        <Label htmlFor="collaboration" className="font-normal">אפשר שיתוף פעולה ולימוד משותף</Label>
      </div>
      <div className="flex gap-3 pt-4">
        <Button
          type="submit"
          disabled={isLoading}
          className="flex-1 bg-green-600 hover:bg-green-700"
        >
          {isLoading ? 'שומר...' : (course ? 'עדכן קורס' : 'הוסף קורס')}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          ביטול
        </Button>
      </div>
    </form>
  );
};

export default InstitutionsManagement;
