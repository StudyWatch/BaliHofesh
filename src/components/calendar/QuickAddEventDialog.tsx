
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, Clock, Plus, BookOpen } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface QuickAddEventDialogProps {
  onAddEvent: (event: {
    title: string;
    type: 'exam' | 'assignment';
    date: string;
    time?: string;
    description?: string;
    courseId?: string;
  }) => void;
  courses?: Array<{ id: string; name_he: string; code: string }>;
}

const QuickAddEventDialog = ({ onAddEvent, courses = [] }: QuickAddEventDialogProps) => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    type: 'exam' as 'exam' | 'assignment',
    date: '',
    time: '',
    description: '',
    courseId: ''
  });
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.date) {
      toast({
        title: "שגיאה",
        description: "נא למלא את כל השדות הנדרשים",
        variant: "destructive"
      });
      return;
    }

    onAddEvent({
      title: formData.title,
      type: formData.type,
      date: formData.date,
      time: formData.time || undefined,
      description: formData.description || undefined,
      courseId: formData.courseId || undefined
    });

    setFormData({
      title: '',
      type: 'exam',
      date: '',
      time: '',
      description: '',
      courseId: ''
    });
    
    setOpen(false);
    
    toast({
      title: "נוסף בהצלחה",
      description: `${formData.type === 'exam' ? 'בחינה' : 'מטלה'} נוספה ללוח השנה`
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          הוסף אירוע
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            הוסף אירוע חדש
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="type">סוג האירוע</Label>
            <Select 
              value={formData.type} 
              onValueChange={(value: 'exam' | 'assignment') => 
                setFormData(prev => ({ ...prev, type: value }))
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
            <Label htmlFor="title">כותרת</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="שם הבחינה/מטלה"
              required
            />
          </div>

          {courses.length > 0 && (
            <div>
              <Label htmlFor="course">קורס (אופציונלי)</Label>
              <Select 
                value={formData.courseId} 
                onValueChange={(value) => 
                  setFormData(prev => ({ ...prev, courseId: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="בחר קורס" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map(course => (
                    <SelectItem key={course.id} value={course.id}>
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4" />
                        {course.code} - {course.name_he}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date">תאריך</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="time">שעה (אופציונלי)</Label>
              <Input
                id="time"
                type="time"
                value={formData.time}
                onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">הערות (אופציונלי)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="מידע נוסף על האירוע"
              rows={3}
            />
          </div>

          <div className="flex gap-2">
            <Button type="submit" className="flex-1">
              <Plus className="w-4 h-4 mr-2" />
              הוסף
            </Button>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              ביטול
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default QuickAddEventDialog;
