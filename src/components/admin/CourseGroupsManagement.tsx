import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { MessageSquare, Plus, Edit2, Trash2, ExternalLink } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCourses } from '@/hooks/useCourses';
import { useCourseGroups, useCreateCourseGroup, useUpdateCourseGroup } from '@/hooks/useCourseGroups';
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
  const [formData, setFormData] = useState<CourseGroupForm>({
    course_id: '',
    whatsapp_link: '',
    discord_link: '',
  });
  
  const { toast } = useToast();
  const { data: courses } = useCourses();
  const createGroupMutation = useCreateCourseGroup();
  const updateGroupMutation = useUpdateCourseGroup();
  const queryClient = useQueryClient();

  // Get all course groups
  const { data: allGroups, isLoading } = useQuery({
    queryKey: ['all-course-groups'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('course_groups')
        .select(`
          *,
          courses (
            id,
            name_he,
            code,
            institutions (name_he)
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (groupId: string) => {
      const { error } = await supabase
        .from('course_groups')
        .delete()
        .eq('id', groupId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-course-groups'] });
      toast({
        title: 'קבוצה נמחקה',
        description: 'קבוצת הקורס נמחקה בהצלחה',
      });
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.course_id) {
      toast({
        title: 'שגיאה',
        description: 'יש לבחור קורס',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.whatsapp_link && !formData.discord_link) {
      toast({
        title: 'שגיאה',
        description: 'יש להוסיף לפחות קישור אחד',
        variant: 'destructive',
      });
      return;
    }

    try {
      if (editingGroup) {
        await updateGroupMutation.mutateAsync({
          id: editingGroup.id,
          ...formData,
        });
        toast({
          title: 'קבוצה עודכנה',
          description: 'פרטי הקבוצה עודכנו בהצלחה',
        });
      } else {
        await createGroupMutation.mutateAsync(formData);
        toast({
          title: 'קבוצה נוצרה',
          description: 'קבוצת הקורס נוצרה בהצלחה',
        });
      }
      
      setIsDialogOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['all-course-groups'] });
    } catch (error) {
      toast({
        title: 'שגיאה',
        description: 'אירעה שגיאה בשמירת הקבוצה',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setFormData({ course_id: '', whatsapp_link: '', discord_link: '' });
    setEditingGroup(null);
  };

  const startEdit = (group: any) => {
    setEditingGroup(group);
    setFormData({
      course_id: group.course_id,
      whatsapp_link: group.whatsapp_link || '',
      discord_link: group.discord_link || '',
    });
    setIsDialogOpen(true);
  };

  const openDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  if (isLoading) {
    return <div>טוען...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">ניהול קבוצות קורסים</h2>
          <p className="text-muted-foreground">
            ניהול קישורי WhatsApp ו-Discord לכל קורס
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openDialog}>
              <Plus className="w-4 h-4 mr-2" />
              הוסף קבוצה
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingGroup ? 'עריכת קבוצת קורס' : 'הוספת קבוצת קורס חדשה'}
              </DialogTitle>
              <DialogDescription>
                הוסף או ערוך קישורי קבוצות לקורס
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="course">קורס</Label>
                <Select
                  value={formData.course_id}
                  onValueChange={(value) => setFormData({ ...formData, course_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="בחר קורס" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses?.map((course) => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.code} - {course.name_he}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="whatsapp">קישור WhatsApp</Label>
                <Input
                  id="whatsapp"
                  type="url"
                  placeholder="https://chat.whatsapp.com/..."
                  value={formData.whatsapp_link}
                  onChange={(e) => setFormData({ ...formData, whatsapp_link: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="discord">קישור Discord</Label>
                <Input
                  id="discord"
                  type="url"
                  placeholder="https://discord.gg/..."
                  value={formData.discord_link}
                  onChange={(e) => setFormData({ ...formData, discord_link: e.target.value })}
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  {editingGroup ? 'עדכן' : 'הוסף'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                >
                  ביטול
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Groups List */}
      <div className="grid gap-4">
        {allGroups?.map((group) => (
          <Card key={group.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">
                    {group.courses.code} - {group.courses.name_he}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {group.courses.institutions?.name_he}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => startEdit(group)}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteMutation.mutate(group.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {group.whatsapp_link && (
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      <MessageSquare className="w-3 h-3 mr-1" />
                      WhatsApp
                    </Badge>
                    <a 
                      href={group.whatsapp_link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                    >
                      קישור לקבוצה
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
                {group.discord_link && (
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      <MessageSquare className="w-3 h-3 mr-1" />
                      Discord
                    </Badge>
                    <a 
                      href={group.discord_link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                    >
                      קישור לקבוצה
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        
        {allGroups?.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">אין קבוצות קורסים</h3>
              <p className="text-muted-foreground mb-4">
                טרם נוצרו קבוצות לקורסים במערכת
              </p>
              <Button onClick={openDialog}>
                <Plus className="w-4 h-4 mr-2" />
                הוסף קבוצה ראשונה
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default CourseGroupsManagement;