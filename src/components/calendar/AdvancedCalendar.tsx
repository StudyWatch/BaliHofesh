import React, { useState, useRef, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Download, Filter, Settings, ExternalLink } from 'lucide-react';
import { useCalendarEvents } from '@/hooks/useAdvancedCalendar';
import { useUserFavoriteCourses } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';
import QuickAddEventDialog from './QuickAddEventDialog';
import CalendarEventManager from './CalendarEventManager';
import tippy from 'tippy.js';
import 'tippy.js/dist/tippy.css';

interface AdvancedCalendarProps {
  userCourses?: any[];
  upcomingExams?: any[];
  className?: string;
}

const getColorByType = (type: string) => {
  if (type === 'exam') {
    return {
      bg: 'linear-gradient(90deg,#dc2626 0%,#f87171 100%)',
      border: '#991b1b',
      icon: '🎯'
    };
  }
  if (type === 'assignment') {
    return {
      bg: 'linear-gradient(90deg,#2563eb 0%,#60a5fa 100%)',
      border: '#1e40af',
      icon: '📝'
    };
  }
  return {
    bg: '#6b7280',
    border: '#374151',
    icon: 'ℹ️'
  };
};

const getEventDisplay = (event, isMobile: boolean) => {
  let { icon } = getColorByType(event.extendedProps.type);
  let course = event.extendedProps.courseCode || '';
  let base = event.title.replace(course, '').replace(':', '').trim();
  if (isMobile) {
    return `${icon} ${course}`;
  }
  return `${icon} ${course}: ${base}`;
};

const getEventTimes = (startDateString: string) => {
  // דואג שכל אירוע יוצג יום אחד בלבד (ולא יגלוש)
  const start = startDateString.includes('T')
    ? startDateString
    : `${startDateString}T09:00:00`; // שעה דיפולטיבית
  const date = start.split('T')[0];
  const end = `${date}T23:59:59`; // תמיד באותו יום
  return { start, end };
};

