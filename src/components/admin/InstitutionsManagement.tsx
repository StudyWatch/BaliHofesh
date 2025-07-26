
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { BookOpen, Plus, Edit, Trash2, Search, Calendar, Users } from 'lucide-react';
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

  // Add course mutation
  const addCourseMutation = useMutation({
    mutationFn: async (courseData: Omit<Course, 'id' | 'created_at' | 'updated_at'>) => {
      console.log('Adding course:', courseData);
      
      const { data, error } = await supabase
        .from('courses')
        .insert([courseData])
        .select()
        .single();
      
      if (error) {
        console.error('Error adding course:', error);
        throw error;
      }
      console.log('Course added successfully:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      queryClient.invalidateQueries({ queryKey: ['open-university-courses'] });
      setIsDialogOpen(false);
      setEditingCourse(null);
      toast({
        title: "הצלחה",
        description: "הקורס נוסף בהצלחה",
      });
    },
    onError: (error: any) => {
      console.error('Error adding course:', error);
      toast({
        title: "שגיאה",
        description: error.message || "שגיאה בהוספת הקורס",
        variant: "destructive",
      });
    }
  });

  // Update course mutation
  const updateCourseMutation = useMutation({
    mutationFn: async ({ id, ...courseData }: Partial<Course> & { id: string }) => {
      console.log('Updating course:', id, courseData);
      
      const { data, error } = await supabase
        .from('courses')
        .update(courseData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating course:', error);
        throw error;
      }
      console.log('Course updated successfully:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      queryClient.invalidateQueries({ queryKey: ['open-university-courses'] });
      setIsDialogOpen(false);
      setEditingCourse(null);
      toast({
        title: "הצלחה",
        description: "הקורס עודכן בהצלחה",
      });
    },
    onError: (error: any) => {
      console.error('Error updating course:', error);
      toast({
        title: "שגיאה",
        description: error.message || "שגיאה בעדכון הקורס",
        variant: "destructive",
      });
    }
  });

  // Delete course mutation
  const deleteCourseMutation = useMutation({
    mutationFn: async (courseId: string) => {
      console.log('Deleting course:', courseId);
      
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', courseId);
      
      if (error) {
        console.error('Error deleting course:', error);
        throw error;
      }
      console.log('Course deleted successfully');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      queryClient.invalidateQueries({ queryKey: ['open-university-courses'] });
      toast({
        title: "הצלחה",
        description: "הקורס נמחק בהצלחה",
      });
    },
    onError: (error: any) => {
      console.error('Error deleting course:', error);
      toast({
        title: "שגיאה",
        description: error.message || "שגיאה במחיקת הקורס",
        variant: "destructive",
      });
    }
  });

  // Filter courses based on search term
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

    console.log('Saving course with data:', dataWithInstitution);

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
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            ניהול קורסי האוניברסיטה הפתוחה ({filteredCourses.length})
          </CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleAddCourse} className="bg-green-600 hover:bg-green-700">
                <Plus className="w-4 h-4 ml-2" />
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
              placeholder="חיפוש קורס..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-8">
            <div className="text-lg text-gray-600">טוען קורסים...</div>
          </div>
        ) : (
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
                    ) : '-'}
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted with data:', formData);
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
            onChange={(e) => setFormData(prev => ({ ...prev, name_he: e.target.value }))}
            placeholder="למשל: מבוא למדעי המחשב"
            required
          />
        </div>
        <div>
          <Label htmlFor="name_en">שם הקורס (אנגלית)</Label>
          <Input
            id="name_en"
            value={formData.name_en}
            onChange={(e) => setFormData(prev => ({ ...prev, name_en: e.target.value }))}
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
            onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
            placeholder="למשל: 20471"
          />
        </div>
        <div>
          <Label htmlFor="semester">סמסטר</Label>
          <Input
            id="semester"
            value={formData.semester}
            onChange={(e) => setFormData(prev => ({ ...prev, semester: e.target.value }))}
            placeholder="למשל: סמסטר א' תשפה"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="exam_date">מועד בחינה</Label>
        <Input
          id="exam_date"
          type="date"
          value={formData.exam_date}
          onChange={(e) => setFormData(prev => ({ ...prev, exam_date: e.target.value }))}
        />
      </div>

      <div className="flex items-center space-x-2 space-x-reverse">
        <Switch
          id="collaboration"
          checked={formData.enable_collaboration}
          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, enable_collaboration: checked }))}
        />
        <Label htmlFor="collaboration">אפשר שיתוף פעולה ולימוד משותף</Label>
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
