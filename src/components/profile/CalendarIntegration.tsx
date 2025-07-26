import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Calendar, Download, ExternalLink, Plus } from 'lucide-react';

interface CalendarIntegrationProps {
  userCourses: any[];
  upcomingExams: any[];
}

const CalendarIntegration: React.FC<CalendarIntegrationProps> = ({ userCourses, upcomingExams }) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const generateICalFile = async () => {
    setIsGenerating(true);
    
    try {
      // Generate iCal content
      let icalContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Bali Hofesh//Course Calendar//HE',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH'
      ];

      // Add exam events
      upcomingExams.forEach((exam, index) => {
        const examDate = new Date(exam.date);
        const examDateStr = examDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        
        icalContent.push(
          'BEGIN:VEVENT',
          `UID:exam-${exam.id}-${Date.now()}@bali-hofesh.com`,
          `DTSTART:${examDateStr}`,
          `DTEND:${examDateStr}`,
          `SUMMARY:בחינה - ${exam.type} - ${exam.courseId}`,
          `DESCRIPTION:בחינה במקצר ${exam.courseId}\\nמיקום: ${exam.location}\\nשעה: ${exam.time}`,
          `LOCATION:${exam.location}`,
          'STATUS:CONFIRMED',
          'BEGIN:VALARM',
          'TRIGGER:-PT24H',
          'ACTION:DISPLAY',
          'DESCRIPTION:תזכורת - בחינה מחר',
          'END:VALARM',
          'END:VEVENT'
        );
      });

      icalContent.push('END:VCALENDAR');

      // Create and download file
      const blob = new Blob([icalContent.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'my-courses-calendar.ics';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('קובץ היומן נוצר והורד בהצלחה');
    } catch (error) {
      toast.error('שגיאה ביצירת קובץ היומן');
    } finally {
      setIsGenerating(false);
    }
  };

  const addToGoogleCalendar = (exam: any) => {
    const examDate = new Date(exam.date);
    const startTime = examDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const endTime = new Date(examDate.getTime() + 3 * 60 * 60 * 1000).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    
    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`בחינה - ${exam.type}`)}&dates=${startTime}/${endTime}&details=${encodeURIComponent(`בחינה במקצר ${exam.courseId}\nמיקום: ${exam.location}\nשעה: ${exam.time}`)}&location=${encodeURIComponent(exam.location)}`;
    
    window.open(googleCalendarUrl, '_blank');
  };

  return (
    <Card className="bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-500" />
          אינטגרציה עם יומן
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-gray-600 mb-4">
          הוסף את מועדי הבחינות שלך ליומן האישי שלך
        </div>

        {/* Download iCal File */}
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-blue-900">הורד קובץ יומן</h3>
              <p className="text-sm text-blue-700">קובץ .ics לייבוא ליומן כלשהו</p>
            </div>
            <Button
              onClick={generateICalFile}
              disabled={isGenerating}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Download className="w-4 h-4 mr-2" />
              {isGenerating ? 'יוצר...' : 'הורד'}
            </Button>
          </div>
        </div>

        {/* Individual Exam Actions */}
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-900">הוסף בחינות בודדות</h3>
          {upcomingExams.length === 0 ? (
            <p className="text-gray-500 text-sm">אין בחינות קרובות להוספה</p>
          ) : (
            upcomingExams.slice(0, 3).map((exam, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{exam.type}</Badge>
                    <span className="font-medium">{exam.courseId}</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {new Date(exam.date).toLocaleDateString('he-IL')} • {exam.time}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => addToGoogleCalendar(exam)}
                  className="text-green-600 border-green-300 hover:bg-green-50"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Google Calendar
                </Button>
              </div>
            ))
          )}
        </div>

        {/* Integration Instructions */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-2">הוראות אינטגרציה</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• יומן Google: השתמש בכפתור "Google Calendar" ליד כל בחינה</li>
            <li>• יומן Outlook: הורד את קובץ ה-.ics וייבא אותו ב-Outlook</li>
            <li>• יומן iPhone: הורד את הקובץ ופתח אותו באייפון</li>
            <li>• יומן Android: השתמש ב-Google Calendar או הורד את הקובץ</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default CalendarIntegration;