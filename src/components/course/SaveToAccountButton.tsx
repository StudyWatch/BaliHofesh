// src/components/SaveToAccountButton.tsx

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
  compact?: boolean; // האם במצב קטן/פינתי
}

const SaveToAccountButton = ({ courseId, courseName, compact }: SaveToAccountButtonProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedSemester, setSelectedSemester] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  const { data: semesters = [] } = useRelevantSemesters();

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
      await queryClient.invalidateQueries({ queryKey: ['my-courses'] });
      await queryClient.invalidateQueries({ queryKey: ['calendar-events'] });

      toast({
        title: "🎉 הקורס נשמר בהצלחה!",
        description: `הקורס "${courseName}" נוסף לסמסטר "${selectedSemester}".`
      });

      setIsDialogOpen(false);
      setSelectedSemester('');
      refetch();

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

  const handleRemove = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user');

      const { data: deletedRows, error } = await supabase
        .from('user_course_progress')
        .delete()
        .eq('user_id', user.id)
        .eq('course_id', courseId)
        .select();

      if (error) throw error;
      if (!deletedRows || deletedRows.length === 0) {
        throw new Error('לא נמצאה רשומה למחיקה');
      }

      await queryClient.invalidateQueries({ queryKey: ['user-course-progress'] });
      await queryClient.invalidateQueries({ queryKey: ['my-courses'] });
      await queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      await queryClient.invalidateQueries();

      toast({
        title: "הקורס הוסר מהחשבון",
        description: `הקורס "${courseName}" הוסר בהצלחה.`,
      });

      setShowDeleteDialog(false);
      setIsDialogOpen(false);
      setSelectedSemester('');
      await refetch();

    } catch (err: any) {
      console.error('שגיאה במחיקה:', err.message);
      toast({
        title: "שגיאה בהסרה",
        description: err.message || "לא הצלחנו להסיר את הקורס. נסה שוב.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // --------- קומפקט: אייקון קטן בלבד -----------------
  if (compact) {
    return (
      <div className="absolute left-3 bottom-3 z-30">
        {savedCourse ? (
          <span title="הקורס במועדפים">
            <CheckCircle className="w-6 h-6 text-green-600 bg-white/90 border-2 border-white rounded-full shadow transition" />
          </span>
        ) : (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <button
                type="button"
                onClick={e => { e.stopPropagation(); }}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-white/90 border-2 border-gray-200 shadow text-blue-600 hover:bg-blue-50 transition focus:outline-none"
                title="הוסף קורס למועדפים"
              >
                <BookmarkPlus className="w-5 h-5" />
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md" dir="rtl">
              <DialogHeader>
                <DialogTitle>הוספת קורס למועדפים</DialogTitle>
                <DialogDescription>
                  באיזה סמסטר תרצה לשמור את הקורס "{courseName}"?
                </DialogDescription>
              </DialogHeader>
              <div className="my-2">
                <Select value={selectedSemester} onValueChange={setSelectedSemester}>
                  <SelectTrigger className="w-full h-12 font-semibold rounded-lg bg-white border px-3">
                    <SelectValue placeholder="בחר סמסטר..." />
                  </SelectTrigger>
                  <SelectContent>
                    {semesters.map((s) => (
                      <SelectItem key={s.name} value={s.name}>
                        {s.name} {s.is_current && <span className="text-green-600 font-bold">(נוכחי)</span>}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 mt-4">
                <Button
                  onClick={handleSave}
                  disabled={!selectedSemester || isLoading}
                  className="flex-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
                >
                  {isLoading ? "שומר..." : "שמור"}
                </Button>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="flex-1">
                  ביטול
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    );
  }

  // ----------- רגיל (קיים) -----------
  if (savedCourse) {
    return (
      <div className="flex flex-col gap-3" dir="rtl">
        <div className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <Badge className="bg-green-100 text-green-700 px-3 py-1 text-md">
            שמור ({savedCourse.semester})
          </Badge>
        </div>
        <Button
          onClick={() => setShowDeleteDialog(true)}
          disabled={isLoading}
          variant="outline"
          className="w-full mt-2 text-red-600 border-red-500 hover:bg-red-50 flex gap-2 justify-center items-center"
        >
          <Trash2 className="w-4 h-4" />
          {isLoading ? 'מסיר...' : 'הסר קורס מהחשבון'}
        </Button>

        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent className="sm:max-w-md" dir="rtl">
            <DialogHeader>
              <DialogTitle>אישור הסרה</DialogTitle>
              <DialogDescription>
                האם אתה בטוח שברצונך להסיר את הקורס <b>{courseName}</b> מהחשבון שלך?
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

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button
          size="lg"
          className="bg-blue-600 text-white rounded-lg px-8 py-3 font-medium shadow-lg hover:bg-blue-700 hover:shadow-xl transform hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <BookmarkPlus className="w-5 h-5 ml-2" />
          שמור קורס לחשבון
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle>שמירת קורס לחשבון</DialogTitle>
          <DialogDescription>
            באיזה סמסטר תרצה לשייך את הקורס "{courseName}"?
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
              className="flex-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all"
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
