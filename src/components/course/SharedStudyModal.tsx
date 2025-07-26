import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useCreateSharedSession } from "@/hooks/useSharedSessions";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { addMinutes } from "date-fns";
import { Share2, Video, Clock, Copy, X, CheckCircle2 } from "lucide-react";

interface SharedStudyModalProps {
  courseId: string;
  isLoggedIn: boolean;
}

const durations = [
  { label: "30 דקות", value: 30 },
  { label: "שעה", value: 60 },
  { label: "שעתיים", value: 120 },
];

const platforms = [
  { label: "Zoom", value: "zoom", color: "from-purple-500 to-blue-400", icon: "📹" },
  { label: "Google Meet", value: "google-meet", color: "from-green-400 to-teal-400", icon: "🟢" },
  { label: "Teams", value: "teams", color: "from-blue-500 to-indigo-500", icon: "🟦" },
  { label: "אחר", value: "other", color: "from-gray-400 to-gray-300", icon: "🌐" },
];

function getPlatformMeta(platform: string) {
  return platforms.find(p => p.value === platform) || platforms[0];
}

const SharedStudyModal: React.FC<SharedStudyModalProps> = ({ courseId, isLoggedIn }) => {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [meetingLink, setMeetingLink] = useState("");
  const [description, setDescription] = useState("");
  const [platform, setPlatform] = useState("zoom");
  const [contactInfo, setContactInfo] = useState("");
  const [selectedDateTime, setSelectedDateTime] = useState<string>("");
  const [duration, setDuration] = useState(60);
  const [instantMode, setInstantMode] = useState(true);
  const [copied, setCopied] = useState(false);

  const { mutate: createSession, isPending } = useCreateSharedSession();
  const { toast } = useToast();

  // קביעת זמן התחלה: עכשיו או מאוחר יותר
  const nowIso = new Date().toISOString().slice(0, 16); // yyyy-MM-ddTHH:mm

  // בניית קישור אוטומטי לדוגמה (אפשר לשפר אוטומציה בעתיד)
  const autoPlatformUrl = {
    "zoom": "https://zoom.us/",
    "google-meet": "https://meet.google.com/",
    "teams": "https://teams.microsoft.com/",
    "other": "",
  };

  // הצגת פלטפורמות ככפתורים יפים
  const renderPlatformButtons = () => (
    <div className="flex gap-2 flex-wrap mb-2">
      {platforms.map((p) => (
        <Button
          key={p.value}
          size="sm"
          className={`bg-gradient-to-r ${p.color} text-white rounded-xl flex items-center gap-1 shadow-sm
            ${platform === p.value ? "ring-2 ring-offset-2 ring-blue-400" : "opacity-90 hover:opacity-100"}
          `}
          type="button"
          onClick={() => setPlatform(p.value)}
        >
          <span className="text-lg">{p.icon}</span>
          {p.label}
        </Button>
      ))}
    </div>
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !meetingLink || (!selectedDateTime && !instantMode)) {
      toast({
        title: "שגיאה",
        description: "יש למלא את כל השדות הנדרשים",
        variant: "destructive",
      });
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "שגיאה",
        description: "יש להתחבר כדי ליצור מפגש",
        variant: "destructive"
      });
      return;
    }

    // זמן התחלה: עכשיו אם Instant Mode, אחרת לפי בחירה
    const startTime = instantMode ? new Date() : new Date(selectedDateTime);
    const endTime = addMinutes(startTime, duration);

    createSession(
      {
        course_id: courseId,
        user_id: user.id,
        title,
        meeting_link: meetingLink,
        description: description || undefined,
        platform,
        is_active: true,
        scheduled_start_time: startTime.toISOString()
      },
      {
        onSuccess: (session) => {
          toast({
            title: "✅ הצלחה!",
            description: (
              <span>
                המפגש נוצר בהצלחה <br />
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-blue-600 mt-2"
                  onClick={() => {
                    navigator.clipboard.writeText(session.meeting_link || "");
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1300);
                  }}
                >
                  <Share2 className="inline w-4 h-4 mr-1" />
                  {copied ? "קישור הועתק!" : "שתף קישור"}
                </Button>
              </span>
            ),
            duration: 5000,
          });
          setOpen(false);
          resetForm();
        },
        onError: (error) => {
          toast({
            title: "שגיאה",
            description: "אירעה שגיאה ביצירת המפגש",
            variant: "destructive",
          });
          console.error("Error creating session:", error);
        },
      }
    );
  };

  const resetForm = () => {
    setTitle("");
    setMeetingLink("");
    setDescription("");
    setPlatform("zoom");
    setContactInfo("");
    setSelectedDateTime("");
    setDuration(60);
    setInstantMode(true);
    setCopied(false);
  };

  if (!isLoggedIn) {
    return (
      <Button disabled className="mb-4">
        📚 יש להתחבר כדי להציע שותפות
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="mb-4 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white shadow-md rounded-xl">
          <Video className="inline w-5 h-5 mr-2" />
          פתח לימוד משותף
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl bg-white dark:bg-gray-900" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl font-bold">
            <Video className="w-6 h-6 text-blue-500" /> יצירת מפגש לימוד משותף
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* פלטפורמה */}
          <div>
            <Label>בחר פלטפורמה</Label>
            {renderPlatformButtons()}
          </div>
          {/* שם המפגש */}
          <div>
            <Label htmlFor="title">שם המפגש *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="תרגול שאלות / חזרה למבחן..."
              required
              autoFocus
            />
          </div>
          {/* קישור מפגש */}
          <div>
            <Label htmlFor="meetingLink">קישור למפגש *</Label>
            <Input
              id="meetingLink"
              type="url"
              value={meetingLink}
              onChange={(e) => setMeetingLink(e.target.value)}
              placeholder={autoPlatformUrl[platform] || "https://"}
              required
            />
          </div>
          {/* תיאור */}
          <div>
            <Label htmlFor="description">תיאור (אופציונלי)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="מה נלמד? מה הדגש? אפשר לציין למי המפגש מתאים..."
              rows={2}
            />
          </div>
          {/* פרטי קשר */}
          <div>
            <Label htmlFor="contactInfo">פרטי קשר (אופציונלי)</Label>
            <Input
              id="contactInfo"
              value={contactInfo}
              onChange={(e) => setContactInfo(e.target.value)}
              placeholder="מייל / טלפון"
            />
          </div>
          {/* "פתח עכשיו" או זימון עתידי */}
          <div className="flex items-center gap-4">
            <Button
              type="button"
              variant={instantMode ? "default" : "outline"}
              onClick={() => setInstantMode(true)}
              className={instantMode ? "ring-2 ring-blue-400" : ""}
            >
              🚀 פתח עכשיו
            </Button>
            <Button
              type="button"
              variant={!instantMode ? "default" : "outline"}
              onClick={() => setInstantMode(false)}
              className={!instantMode ? "ring-2 ring-blue-400" : ""}
            >
              🗓️ קבע לזמן עתידי
            </Button>
            {!instantMode && (
              <Input
                type="datetime-local"
                value={selectedDateTime}
                onChange={(e) => setSelectedDateTime(e.target.value)}
                min={nowIso}
                required
                className="ml-2"
              />
            )}
          </div>
          {/* משך מפגש */}
          <div>
            <Label>משך מפגש</Label>
            <Select value={duration.toString()} onValueChange={val => setDuration(Number(val))}>
              <SelectTrigger>
                <SelectValue placeholder="בחר משך" />
              </SelectTrigger>
              <SelectContent>
                {durations.map(d => (
                  <SelectItem key={d.value} value={d.value.toString()}>{d.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {/* כפתורים */}
          <div className="flex gap-2 pt-2">
            <Button
              type="submit"
              disabled={isPending}
              className="flex-1 bg-gradient-to-r from-green-600 to-blue-700 hover:from-green-700 hover:to-blue-800 text-white font-semibold"
            >
              {isPending ? "📤 יוצר..." : "✅ צור מפגש"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              className="flex items-center"
            >
              <X className="w-5 h-5 ml-1" /> ביטול
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SharedStudyModal;
