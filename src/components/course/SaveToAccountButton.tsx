import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogDescription,
  DialogHeader, DialogTitle, DialogTrigger
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useRelevantSemesters } from '@/hooks/useSemesters';
import { BookmarkPlus, CheckCircle, Trash2 } from 'lucide-react';

interface SaveToAccountButtonProps {
  courseId: string;
  courseName: string;
}

const SaveToAccountButton = ({ courseId, courseName }: SaveToAccountButtonProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedSemester, setSelectedSemester] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // בדיקת קורס שמור
  const { data: savedCourse, refetch } = useQuery({
    queryKey: ['user-course-progress', courseId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data, error } = await supabase
        .from('user_course_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('course_id', courseId)
        .maybeSingle();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    }
  });

  // שליפת סמסטרים עדכניים
  const { data: semesters = [] } = useRelevantSemesters();

  // הוספת קורס למועדפים
  const handleSave = async () => {
    if (!selectedSemester) {
      toast({
        title: "יש לבחור סמסטר",
        description: "אנא בחר באיזה סמסטר אתה לומד את הקורס.",
        variant: "destructive"
      });
      return;
    }
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user');
      const { error } = await supabase
        .from('user_course_progress')
        .insert({
          user_id: user.id,
          course_id: courseId,
          status: 'active',
          progress_percentage: 0,
          semester: selectedSemester,
          is_favorite: true
        });
      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey: ['user-course-progress'] });
      refetch();
      toast({
        title: "🎉 הקורס נשמר בהצלחה!",
        description: `הקורס "${courseName}" נוסף לסמסטר "${selectedSemester}".`
      });
      setIsDialogOpen(false);
      setSelectedSemester('');
    } catch (err) {
      toast({
        title: "שגיאה בשמירה",
        description: "לא ניתן היה לשמור את הקורס. נסה שוב.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // מחיקת קורס מהמועדפים
  const handleRemove = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user');
      const { error } = await supabase
        .from('user_course_progress')
        .delete()
        .eq('user_id', user.id)
        .eq('course_id', courseId);
      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey: ['user-course-progress'] });
      refetch();
      toast({
        title: "הקורס הוסר מהמועדפים",
        description: `הקורס "${courseName}" הוסר בהצלחה.`,
      });
      setShowDeleteDialog(false);
    } catch (err) {
      toast({
        title: "שגיאה בהסרה",
        description: "לא הצלחנו להסיר את הקורס. נסה שוב.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // מצב: כבר במועדפים
  if (savedCourse) {
    return (
      <div className="flex flex-col gap-4" dir="rtl">
        <div className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <Badge className="bg-green-100 text-green-700 px-3 py-1 text-md shadow-sm border border-green-200">
            שמור לחשבון {savedCourse.semester ? `(${savedCourse.semester})` : ""}
          </Badge>
        </div>
        <Button
          onClick={() => setShowDeleteDialog(true)}
          disabled={isLoading}
          variant="outline"
          className="w-full mt-2 text-red-600 border-red-400 hover:bg-red-50 flex gap-2 justify-center items-center font-bold"
        >
          <Trash2 className="w-4 h-4" />
          {isLoading ? 'מסיר...' : 'הסר קורס מהמועדפים'}
        </Button>

        {/* דיאלוג אישור מחיקה */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent className="sm:max-w-md" dir="rtl">
            <DialogHeader>
              <DialogTitle>אישור הסרה</DialogTitle>
              <DialogDescription>
                האם אתה בטוח שברצונך להסיר את הקורס <b>{courseName}</b> מהמועדפים שלך?
              </DialogDescription>
            </DialogHeader>
            <div className="flex gap-2 mt-4">
              <Button
                onClick={handleRemove}
                disabled={isLoading}
                className="flex-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all"
              >
                {isLoading ? 'מסיר...' : 'כן, הסר'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowDeleteDialog(false)}
                disabled={isLoading}
                className="flex-1"
              >
                ביטול
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // מצב: טרם נשמר
  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button
          size="lg"
          className="bg-blue-600 text-white rounded-xl px-8 py-3 font-semibold shadow-lg hover:bg-blue-700 hover:shadow-xl transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <BookmarkPlus className="w-5 h-5 ml-2" />
          שמור קורס לחשבון
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md rounded-xl" dir="rtl">
        <DialogHeader>
          <DialogTitle className="font-extrabold">שמירת קורס לחשבון</DialogTitle>
          <DialogDescription>
            באיזה סמסטר תרצה לשייך את הקורס <b>{courseName}</b>?
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <Select value={selectedSemester} onValueChange={setSelectedSemester}>
            <SelectTrigger
              className="h-12 text-[17px] font-semibold bg-white border border-gray-300 rounded-xl px-4 pr-6 shadow-sm hover:border-blue-400 focus:ring-2 focus:ring-blue-500 data-[placeholder]:text-gray-400"
              dir="rtl"
            >
              <SelectValue placeholder="בחר סמסטר..." />
            </SelectTrigger>
            <SelectContent
              className="rounded-xl border border-gray-200 shadow-2xl bg-white w-full animate-in fade-in-50 slide-in-from-top-2"
              dir="rtl"
            >
              {semesters.map((s) => (
                <SelectItem
                  key={s.name}
                  value={s.name}
                  className="py-3 px-5 text-[17px] rounded-lg cursor-pointer hover:bg-blue-50 data-[state=checked]:bg-blue-100 data-[state=checked]:font-bold"
                >
                  {s.name} {s.is_current && <span className="text-green-600 font-bold">(נוכחי)</span>}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex gap-2 mt-4">
            <Button
              onClick={handleSave}
              disabled={!selectedSemester || isLoading}
              className="flex-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all font-bold"
            >
              {isLoading ? 'שומר...' : 'שמור קורס'}
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={isLoading}
              className="flex-1"
            >
              ביטול
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SaveToAccountButton;
