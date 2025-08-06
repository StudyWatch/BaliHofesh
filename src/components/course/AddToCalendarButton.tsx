import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Plus, Check, Clock, MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useExamDates } from '@/hooks/useExamDates';

function isMobileDevice() {
  if (typeof navigator === 'undefined') return false;
  return /Mobi|Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent);
}

function createICS({ events }: {
  events: {
    title: string;
    description?: string;
    location?: string;
    startDate: Date;
    endDate: Date;
  }[];
}) {
  const pad = (n: number) => n.toString().padStart(2, "0");
  const formatDate = (date: Date) =>
    date.getUTCFullYear() +
    pad(date.getUTCMonth() + 1) +
    pad(date.getUTCDate()) +
    "T" +
    pad(date.getUTCHours()) +
    pad(date.getUTCMinutes()) +
    "00Z";

  return `
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//BaliHofesh//Exam Calendar//EN
${events
  .map(
    (event) => `
BEGIN:VEVENT
SUMMARY:${event.title}
DESCRIPTION:${event.description || ""}
LOCATION:${event.location || ""}
DTSTART:${formatDate(event.startDate)}
DTEND:${formatDate(event.endDate)}
END:VEVENT`
  )
  .join('\n')}
END:VCALENDAR
  `.trim();
}

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

const AddToCalendarButton: React.FC<AddToCalendarButtonProps> = ({
  courseId,
  courseName,
  courseCode
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedExams, setSelectedExams] = useState<string[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isMobile = useMemo(isMobileDevice, []);

  const { data: examDates = [], isLoading } = useExamDates(courseId) as {
    data: ExamDate[];
    isLoading: boolean;
  };

  const addToCalendarMutation = useMutation({
    mutationFn: async (examIds: string[]) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      const chosenExams = examDates.filter(e => examIds.includes(e.id));
      if (!chosenExams.length) throw new Error('No exams selected');
      // אפשר לעדכן פה שיהיה רק אם לא קיים כבר, או תמיד לאפשר (לפי מה שתרצה)
      const { data, error } = await supabase
        .from('user_course_progress')
        .upsert({
          user_id: user.id,
          course_id: courseId,
          notes: `נבחרו מועדים: ${chosenExams.map(exam =>
            `${exam.exam_type} (${exam.exam_date} ${exam.exam_time})`
          ).join(', ')}`,
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
        title: "נוספו ללוח השנה!",
        description: `מועדי הבחינה של ${courseName} נוספו ללוח השנה האישי שלך`,
      });
      setIsOpen(false);
      setSelectedExams([]);
    },
    onError: () => {
      toast({
        title: "שגיאה",
        description: "לא ניתן להוסיף ללוח השנה כרגע",
        variant: "destructive"
      });
    }
  });

  const getDateStatus = (dateString: string) => {
    const [y, m, d] = dateString.split("-");
    const examDate = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
    const today = new Date();
    today.setHours(0,0,0,0);
    examDate.setHours(0,0,0,0);
    const diffTime = examDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return { status: 'past', color: 'destructive', text: 'עבר' };
    if (diffDays === 0) return { status: 'soon', color: 'destructive', text: 'היום!' };
    if (diffDays <= 14) return { status: 'soon', color: 'destructive', text: `${diffDays} ימים` };
    if (diffDays <= 30) return { status: 'upcoming', color: 'default', text: `${diffDays} ימים` };
    return { status: 'future', color: 'secondary', text: `${diffDays} ימים` };
  };

  // הורדת קובץ ICS עם כל המועדים שנבחרו
  const handleDownloadICS = () => {
    const chosenExams = examDates.filter(e => selectedExams.includes(e.id));
    if (!chosenExams.length) return;
    const events = chosenExams.map(exam => {
      const [y, m, d] = exam.exam_date.split("-");
      const [hour, minute] = exam.exam_time.split(":");
      const startDate = new Date(
        parseInt(y), parseInt(m)-1, parseInt(d),
        parseInt(hour), parseInt(minute), 0
      );
      const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
      return {
        title: `בחינת ${exam.exam_type} - ${courseName}`,
        description: `בחינת קורס ${courseName}${exam.location ? ' | מקום: ' + exam.location : ''}`,
        location: exam.location,
        startDate,
        endDate
      };
    });

    const icsContent = createICS({ events });

    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Exams-${courseName}.ics`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  };

  const handleToggleExam = (id: string) => {
    setSelectedExams(prev =>
      prev.includes(id)
        ? prev.filter(eid => eid !== id)
        : [...prev, id]
    );
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
      <DialogContent className="max-w-2xl w-full" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Calendar className="w-6 h-6 text-green-600" />
            בחר מועדי בחינה - {courseName}
          </DialogTitle>
          {courseCode && (
            <p className="text-muted-foreground">קוד קורס: {courseCode}</p>
          )}
        </DialogHeader>
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            ניתן לבחור כמה מועדים, להוריד אותם כקובץ יומן או לשמור ללוח השנה האישי.
          </div>
          <div className="grid gap-3">
            {isLoading ? (
              <div className="flex justify-center items-center h-20">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-300 border-t-transparent" />
              </div>
            ) : examDates.length === 0 ? (
              <div className="text-center text-gray-500 py-6">לא נמצאו מועדי בחינה לקורס זה.</div>
            ) : (
              examDates.map((exam) => {
                const dateStatus = getDateStatus(exam.exam_date);
                const isSelected = selectedExams.includes(exam.id);
                const [y, m, d] = exam.exam_date.split("-");
                const localDate = new Date(parseInt(y), parseInt(m)-1, parseInt(d));
                const dateString = localDate.toLocaleDateString('he-IL', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long'
                });
                return (
                  <Card
                    key={exam.id}
                    className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                      isSelected
                        ? 'ring-2 ring-green-500 bg-green-50'
                        : 'hover:bg-muted/50'
                    }`}
                    onClick={() => handleToggleExam(exam.id)}
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
                                <span className="font-medium">{dateString}</span>
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
              })
            )}
          </div>
          <div className="flex flex-wrap gap-2 justify-between pt-4">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
            >
              ביטול
            </Button>
            <Button
              onClick={() => {
                if (selectedExams.length) addToCalendarMutation.mutate(selectedExams);
              }}
              disabled={!selectedExams.length || addToCalendarMutation.isPending}
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
                  שמור ללוח השנה האישי
                </>
              )}
            </Button>
            {isMobile && (
              <Button
                onClick={handleDownloadICS}
                disabled={!selectedExams.length}
                className="bg-gradient-to-r from-blue-600 to-cyan-700 text-white"
              >
                📅 הורד ליומן
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddToCalendarButton;
