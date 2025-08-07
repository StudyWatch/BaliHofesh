import React, { useEffect, useMemo, useRef, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Calendar,
  Download,
  Filter,
  Settings,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  Smartphone,
  Sparkles,
  Search,
  Share2,
  Copy,
  Clock,
  Info,
  X,
  PlusCircle
} from 'lucide-react';

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useCalendarEvents } from '@/hooks/useAdvancedCalendar';
import { useUserFavoriteCourses } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';
import QuickAddEventDialog from './QuickAddEventDialog';
import CalendarEventManager from './CalendarEventManager';

import tippy from 'tippy.js';
import 'tippy.js/dist/tippy.css';

/* ============================
   AdvancedCalendar – הגרסה הפרימיום
   מעוצב, קומפקטי, ונוח בטירוף
============================ */

interface AdvancedCalendarProps {
  userCourses?: any[];
  upcomingExams?: any[];
  className?: string;
}

/* גרסאות צבע לפי סוג אירוע */
const getColorByType = (type: string) => {
  if (type === 'exam') {
    return {
      bg: 'linear-gradient(90deg,#dc2626 0%,#f87171 100%)',
      darkBg: 'linear-gradient(90deg,#b91c1c 0%,#ef4444 100%)',
      border: '#991b1b',
      icon: '🎯',
      dot: '#ef4444'
    };
  }
  if (type === 'assignment') {
    return {
      bg: 'linear-gradient(90deg,#2563eb 0%,#60a5fa 100%)',
      darkBg: 'linear-gradient(90deg,#1d4ed8 0%,#3b82f6 100%)',
      border: '#1e40af',
      icon: '📝',
      dot: '#3b82f6'
    };
  }
  return {
    bg: 'linear-gradient(90deg,#6b7280 0%,#9ca3af 100%)',
    darkBg: 'linear-gradient(90deg,#52525b 0%,#9ca3af 100%)',
    border: '#374151',
    icon: 'ℹ️',
    dot: '#6b7280'
  };
};

/* צבעים שונים לקורסים (נקודה/מסגרת) */
const COURSE_COLORS = [
  '#7c3aed', '#10b981', '#f59e0b', '#3b82f6', '#ef4444',
  '#14b8a6', '#a855f7', '#f97316', '#22c55e', '#e11d48'
];
const getCourseColor = (code: string, map: Map<string, string>) =>
  map.get(code) || '#6b7280';

/* תצוגת טקסט אירוע – קצר במובייל, מלא בדסקטופ, כולל שעה אם רלוונטי */
const getEventDisplay = (event: any, isMobile: boolean) => {
  const { icon } = getColorByType(event.extendedProps?.type);
  const base = (event.title || '').trim();
  const time = extractTimeFromStart(event.start);
  const timeText = time ? ` • ${time}` : '';
  if (!base) return icon;
  if (isMobile) {
    const parts = base.split(' ');
    const short = parts[0]?.length > 12 ? parts[0].slice(0, 12) + '…' : parts[0];
    return `${icon} ${short}${timeText}`;
  }
  return `${icon} ${base}${timeText}`;
};

const extractTimeFromStart = (start: string) => {
  try {
    const d = new Date(start);
    if (isNaN(d as any)) return '';
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    // אם זה 09:00 בגלל דיפולט – נסתיר
    if (hh === '09' && mm === '00') return '';
    return `${hh}:${mm}`;
  } catch {
    return '';
  }
};

/* התחלת/סיום אירוע אם אין זמן */
const getEventTimes = (startDateString: string) => {
  const start = startDateString.includes('T')
    ? startDateString
    : `${startDateString}T09:00:00`;
  const date = start.split('T')[0];
  const end = `${date}T23:59:59`;
  return { start, end };
};

/* פורמט ל-ICS ב-UTC */
const toICS = (d: string) => {
  const date = new Date(d);
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    date.getUTCFullYear().toString() +
    pad(date.getUTCMonth() + 1) +
    pad(date.getUTCDate()) +
    'T' +
    pad(date.getUTCHours()) +
    pad(date.getUTCMinutes()) +
    pad(date.getUTCSeconds()) +
    'Z'
  );
};

