import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Plus, Check, Clock, MapPin } from 'lucide-react';
import { usePersonalizedExamCalendar } from '@/hooks/usePersonalizedExamCalendar';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface AddToCalendarButtonProps {
  courseId: string;
  courseName: string;
  courseCode?: string;
}

interface ExamDate {
  id: string;
  exam_type: string;
  exam_date: string;
  exam_time: string;
  location?: string;
}

const AddToCalendarButton = ({ courseId, courseName, courseCode }: AddToCalendarButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Mock exam dates - in real app this would come from useExamDates hook
  const examDates: ExamDate[] = [
    {
      id: '1',
      exam_type: "מועד א'",
      exam_date: '2024-02-15',
      exam_time: '09:00',
      location: 'אולם 101'
    },
    {
      id: '2', 
      exam_type: "מועד ב'",
      exam_date: '2024-03-15',
      exam_time: '13:00',
      location: 'אולם 205'
    },
    {
      id: '3',
      exam_type: "מועד מיוחד",
      exam_date: '2024-04-10',
      exam_time: '09:00',
      location: 'אולם 150'
    }
  ];

  const addToCalendarMutation = useMutation({
    mutationFn: async (examId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const exam = examDates.find(e => e.id === examId);
      if (!exam) throw new Error('Exam not found');

      // Update user_course_progress with selected exam info
      const { data, error } = await supabase
        .from('user_course_progress')
        .upsert({
          user_id: user.id,
          course_id: courseId,
          notes: `Selected exam: ${exam.exam_type} on ${exam.exam_date} at ${exam.exam_time}`,
          status: 'active'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personalized-exam-calendar'] });
      queryClient.invalidateQueries({ queryKey: ['user-favorite-courses'] });
      toast({
        title: "נוסף ללוח השנה!",
        description: `מועד הבחינה של ${courseName} נוסף ללוח השנה האישי שלך`,
      });
      setIsOpen(false);
      setSelectedExam(null);
    },
    onError: (error) => {
      toast({
        title: "שגיאה",
        description: "לא ניתן להוסיף ללוח השנה כרגע",
        variant: "destructive"
      });
    }
  });

  const handleAddToCalendar = () => {
    if (selectedExam) {
      addToCalendarMutation.mutate(selectedExam);
    }
  };

  const getDateStatus = (dateString: string) => {
    const examDate = new Date(dateString);
    const today = new Date();
    const diffTime = examDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { status: 'past', color: 'destructive', text: 'עבר' };
    if (diffDays <= 14) return { status: 'soon', color: 'destructive', text: `${diffDays} ימים` };
    if (diffDays <= 30) return { status: 'upcoming', color: 'default', text: `${diffDays} ימים` };
    return { status: 'future', color: 'secondary', text: `${diffDays} ימים` };
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
          size="lg"
        >
          <Calendar className="w-5 h-5 mr-2" />
          הוסף ללוח השנה
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Calendar className="w-6 h-6 text-green-600" />
            בחר מועד בחינה - {courseName}
          </DialogTitle>
          {courseCode && (
            <p className="text-muted-foreground">קוד קורס: {courseCode}</p>
          )}
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            בחר את מועד הבחינה שתרצה שיופיע בלוח השנה האישי שלך:
          </div>

          <div className="grid gap-3">
            {examDates.map((exam) => {
              const dateStatus = getDateStatus(exam.exam_date);
              const isSelected = selectedExam === exam.id;
              
              return (
                <Card 
                  key={exam.id}
                  className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                    isSelected 
                      ? 'ring-2 ring-green-500 bg-green-50' 
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => setSelectedExam(exam.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-full border-2 ${
                          isSelected 
                            ? 'bg-green-500 border-green-500' 
                            : 'border-muted-foreground/30'
                        }`}>
                          {isSelected && <Check className="w-3 h-3 text-white" />}
                        </div>
                        
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge variant={dateStatus.color as any} className="font-semibold">
                              {exam.exam_type}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              נותרו {dateStatus.text}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4 text-blue-500" />
                              <span className="font-medium">
                                {new Date(exam.exam_date).toLocaleDateString('he-IL', {
                                  weekday: 'long',
                                  day: 'numeric',
                                  month: 'long'
                                })}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4 text-orange-500" />
                              <span>{exam.exam_time}</span>
                            </div>
                            
                            {exam.location && (
                              <div className="flex items-center gap-1">
                                <MapPin className="w-4 h-4 text-green-500" />
                                <span>{exam.location}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="flex justify-between pt-4">
            <Button 
              variant="outline" 
              onClick={() => setIsOpen(false)}
            >
              ביטול
            </Button>
            
            <Button 
              onClick={handleAddToCalendar}
              disabled={!selectedExam || addToCalendarMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {addToCalendarMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  מוסיף...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  הוסף ללוח השנה
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddToCalendarButton;