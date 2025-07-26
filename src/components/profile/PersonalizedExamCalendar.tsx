import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, BookOpen, Building } from 'lucide-react';
import { usePersonalizedExamCalendar } from '@/hooks/usePersonalizedExamCalendar';
import { format, parseISO } from 'date-fns';
import { he } from 'date-fns/locale';

const PersonalizedExamCalendar = () => {
  const { data: exams = [], isLoading } = usePersonalizedExamCalendar();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            יומן הבחינות שלי
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">טוען...</div>
        </CardContent>
      </Card>
    );
  }

  if (exams.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            יומן הבחינות שלי
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">
            אין בחינות קרובות עבור הקורסים השמורים שלך
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          יומן הבחינות שלי
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {exams.map((exam) => (
          <div 
            key={exam.id} 
            className="border rounded-lg p-4 hover:bg-muted/30 transition-colors"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h4 className="font-semibold text-right mb-1">
                  {exam.course_name}
                </h4>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <BookOpen className="w-4 h-4" />
                  <span>{exam.course_code}</span>
                  {exam.institution_name && (
                    <>
                      <Building className="w-4 h-4 mr-1" />
                      <span>{exam.institution_name}</span>
                    </>
                  )}
                </div>
              </div>
              <Badge variant="secondary" className="text-xs">
                {exam.exam_type}
              </Badge>
            </div>
            
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1 text-primary">
                <Calendar className="w-4 h-4" />
                <span className="font-medium">
                  {format(parseISO(exam.exam_date), 'dd/MM/yyyy', { locale: he })}
                </span>
              </div>
              {exam.exam_time && (
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{exam.exam_time}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default PersonalizedExamCalendar;