/* חישוב "בעוד X ימים / היום / מחר" */
const humanDue = (start: string) => {
  const d = new Date(start);
  const now = new Date();
  const diff = Math.ceil((+d.setHours(0,0,0,0) - +now.setHours(0,0,0,0)) / (1000*60*60*24));
  if (diff === 0) return 'היום';
  if (diff === 1) return 'מחר';
  if (diff < 0) return `עבר לפני ${Math.abs(diff)} ימים`;
  return `בעוד ${diff} ימים`;
};

/* קיבוץ לרשימה: היום/מחר/השבוע/החודש/עתידי */
const bucketKey = (d: Date) => {
  const now = new Date();
  const today = new Date(now);
  const tomorrow = new Date(now); tomorrow.setDate(now.getDate() + 1);
  const endOfWeek = new Date(now); endOfWeek.setDate(now.getDate() + (6 - now.getDay()));
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const day = d.toDateString();
  if (day === today.toDateString()) return 'היום';
  if (day === tomorrow.toDateString()) return 'מחר';
  if (d <= endOfWeek) return 'השבוע';
  if (d <= endOfMonth) return 'החודש';
  return 'עתידי';
};

export const AdvancedCalendar = ({
  userCourses = [],
  upcomingExams = [],
  className
}: AdvancedCalendarProps) => {
  const { data: events = [], isLoading, refetch } = useCalendarEvents();
  const { data: favoriteCourses = [] } = useUserFavoriteCourses();

  const [currentView, setCurrentView] = useState<'dayGridMonth' | 'week' | 'list'>('dayGridMonth');
  const [showExams, setShowExams] = useState(true);
  const [showAssignments, setShowAssignments] = useState(true);
  const [managementOpen, setManagementOpen] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0);
  const [compact, setCompact] = useState<boolean>(() => (typeof window !== 'undefined' ? window.innerWidth < 640 : true));
  const [query, setQuery] = useState('');
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]); // ריק = הכל
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);

  const calendarRef = useRef<any>(null);
  const { toast } = useToast();

  /* צפיפות לפי גודל חלון */
  useEffect(() => {
    const handle = () => setCompact(window.innerWidth < 640);
    window.addEventListener('resize', handle);
    return () => window.removeEventListener('resize', handle);
  }, []);

  useEffect(() => {
    const api = calendarRef.current?.getApi?.();
    if (api) setTimeout(() => api.updateSize(), 90);
  }, [showAssignments, showExams, currentView, events, weekOffset, compact, query, selectedCourses]);

  /* מיפוי צבעים לקורסים */
  const courseColorMap = useMemo(() => {
    const map = new Map<string, string>();
    const list = favoriteCourses.map((c: any) => c.courses?.code || c.code).filter(Boolean);
    list.forEach((code, idx) => map.set(code, COURSE_COLORS[idx % COURSE_COLORS.length]));
    return map;
  }, [favoriteCourses]);

  /* רשימת קורסים לשורות */
  const coursesForComponents = useMemo(
    () =>
      favoriteCourses.map((course: any) => ({
        id: course.course_id || course.id,
        name_he: course.courses?.name_he || course.name_he,
        code: course.courses?.code || course.code
      })),
    [favoriteCourses]
  );

  /* סינון לפי סוג/חיפוש/קורס */
  const filteredBase = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (events || []).filter((e: any) => {
      if (e.extendedProps?.type === 'exam' && !showExams) return false;
      if (e.extendedProps?.type === 'assignment' && !showAssignments) return false;

      const code = (e.extendedProps?.courseCode || '').toString();
      if (selectedCourses.length && !selectedCourses.includes(code)) return false;

      if (!q) return true;
      const hay = `${e.title || ''} ${e.extendedProps?.description || ''} ${e.extendedProps?.courseName || ''} ${code}`.toLowerCase();
      return hay.includes(q);
    });
  }, [events, showExams, showAssignments, query, selectedCourses]);

  /* החלת שעות/שדות FullCalendar */
  const fixedEvents = useMemo(
    () =>
      filteredBase.map((e: any) => {
        const { start, end } = getEventTimes(e.start);
        return { ...e, start, end, allDay: false, display: 'block' };
      }),
    [filteredBase]
  );

  /* שבוע דינמי לתצוגת week */
  const weekStart = useMemo(() => {
    const now = new Date();
    const sunday = new Date(now.setDate(now.getDate() - now.getDay() + weekOffset * 7));
    sunday.setHours(0, 0, 0, 0);
    return sunday;
  }, [weekOffset]);

  const formatWeekRange = () => {
    const end = new Date(weekStart);
    end.setDate(end.getDate() + 6);
    return `${weekStart.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit' })} - ${end.toLocaleDateString('he-IL', {
      day: '2-digit',
      month: '2-digit'
    })}`;
  };

  /* פעולות */
  const handleAddEvent = (eventData: {
    title: string;
    type: 'exam' | 'assignment';
    date: string;
    time?: string;
    description?: string;
    courseId?: string;
  }) => {
    toast({ title: 'אירוע נוסף', description: `${eventData.type === 'exam' ? 'בחינה' : 'מטלה'} נוספה בהצלחה` });
    refetch?.();
  };
  const handleUpdateEvent = (_id: string, _updates: any) => {};
  const handleDeleteEvent = (_id: string) => {};
  const handleExportToPhone = (_event: any) => {};

  /* רשימה עתידית ממוינת + קיבוץ */
  const now = new Date();
  const sortedEvents = useMemo(
    () =>
      [...fixedEvents]
        .filter((e) => new Date(e.start) >= now)
        .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()),
    [fixedEvents, now]
  );
  const grouped = useMemo(() => {
    const g: Record<string, any[]> = {};
    sortedEvents.forEach((ev) => {
      const k = bucketKey(new Date(ev.start));
      (g[k] ||= []).push(ev);
    });
    return g;
  }, [sortedEvents]);

  /* יצוא לכלל האירועים */
  const exportAllToICS = () => {
    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'PRODID:-//StudyPlatform//Calendar//EN'
    ];

    fixedEvents.forEach((ev: any) => {
      lines.push(
        'BEGIN:VEVENT',
        `UID:${(ev.id || Math.random().toString(36).slice(2))}@studyplatform.com`,
        `DTSTART:${toICS(ev.start)}`,
        `DTEND:${toICS(ev.end)}`,
        `SUMMARY:${ev.title || ''}`,
        `DESCRIPTION:${ev.extendedProps?.description || ''}`,
        'END:VEVENT'
      );
    });

    lines.push('END:VCALENDAR');

    const blob = new Blob([lines.join('\n')], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'study-calendar.ics';
    a.click();
    URL.revokeObjectURL(url);

    toast({ title: 'יוצא בהצלחה', description: 'הלוח שנה יוצא לקובץ ICS' });
  };

  /* יצוא אירוע בודד + שיתוף */
  const exportEventICS = (ev: any) => {
    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'PRODID:-//StudyPlatform//Calendar//EN',
      'BEGIN:VEVENT',
      `UID:${(ev.id || Math.random().toString(36).slice(2))}@studyplatform.com`,
      `DTSTART:${toICS(ev.start)}`,
      `DTEND:${toICS(ev.end)}`,
      `SUMMARY:${ev.title || ''}`,
      `DESCRIPTION:${ev.extendedProps?.description || ''}`,
      'END:VEVENT',
      'END:VCALENDAR'
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(ev.title || 'event').replace(/\s+/g, '_')}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const shareEvent = async (ev: any) => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: ev.title || 'אירוע',
          text: ev.extendedProps?.description || '',
          url: window.location.href
        });
      } else {
        navigator.clipboard.writeText(`${ev.title}\n${ev.extendedProps?.description || ''}`);
        toast({ title: 'הועתק', description: 'פרטי האירוע הועתקו ללוח' });
      }
    } catch {}
  };

  /* פרטי אירוע */
  const openEventDetails = (ev: any) => {
    setSelectedEvent(ev);
    setDetailsOpen(true);
  };

  /* כותרת הקלף – דביקה + בוררים */
  return (
    <>
      <Card className={`w-full ${className || ''}`} dir="rtl">
        <CardHeader className="pb-2 sticky top-0 z-[5] bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 rounded-t-2xl">
          <div className="flex flex-col gap-2">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Calendar className="w-5 h-5" />
                לוח השנה האישי שלי
                <span className="hidden sm:inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
                  <Sparkles className="w-4 h-4" /> מעוצב לסטודנטים – מובייל על אמת
                </span>
              </CardTitle>

              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 justify-start sm:justify-end">
                <QuickAddEventDialog onAddEvent={handleAddEvent} courses={coursesForComponents} />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCompact((v) => !v)}
                  className="flex items-center gap-1 h-8 text-xs px-2"
                  title="צפיפות תצוגה"
                >
                  <Smartphone className="w-4 h-4" />
                  {compact ? 'מרווח' : 'קומפקטי'}
                </Button>
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

            {/* חיפוש + סינון */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    className="w-full rounded-lg border border-border bg-background px-8 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-400"
                    placeholder="חפש אירוע / קורס / תיאור…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                  {query && (
                    <button
                      className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                      onClick={() => setQuery('')}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="hidden sm:flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  <Badge
                    variant={showExams ? 'default' : 'outline'}
                    className="cursor-pointer px-2 py-1 rounded"
                    onClick={() => setShowExams((v) => !v)}
                  >
                    🎯 בחינות
                  </Badge>
                  <Badge
                    variant={showAssignments ? 'default' : 'outline'}
                    className="cursor-pointer px-2 py-1 rounded"
                    onClick={() => setShowAssignments((v) => !v)}
                  >
                    📝 מטלות
                  </Badge>
                </div>
              </div>

              {/* צ’יפים לפי קורס – נגלל במובייל */}
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                <span className="text-xs text-muted-foreground whitespace-nowrap">קורסים:</span>
                <Badge
                  variant={selectedCourses.length === 0 ? 'default' : 'outline'}
                  className="cursor-pointer whitespace-nowrap"
                  onClick={() => setSelectedCourses([])}
                >
                  הכל
                </Badge>
                {coursesForComponents.map((c, idx) => {
                  const active = selectedCourses.includes(c.code);
                  const color = getCourseColor(c.code, courseColorMap);
                  return (
                    <button
                      key={c.id || idx}
                      className={`px-2 py-1 rounded-full text-xs border whitespace-nowrap ${active ? 'text-white' : ''}`}
                      style={{
                        background: active ? color : 'transparent',
                        borderColor: color
                      }}
                      onClick={() =>
                        setSelectedCourses((prev) =>
                          prev.includes(c.code) ? prev.filter((x) => x !== c.code) : [...prev, c.code]
                        )
                      }
                      title={c.name_he || c.code}
                    >
                      {c.code}
                    </button>
                  );
                })}
                <div className="sm:hidden flex items-center gap-2 ml-auto">
                  <Filter className="w-4 h-4" />
                  <Badge
                    variant={showExams ? 'default' : 'outline'}
                    className="cursor-pointer px-2 py-1 rounded"
                    onClick={() => setShowExams((v) => !v)}
                  >
                    🎯
                  </Badge>
                  <Badge
                    variant={showAssignments ? 'default' : 'outline'}
                    className="cursor-pointer px-2 py-1 rounded"
                    onClick={() => setShowAssignments((v) => !v)}
                  >
                    📝
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <Tabs
            defaultValue="month"
            className="w-full"
            onValueChange={(v) =>
              setCurrentView(v === 'month' ? 'dayGridMonth' : (v as 'week' | 'list'))
            }
          >
            <TabsList className="w-full flex gap-2 my-3 justify-center sm:justify-end overflow-x-auto no-scrollbar">
              <TabsTrigger value="month" className="whitespace-nowrap">חודש</TabsTrigger>
              <TabsTrigger value="week" className="whitespace-nowrap">שבוע</TabsTrigger>
              <TabsTrigger value="list" className="whitespace-nowrap">רשימה</TabsTrigger>
            </TabsList>

            {/* ===== MONTH ===== */}
            <TabsContent value="month" className="mt-0">
              <div className="calendar-wrapper rounded-xl border border-border/70 overflow-hidden" style={{ direction: 'ltr' }}>
                <FullCalendar
                  ref={calendarRef}
                  plugins={[dayGridPlugin, timeGridPlugin, listPlugin]}
                  initialView="dayGridMonth"
                  headerToolbar={{ left: 'prev,next today', center: 'title', right: '' }}
                  locale="he"
                  direction="rtl"
                  height="auto"
                  dayMaxEvents={compact ? 2 : 3}
                  eventDisplay="block"
                  displayEventTime={false}
                  nextDayThreshold="00:00:01"
                  events={fixedEvents}
                  eventClassNames="calendar-event"
                  eventClick={(info) => {
                    info.jsEvent.preventDefault();
                    openEventDetails(info.event);
                  }}
                  eventDidMount={(info) => {
                    const isMobile = window.innerWidth < 640 || compact;
                    const { bg, darkBg, border } = getColorByType(info.event.extendedProps?.type);
                    const courseCode = info.event.extendedProps?.courseCode || '';
                    const cColor = getCourseColor(courseCode, courseColorMap);

                    info.el.style.background =
                      document.documentElement.classList.contains('dark') ? darkBg : bg;
                    info.el.style.color = '#fff';
                    info.el.style.border = `2.5px solid ${border}`;
                    info.el.style.boxShadow = `inset 0 0 0 3px ${cColor}, 0 3px 16px 0 rgba(0,0,0,.06)`;
                    info.el.style.padding = isMobile ? '2px 6px' : '5px 12px';
                    info.el.style.borderRadius = isMobile ? '10px' : '12px';
                    info.el.style.display = 'flex';
                    info.el.style.alignItems = 'center';
                    info.el.style.justifyContent = 'center';
                    info.el.style.fontWeight = '800';
                    info.el.style.fontSize = isMobile ? '11.5px' : '14.5px';
                    info.el.style.overflow = 'hidden';

                    const label = getEventDisplay(info.event, isMobile);
                    info.el.innerHTML = '';
                    const txtNode = document.createElement('div');
                    txtNode.textContent = label;
                    txtNode.style.flex = '1';
                    txtNode.style.overflow = 'hidden';
                    txtNode.style.textOverflow = 'ellipsis';
                    txtNode.style.whiteSpace = 'nowrap';
                    info.el.appendChild(txtNode);

                    const { icon } = getColorByType(info.event.extendedProps?.type);
                    tippy(info.el, {
                      content: `
                        <div style="direction:rtl;max-width:260px">
                          <div style="font-size:18px;font-weight:800;margin-bottom:6px">${icon} ${info.event.title}</div>
                          ${
                            info.event.extendedProps?.courseName
                              ? `<div style="font-size:14px"><b>${info.event.extendedProps.courseName}</b>${
                                  info.event.extendedProps?.courseCode ? ` • ${info.event.extendedProps.courseCode}` : ''
                                }</div>`
                              : ''
                          }
                          <div style="font-size:12px;margin-top:6px;opacity:.9">${info.event.extendedProps?.description || '—'}</div>
                        </div>
                      `,
                      allowHTML: true,
                      placement: isMobile ? 'auto' : 'top',
                      theme: 'light-border',
                      trigger: isMobile ? 'click' : 'mouseenter focus',
                      interactive: true,
                      appendTo: document.body,
                      maxWidth: 320
                    });
                  }}
                  viewDidMount={() => setCurrentView('dayGridMonth')}
                  allDaySlot={false}
                />
              </div>
            </TabsContent>

            {/* ===== WEEK ===== */}
            <TabsContent value="week" className="mt-0">
              <div className="w-full px-1 sm:px-2 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <Button size="sm" variant="outline" onClick={() => setWeekOffset((o) => o - 1)}>
                    <ChevronRight className="w-4 h-4" /> שבוע קודם
                  </Button>
                  <div className="text-sm font-semibold text-muted-foreground text-center flex-1">
                    {formatWeekRange()}
                  </div>
                  <Button size="sm" variant="outline" onClick={() => setWeekOffset((o) => o + 1)}>
                    שבוע הבא <ChevronLeft className="w-4 h-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
                  {Array.from({ length: 7 }).map((_, dayIndex) => {
                    const dayDate = new Date(weekStart);
                    dayDate.setDate(dayDate.getDate() + dayIndex);

                    const dayEvents = fixedEvents.filter((event) => {
                      const start = new Date(event.start);
                      return (
                        start.getFullYear() === dayDate.getFullYear() &&
                        start.getMonth() === dayDate.getMonth() &&
                        start.getDate() === dayDate.getDate()
                      );
                    });

                    const today = new Date().toDateString() === dayDate.toDateString();

                    return (
                      <div
                        key={dayIndex}
                        className={`bg-muted/20 p-3 rounded-xl shadow-sm border border-border flex flex-col ${
                          compact ? 'min-h-[84px]' : 'min-h-[140px]'
                        } ${today ? 'ring-2 ring-indigo-300' : ''}`}
                      >
                        <div className="text-sm font-semibold text-muted-foreground mb-2 text-right sm:text-center">
                          {dayDate.toLocaleDateString('he-IL', {
                            weekday: 'long',
                            day: '2-digit',
                            month: '2-digit'
                          })}
                        </div>

                        {dayEvents.length > 0 ? (
                          <div className="flex flex-col gap-2">
                            {dayEvents.map((event, i) => {
                              const { icon, dot } = getColorByType(event.extendedProps?.type);
                              const tooltip = `
                                <div style="direction:rtl;max-width:240px">
                                  <div style="font-size:15px;font-weight:800;margin-bottom:4px">${icon} ${event.title}</div>
                                  ${
                                    event.extendedProps?.courseName
                                      ? `<div style="font-size:13px"><b>${event.extendedProps.courseName}</b>${
                                          event.extendedProps?.courseCode ? ` • ${event.extendedProps.courseCode}` : ''
                                        }</div>`
                                      : ''
                                  }
                                  <div style="font-size:12px;margin-top:4px">${event.extendedProps?.description || '—'}</div>
                                </div>
                              `;
                              const time = extractTimeFromStart(event.start);
                              return (
                                <div
                                  key={event.id || `${dayIndex}-${i}`}
                                  className={`bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 ${
                                    compact ? 'text-[11.5px] p-2' : 'text-xs p-2.5'
                                  } rounded-lg shadow-sm hover:shadow-md transition cursor-pointer`}
                                  onClick={() => openEventDetails(event)}
                                  ref={(el) => {
                                    if (el) {
                                      tippy(el, {
                                        content: tooltip,
                                        allowHTML: true,
                                        placement: 'top',
                                        theme: 'light-border',
                                        interactive: true,
                                        trigger: 'mouseenter',
                                        appendTo: document.body
                                      });
                                    }
                                  }}
                                >
                                  <div className="font-bold truncate flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full inline-block" style={{ background: dot }} />
                                    {icon} {event.title.split(' ')[0]}
                                    {time && <span className="text-[11px] text-indigo-600">• {time}</span>}
                                  </div>
                                  <div className="text-muted-foreground truncate">
                                    {event.extendedProps?.courseCode || ''}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="text-xs text-muted-foreground italic text-center">אין אירועים</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </TabsContent>

            {/* ===== LIST (עם קיבוץ חכם) ===== */}
            <TabsContent value="list" className="mt-0">
              <div className="flex flex-col gap-3 max-h-[68vh] overflow-y-auto p-1 sm:p-2">
                {Object.keys(grouped).length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">אין אירועים עתידיים</h3>
                    <p className="mb-4">הוסף קורסים ומטלות כדי לראות אותם כאן</p>
                    <QuickAddEventDialog onAddEvent={handleAddEvent} courses={coursesForComponents} />
                  </div>
                ) : (
                  ['היום', 'מחר', 'השבוע', 'החודש', 'עתידי']
                    .filter((k) => grouped[k]?.length)
                    .map((k) => (
                      <div key={k} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-bold text-muted-foreground">{k}</h4>
                          <span className="text-xs text-muted-foreground">{grouped[k].length} אירועים</span>
                        </div>
                        {grouped[k].map((event: any, idx: number) => {
                          const { icon, dot } = getColorByType(event.extendedProps?.type);
                          const course = event.extendedProps?.courseCode || '';
                          const due = new Date(event.start);
                          return (
                            <div
                              key={event.id || `${k}-${idx}`}
                              className="flex flex-col sm:flex-row items-start sm:items-center gap-2 bg-gradient-to-l from-indigo-50 via-white to-white dark:from-zinc-800 dark:via-zinc-900 border border-indigo-100 dark:border-zinc-700 rounded-xl p-3 shadow-sm hover:shadow-md transition"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="w-2.5 h-2.5 rounded-full" style={{ background: dot }} />
                                <span className="text-lg">{icon}</span>
                                <span className="font-semibold truncate">{event.title}</span>
                                {course && (
                                  <Badge className="bg-indigo-600 text-white text-[11px] font-bold ml-1">
                                    {course}
                                  </Badge>
                                )}
                              </div>
                              <div className="flex-1 text-xs text-muted-foreground min-w-0 truncate">
                                {event.extendedProps?.description || '—'}
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="flex items-center gap-1 text-xs text-gray-500 font-bold whitespace-nowrap">
                                  <Clock className="w-4 h-4" />
                                  {due.toLocaleDateString('he-IL', { year: '2-digit', month: '2-digit', day: '2-digit' })}
                                  <span className="mx-1">•</span>
                                  {humanDue(event.start)}
                                </span>
                                <Button size="sm" variant="outline" className="h-8 px-2" onClick={() => exportEventICS(event)}>
                                  <Download className="w-4 h-4" />
                                </Button>
                                <Button size="sm" variant="outline" className="h-8 px-2" onClick={() => shareEvent(event)}>
                                  <Share2 className="w-4 h-4" />
                                </Button>
                                <Button size="sm" className="h-8 px-2" onClick={() => openEventDetails(event)}>
                                  <Info className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ))
                )}
              </div>
            </TabsContent>
          </Tabs>

          {/* אגדה + כפתור הוספה */}
          <div className="mt-5 p-3 sm:p-4 bg-muted/30 rounded-lg flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold">מקרא</h4>
              <QuickAddEventDialog
                onAddEvent={handleAddEvent}
                courses={coursesForComponents}
                trigger={
                  <Button className="h-9 gap-1">
                    <PlusCircle className="w-4 h-4" />
                    הוסף אירוע
                  </Button>
                }
              />
            </div>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded" style={{ background: getColorByType('exam').dot }} />
                <span className="text-sm">בחינות</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded" style={{ background: getColorByType('assignment').dot }} />
                <span className="text-sm">מטלות</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ניהול אירועים וייצוא */}
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
                    <Button onClick={exportAllToICS} className="flex items-center gap-2 h-10 text-xs">
                      <Download className="w-5 h-5" />
                      ייצא הכל לקובץ ICS
                    </Button>
                    <Button
                      variant="outline"
                      className="flex items-center gap-2 h-10 text-xs"
                      onClick={() => {
                        const url = `${window.location.origin}/calendar/share`;
                        navigator.clipboard.writeText(url);
                        toast({ title: 'הועתק בהצלחה', description: 'קישור הלוח שנה הועתק ללוח' });
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
                      <li>• במחשב: לחץ פעמיים על הקובץ להוספה</li>
                      <li>• בטלפון: שלח לעצמך במייל ולחץ על הקובץ</li>
                      <li>• השינויים לא מתעדכנים אוטומטית – ייצא מחדש לאחר עדכונים</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* פרטי אירוע – חלון יפהפה */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Info className="w-5 h-5" />
              פרטי אירוע
            </DialogTitle>
          </DialogHeader>
          {selectedEvent ? (
            <div className="space-y-3">
              <div className="text-lg font-bold flex items-center gap-2">
                {getColorByType(selectedEvent.extendedProps?.type).icon} {selectedEvent.title}
              </div>
              <div className="text-sm text-muted-foreground">
                <b>מתי:</b>{' '}
                {new Date(selectedEvent.start).toLocaleString('he-IL', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit'
                })}{' '}
                ({humanDue(selectedEvent.start)})
              </div>
              {(selectedEvent.extendedProps?.courseName || selectedEvent.extendedProps?.courseCode) && (
                <div className="text-sm text-muted-foreground">
                  <b>קורס:</b> {selectedEvent.extendedProps?.courseName || ''}{' '}
                  <Badge variant="secondary" className="ml-1">
                    {selectedEvent.extendedProps?.courseCode || ''}
                  </Badge>
                </div>
              )}
              <div className="text-sm">
                <b>תיאור:</b> {selectedEvent.extendedProps?.description || '—'}
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                <Button size="sm" className="h-9" onClick={() => exportEventICS(selectedEvent)}>
                  <Download className="w-4 h-4 mr-1" />
                  ייצוא ל־ICS
                </Button>
                <Button size="sm" variant="outline" className="h-9" onClick={() => shareEvent(selectedEvent)}>
                  <Share2 className="w-4 h-4 mr-1" />
                  שיתוף
                </Button>
                <Button size="sm" variant="outline" className="h-9" onClick={() => setManagementOpen(true)}>
                  <Settings className="w-4 h-4 mr-1" />
                  עריכה / מחיקה
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* CSS מלא ל-FullCalendar + נייד קומפקטי + כהה */}
      <style>{`
        .no-scrollbar::-webkit-scrollbar{display:none}
        .no-scrollbar{-ms-overflow-style:none;scrollbar-width:none}

        .calendar-wrapper { overflow-x: auto; }
        .fc-theme-standard td, .fc-theme-standard th { border-color: rgba(0,0,0,.06) !important; }
        .dark .fc-theme-standard td, .dark .fc-theme-standard th { border-color: rgba(255,255,255,.08) !important; }

        .fc .fc-toolbar-title { font-size: 1.05rem; font-weight: 800; letter-spacing: .2px; }
        .fc .fc-button { border-radius: 8px !important; padding: .45rem .75rem !important; font-size: .85rem !important; height: 34px !important; }
        .fc .fc-button-group { gap: .25rem; }
        .fc .fc-daygrid-day-number { font-weight: 700; }

        .fc .fc-daygrid-day.fc-day-today .fc-daygrid-day-frame { background: rgba(255,225,167,.35) !important; }
        .dark .fc .fc-daygrid-day.fc-day-today .fc-daygrid-day-frame { background: rgba(255,225,167,.18) !important; }

        .fc-event { 
          border-radius: 12px !important;
          font-size: 14px !important;
          font-weight: 800 !important;
          border-width: 2.5px !important;
          margin: 3px 0 !important;
          min-height: 28px !important;
          transition: box-shadow .15s, transform .06s;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          overflow: hidden;
          padding: 5px 12px !important;
        }
        .fc-event:hover { box-shadow: 0 8px 26px rgba(24,24,27,.14) !important; transform: translateY(-1px) }
        .fc-timegrid-event { border-radius: 12px !important; background: #eef2ff !important; color: #111 !important; }
        .fc-timegrid-slot { background: #f8fafc !important; border-top: 1px solid #e0e7ef !important; }

        .fc .fc-scrollgrid-section-header > th { background: #f8fafc !important; border-bottom: 2px solid #e0e7ef !important; }
        .dark .fc .fc-scrollgrid-section-header > th { background: #0f0f10 !important; border-bottom: 1px solid rgba(255,255,255,.08) !important; }

        /* מובייל קומפקטי */
        @media (max-width: 640px) {
          .fc .fc-toolbar { flex-direction: column; align-items: center; gap: .25rem; }
          .fc .fc-toolbar-title { font-size: .95rem !important; font-weight: 800; }
          .fc .fc-button { font-size: .75rem !important; padding: .25rem .5rem !important; height: 28px !important; }
          .fc .fc-button-group { flex-wrap: wrap; justify-content: center; gap: .2rem; }
          .fc .fc-daygrid-day-number { font-size: .8rem; }
          .fc-event { font-size: 11.5px !important; padding: 2px 6px !important; min-height: 22px !important; border-radius: 10px !important; }
          .fc-list-table td, .fc-list-table th { font-size: 12px !important; padding: 4px 6px !important; }
          .fc-list-event-title { font-size: 13px !important; font-weight: 700; }
        }
      `}</style>
    </>
  );
};

export default AdvancedCalendar;
