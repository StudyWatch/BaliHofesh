
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  Calendar, 
  Clock, 
  Edit, 
  Trash2, 
  Download, 
  ExternalLink,
  BookOpen,
  Target,
  FileText,
  Plus
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { he } from 'date-fns/locale';

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end?: string;
  extendedProps: {
    type: 'exam' | 'assignment';
    courseCode?: string;
    courseName?: string;
    description?: string;
  };
}

interface CalendarEventManagerProps {
  events: CalendarEvent[];
  onUpdateEvent: (id: string, updates: Partial<CalendarEvent>) => void;
  onDeleteEvent: (id: string) => void;
  onExportToPhone: (event: CalendarEvent) => void;
  userCourses?: Array<{ id: string; name_he: string; code: string }>;
}

const CalendarEventManager = ({ 
  events, 
  onUpdateEvent, 
  onDeleteEvent, 
  onExportToPhone,
  userCourses = []
}: CalendarEventManagerProps) => {
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [editForm, setEditForm] = useState({
    title: '',
    date: '',
    time: '',
    description: '',
    type: 'exam' as 'exam' | 'assignment'
  });
  const { toast } = useToast();

  const handleEditStart = (event: CalendarEvent) => {
    setEditingEvent(event);
    const eventDate = new Date(event.start);
    setEditForm({
      title: event.title,
      date: format(eventDate, 'yyyy-MM-dd'),
      time: format(eventDate, 'HH:mm'),
      description: event.extendedProps.description || '',
      type: event.extendedProps.type
    });
  };

  const handleEditSave = () => {
    if (!editingEvent) return;

    const updatedStart = editForm.time 
      ? `${editForm.date}T${editForm.time}`
      : editForm.date;

    onUpdateEvent(editingEvent.id, {
      title: editForm.title,
      start: updatedStart,
      extendedProps: {
        ...editingEvent.extendedProps,
        type: editForm.type,
        description: editForm.description
      }
    });

    setEditingEvent(null);
    toast({
      title: "עודכן בהצלחה",
      description: "האירוע עודכן בלוח השנה"
    });
  };

  const handleDelete = (event: CalendarEvent) => {
    onDeleteEvent(event.id);
    toast({
      title: "נמחק בהצלחה",
      description: "האירוע הוסר מהלוח שנה"
    });
  };

  const handleExportToPhone = (event: CalendarEvent) => {
    // Create ICS file for phone calendar
    const startDate = new Date(event.start);
    const endDate = event.end ? new Date(event.end) : new Date(startDate.getTime() + 60 * 60 * 1000);
    
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//StudyPlatform//Calendar//EN',
      'BEGIN:VEVENT',
      `UID:${event.id}@studyplatform.com`,
      `DTSTART:${startDate.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}`,
      `DTEND:${endDate.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}`,
      `SUMMARY:${event.title}`,
      `DESCRIPTION:${event.extendedProps.description || ''}`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\n');

    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${event.title}.ics`;
    a.click();
    URL.revokeObjectURL(url);

    onExportToPhone(event);
    toast({
      title: "יוצא בהצלחה",
      description: "הקובץ הורד - הוסף אותו ליומן הטלפון שלך"
    });
  };

  const groupedEvents = events.reduce((acc, event) => {
    const type = event.extendedProps.type;
    if (!acc[type]) acc[type] = [];
    acc[type].push(event);
    return acc;
  }, {} as Record<string, CalendarEvent[]>);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              ניהול אירועים ({events.length})
            </span>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Exams Section */}
          {groupedEvents.exam && groupedEvents.exam.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-4 h-4 text-red-500" />
                <h3 className="font-semibold">בחינות ({groupedEvents.exam.length})</h3>
              </div>
              <div className="space-y-3">
                {groupedEvents.exam.map(event => (
                  <div key={event.id} className="p-4 border rounded-lg bg-red-50 dark:bg-red-950/20">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium">{event.title}</h4>
                        <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {format(parseISO(event.start), 'dd/MM/yyyy', { locale: he })}
                          </div>
                          {event.start.includes('T') && (
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {format(parseISO(event.start), 'HH:mm')}
                            </div>
                          )}
                        </div>
                        {event.extendedProps.courseName && (
                          <div className="flex items-center gap-1 mt-1">
                            <BookOpen className="w-4 h-4" />
                            <Badge variant="secondary" className="text-xs">
                              {event.extendedProps.courseCode}
                            </Badge>
                          </div>
                        )}
                        {event.extendedProps.description && (
                          <p className="text-sm text-muted-foreground mt-2">
                            {event.extendedProps.description}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleExportToPhone(event)}
                          className="h-8"
                        >
                          <Download className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditStart(event)}
                          className="h-8"
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(event)}
                          className="h-8 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Assignments Section */}
          {groupedEvents.assignment && groupedEvents.assignment.length > 0 && (
            <>
              {groupedEvents.exam && groupedEvents.exam.length > 0 && <Separator />}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="w-4 h-4 text-blue-500" />
                  <h3 className="font-semibold">מטלות ({groupedEvents.assignment.length})</h3>
                </div>
                <div className="space-y-3">
                  {groupedEvents.assignment.map(event => (
                    <div key={event.id} className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-950/20">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium">{event.title}</h4>
                          <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {format(parseISO(event.start), 'dd/MM/yyyy', { locale: he })}
                            </div>
                            {event.start.includes('T') && (
                              <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {format(parseISO(event.start), 'HH:mm')}
                              </div>
                            )}
                          </div>
                          {event.extendedProps.courseName && (
                            <div className="flex items-center gap-1 mt-1">
                              <BookOpen className="w-4 h-4" />
                              <Badge variant="secondary" className="text-xs">
                                {event.extendedProps.courseCode}
                              </Badge>
                            </div>
                          )}
                          {event.extendedProps.description && (
                            <p className="text-sm text-muted-foreground mt-2">
                              {event.extendedProps.description}
                            </p>
                          )}
                        </div>
                        
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleExportToPhone(event)}
                            className="h-8"
                          >
                            <Download className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditStart(event)}
                            className="h-8"
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(event)}
                            className="h-8 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {events.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">אין אירועים</h3>
              <p>הוסף בחינות ומטלות כדי לראות אותם כאן</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Event Dialog */}
      <Dialog open={!!editingEvent} onOpenChange={() => setEditingEvent(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5" />
              עריכת אירוע
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-type">סוג האירוע</Label>
              <Select 
                value={editForm.type} 
                onValueChange={(value: 'exam' | 'assignment') => 
                  setEditForm(prev => ({ ...prev, type: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="exam">🎯 בחינה</SelectItem>
                  <SelectItem value="assignment">📝 מטלה</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="edit-title">כותרת</Label>
              <Input
                id="edit-title"
                value={editForm.title}
                onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="שם הבחינה/מטלה"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-date">תאריך</Label>
                <Input
                  id="edit-date"
                  type="date"
                  value={editForm.date}
                  onChange={(e) => setEditForm(prev => ({ ...prev, date: e.target.value }))}
                />
              </div>
              
              <div>
                <Label htmlFor="edit-time">שעה</Label>
                <Input
                  id="edit-time"
                  type="time"
                  value={editForm.time}
                  onChange={(e) => setEditForm(prev => ({ ...prev, time: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="edit-description">הערות</Label>
              <Textarea
                id="edit-description"
                value={editForm.description}
                onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="מידע נוסף על האירוע"
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleEditSave} className="flex-1">
                שמור שינויים
              </Button>
              <Button variant="outline" onClick={() => setEditingEvent(null)}>
                ביטול
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CalendarEventManager;
