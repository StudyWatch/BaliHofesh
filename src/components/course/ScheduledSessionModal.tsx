import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useCreateSharedSession } from '@/hooks/useSharedSessions';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, Clock, Video } from 'lucide-react';

interface ScheduledSessionModalProps {
  courseId: string;
  isLoggedIn: boolean;
}

const ScheduledSessionModal = ({ courseId, isLoggedIn }: ScheduledSessionModalProps) => {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [meetingLink, setMeetingLink] = useState('');
  const [description, setDescription] = useState('');
  const [platform, setPlatform] = useState('zoom');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [duration, setDuration] = useState('120');
  const { mutate: createSession, isPending } = useCreateSharedSession();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !meetingLink || !scheduledDate || !scheduledTime) {
      toast({
        title: "שגיאה",
        description: "יש למלא את כל השדות הנדרשים",
        variant: "destructive"
      });
      return;
    }

    // Combine date and time
    const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`);
    const expiresAt = new Date(scheduledDateTime.getTime() + (parseInt(duration) * 60 * 1000));

    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id || 'anonymous';

    createSession({
      course_id: courseId,
      user_id: userId,
      title,
      meeting_link: meetingLink,
      description,
      platform,
      scheduled_start_time: scheduledDateTime.toISOString(),
      is_active: true
    }, {
      onSuccess: () => {
        toast({
          title: "המפגש נוצר בהצלחה! 🎉",
          description: `המפגש מתוזמן ל${scheduledDateTime.toLocaleDateString('he-IL')} בשעה ${scheduledTime}`
        });
        setOpen(false);
        // Reset form
        setTitle('');
        setMeetingLink('');
        setDescription('');
        setPlatform('zoom');
        setScheduledDate('');
        setScheduledTime('');
        setDuration('120');
      },
      onError: (error) => {
        toast({
          title: "שגיאה",
          description: "אירעה שגיאה ביצירת המפגש",
          variant: "destructive"
        });
        console.error('Error creating session:', error);
      }
    });
  };

  // Get today's date for min date
  const today = new Date().toISOString().split('T')[0];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 text-white font-semibold px-6 py-3 rounded-lg shadow-lg">
          <Video className="w-5 h-5 ml-2" />
          צור מפגש מתוזמן
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            יצירת מפגש לימוד מתוזמן
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">שם המפגש *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="תרגול לקראת מועד א'"
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="scheduledDate">תאריך המפגש *</Label>
              <Input
                id="scheduledDate"
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                min={today}
                required
              />
            </div>
            <div>
              <Label htmlFor="scheduledTime">שעת התחלה *</Label>
              <Input
                id="scheduledTime"
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                required
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="platform">פלטפורמה</Label>
              <Select value={platform} onValueChange={setPlatform}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="zoom">Zoom</SelectItem>
                  <SelectItem value="google-meet">Google Meet</SelectItem>
                  <SelectItem value="teams">Microsoft Teams</SelectItem>
                  <SelectItem value="other">אחר</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="duration">משך מוערך (דקות)</Label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="60">60 דקות</SelectItem>
                  <SelectItem value="90">90 דקות</SelectItem>
                  <SelectItem value="120">120 דקות</SelectItem>
                  <SelectItem value="180">180 דקות</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div>
            <Label htmlFor="meetingLink">קישור למפגש *</Label>
            <Input
              id="meetingLink"
              type="url"
              value={meetingLink}
              onChange={(e) => setMeetingLink(e.target.value)}
              placeholder="https://zoom.us/j/..."
              required
            />
          </div>
          
          <div>
            <Label htmlFor="description">תיאור המפגש (אופציונלי)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="נושאים שיכוסו במפגש, דרישות קדם, וכו'"
              rows={3}
            />
          </div>
          
          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={isPending} className="flex-1">
              {isPending ? "יוצר..." : "צור מפגש"}
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

export default ScheduledSessionModal;