export const AdvancedCalendar = ({
  userCourses = [],
  upcomingExams = [],
  className
}: AdvancedCalendarProps) => {
  const { data: events = [], isLoading, refetch } = useCalendarEvents();
  const { data: favoriteCourses = [] } = useUserFavoriteCourses();
  const [currentView, setCurrentView] = useState('dayGridMonth');
  const [showExams, setShowExams] = useState(true);
  const [showAssignments, setShowAssignments] = useState(true);
  const [managementOpen, setManagementOpen] = useState(false);
  const { toast } = useToast();
  const calendarRef = useRef<any>(null);

  // רענון גודל הלוח + רפרש יזום תמיד כשעולים מהדף
  useEffect(() => {
    setTimeout(() => {
      calendarRef.current?.getApi?.().updateSize();
    }, 120);
  }, [showAssignments, showExams, currentView, events]);

  const coursesForComponents = favoriteCourses.map((course: any) => ({
    id: course.course_id || course.id,
    name_he: course.courses?.name_he || course.name_he,
    code: course.courses?.code || course.code
  }));

  const filteredEvents = events.filter(event => {
    if (event.extendedProps.type === 'exam' && !showExams) return false;
    if (event.extendedProps.type === 'assignment' && !showAssignments) return false;
    return true;
  });

  // כל אירוע מוגדר כ-single-day (לא גולש!)
  const fixedEvents = filteredEvents.map(event => {
    const { start, end } = getEventTimes(event.start);
    return {
      ...event,
      start,
      end,
      allDay: false,
      display: 'block'
    };
  });

  const handleAddEvent = (eventData: {
    title: string;
    type: 'exam' | 'assignment';
    date: string;
    time?: string;
    description?: string;
    courseId?: string;
  }) => {
    toast({
      title: "אירוע נוסף",
      description: `${eventData.type === 'exam' ? 'בחינה' : 'מטלה'} נוספה בהצלחה`
    });
    refetch?.();
  };

  const handleUpdateEvent = (id: string, updates: any) => {};
  const handleDeleteEvent = (id: string) => {};
  const handleExportToPhone = (event: any) => {};

  const exportAllToICS = () => {
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//StudyPlatform//Calendar//EN',
      ...fixedEvents.map(event => [
        'BEGIN:VEVENT',
        `UID:${event.id}@studyplatform.com`,
        `DTSTART:${event.start.replace(/[-:]/g, '').replace('T', 'T').replace('Z', '')}`,
        `DTEND:${event.end.replace(/[-:]/g, '').replace('T', 'T').replace('Z', '')}`,
        `SUMMARY:${event.title}`,
        `DESCRIPTION:${event.extendedProps.description || ''}`,
        'END:VEVENT'
      ]).flat(),
      'END:VCALENDAR'
    ].join('\n');

    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'study-calendar.ics';
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "יוצא בהצלחה",
      description: "הלוח שנה יוצא לקובץ ICS"
    });
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            לוח שנה מתקדם
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>טוען לוח שנה...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className={`w-full ${className || ''}`} dir="rtl">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Calendar className="w-5 h-5" />
              לוח השנה האישי שלי
            </CardTitle>
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 justify-start sm:justify-end">
              <QuickAddEventDialog 
                onAddEvent={handleAddEvent}
                courses={coursesForComponents}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setManagementOpen(true)}
                className="flex items-center gap-1 h-8 text-xs px-2"
              >
                <Settings className="w-4 h-4" />
                ניהול
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={exportAllToICS}
                className="flex items-center gap-1 h-8 text-xs px-2"
              >
                <Download className="w-4 h-4" />
                ייצא הכל
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-3 sm:mt-4 items-center text-xs">
            <Filter className="w-4 h-4" />
            <span className="font-medium">סינון:</span>
            <Badge
              variant={showExams ? "default" : "outline"}
              className="cursor-pointer px-2 py-1 rounded"
              onClick={() => setShowExams(!showExams)}
            >
              🎯 בחינות
            </Badge>
            <Badge
              variant={showAssignments ? "default" : "outline"}
              className="cursor-pointer px-2 py-1 rounded"
              onClick={() => setShowAssignments(!showAssignments)}
            >
              📝 עבודות הגשה
            </Badge>
            <span className="text-muted-foreground ml-auto">
              ({fixedEvents.length} אירועים)
            </span>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="calendar-wrapper" style={{ direction: 'ltr' }}>
            <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin, timeGridPlugin, listPlugin]}
              initialView={currentView}
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,listWeek'
              }}
              locale="he"
              direction="rtl"
              events={fixedEvents}
              height="auto"
              eventClassNames="calendar-event"
              nextDayThreshold="00:00:01"
              eventDisplay="block"
              displayEventTime={false}
              dayMaxEvents={4}
              eventDidMount={(info) => {
                let { bg, border, icon } = getColorByType(info.event.extendedProps.type);
                const isMobile = window.innerWidth < 640;
                let eventText = getEventDisplay(info.event, isMobile);

                info.el.style.background = bg;
                info.el.style.color = '#fff';
                info.el.style.border = `2.5px solid ${border}`;
                info.el.style.boxShadow = '0 3px 16px 0 #f3f4f6';
                info.el.style.padding = isMobile ? '2px 5px' : '4.5px 14px';
                info.el.style.borderRadius = '12px';
                info.el.style.display = 'flex';
                info.el.style.alignItems = 'center';
                info.el.style.justifyContent = 'center';
                info.el.style.fontWeight = '700';
                info.el.style.fontSize = isMobile ? '11.5px' : '14.5px';
                info.el.innerHTML = '';
                const txtNode = document.createElement('div');
                txtNode.textContent = eventText;
                txtNode.style.flex = '1';
                txtNode.style.overflow = 'hidden';
                txtNode.style.textOverflow = 'ellipsis';
                txtNode.style.whiteSpace = 'nowrap';
                info.el.appendChild(txtNode);

                tippy(info.el, {
                  content: `
                    <div style="direction:rtl;max-width:240px">
                      <div style="font-size:18px;font-weight:700;margin-bottom:6px">${icon} ${info.event.title}</div>
                      <div style="font-size:15px"><b>${info.event.extendedProps.courseName || ''}</b></div>
                      <div style="font-size:13px;margin-top:4px">${info.event.extendedProps.description || '—'}</div>
                    </div>
                  `,
                  allowHTML: true,
                  placement: 'top',
                  theme: 'light-border',
                  trigger: isMobile ? 'click' : 'mouseenter focus',
                  interactive: true
                });
              }}
              viewDidMount={(info) => setCurrentView(info.view.type)}
              allDaySlot={false}
              slotMinTime="07:00:00"
              slotMaxTime="22:00:00"
              businessHours={{
                daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
                startTime: '08:00',
                endTime: '20:00'
              }}
              dayCellClassNames={({ date }) => {
                const today = new Date();
                if (
                  date.getFullYear() === today.getFullYear() &&
                  date.getMonth() === today.getMonth() &&
                  date.getDate() === today.getDate()
                ) {
                  return ['fc-today-highlight'];
                }
                return [];
              }}
            />
          </div>
          
          {fixedEvents.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">אין אירועים בלוח השנה</h3>
              <p className="mb-4">הוסף קורסים למעקב וסמן מועדי בחינה כדי לראות אותם כאן</p>
              <QuickAddEventDialog 
                onAddEvent={handleAddEvent}
                courses={coursesForComponents}
              />
            </div>
          )}
          
          {/* Legend */}
          <div className="mt-6 p-4 bg-muted/30 rounded-lg">
            <h4 className="font-semibold mb-3">מקרא:</h4>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-500 rounded"></div>
                <span className="text-sm">בחינות</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-500 rounded"></div>
                <span className="text-sm">עבודות הגשה</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={managementOpen} onOpenChange={setManagementOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              ניהול לוח שנה מתקדם
            </DialogTitle>
          </DialogHeader>
          
          <Tabs defaultValue="events" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="events">ניהול אירועים</TabsTrigger>
              <TabsTrigger value="export">ייצוא ושיתוף</TabsTrigger>
            </TabsList>
            
            <TabsContent value="events" className="space-y-4">
              <CalendarEventManager
                events={fixedEvents}
                onUpdateEvent={handleUpdateEvent}
                onDeleteEvent={handleDeleteEvent}
                onExportToPhone={handleExportToPhone}
                userCourses={coursesForComponents}
              />
            </TabsContent>
            
            <TabsContent value="export" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ExternalLink className="w-5 h-5" />
                    אפשרויות ייצוא ושיתוף
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button
                      onClick={exportAllToICS}
                      className="flex items-center gap-2 h-10 text-xs"
                    >
                      <Download className="w-5 h-5" />
                      ייצא הכל לקובץ ICS
                    </Button>
                    
                    <Button
                      variant="outline"
                      className="flex items-center gap-2 h-10 text-xs"
                      onClick={() => {
                        const url = `${window.location.origin}/calendar/share`;
                        navigator.clipboard.writeText(url);
                        toast({
                          title: "הועתק בהצלחה",
                          description: "קישור הלוח שנה הועתק ללוח"
                        });
                      }}
                    >
                      <ExternalLink className="w-5 h-5" />
                      העתק קישור שיתוף
                    </Button>
                  </div>
                  
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <h4 className="font-semibold mb-2">הוראות שימוש:</h4>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>• קובץ ICS ניתן לייבוא לכל יומן (Google, Outlook, Apple)</li>
                      <li>• לחץ פעמיים על קובץ ICS במחשב להוספה אוטומטית</li>
                      <li>• בטלפון - שלח לעצמך במייל ולחץ על הקובץ</li>
                      <li>• השינויים לא יתעדכנו אוטומטית - יש לייצא מחדש</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <style>{`
        .fc-event {
          border-radius: 12px !important;
          font-size: 14px !important;
          font-weight: 700 !important;
          border-width: 2.5px !important;
          margin: 3px 0 !important;
          min-height: 29px !important;
          transition: box-shadow 0.15s;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          background: linear-gradient(90deg, #dc2626 0%, #f
        .fc-event {
          border-radius: 12px !important;
          font-size: 14px !important;
          font-weight: 700 !important;
          border-width: 2.5px !important;
          margin: 3px 0 !important;
          min-height: 29px !important;
          transition: box-shadow 0.15s;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          overflow: hidden;
        }

        .fc-today-highlight {
          background-color: #fef3c7 !important;
        }

        .calendar-wrapper {
          overflow-x: auto;
        }

        .fc .fc-daygrid-day-number {
          font-weight: 600;
        }

        .fc .fc-toolbar-title {
          font-size: 1.1rem;
          font-weight: bold;
        }

        .fc .fc-button {
          border-radius: 6px !important;
          padding: 0.4rem 0.75rem !important;
        }
      `}</style>
    </>
  );
};

export default AdvancedCalendar;
