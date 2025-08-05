import React, { useState, useEffect } from "react";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateSharedSession } from "@/hooks/useSharedSessions";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, Video, ExternalLink, Users } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

const platforms = [
  {
    key: "zoom",
    label: "Zoom",
    color: "from-blue-500 to-blue-400",
    url: "https://zoom.us/start/videomeeting",
    regex: /^https:\/\/(www\.)?(zoom\.us|us04web\.zoom\.us)\/j\/\d{9,}/,
    help: "העתק קישור מחדר Zoom, או פתח חדר חדש בלחיצה.",
  },
  {
    key: "google-meet",
    label: "Google Meet",
    color: "from-green-500 to-teal-400",
    url: "https://meet.google.com/new",
    regex: /^https:\/\/meet\.google\.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}(?:\?.*)?$/,
    help: "העתק קישור מ־Google Meet, או פתח פגישה חדשה.",
  },
  {
    key: "teams",
    label: "Teams",
    color: "from-purple-600 to-indigo-400",
    url: "https://teams.microsoft.com/l/meeting/new",
    regex: /^https:\/\/teams\.microsoft\.com\/l\/meetup-join\/.*/,
    help: "העתק קישור מ־Teams, או פתח פגישה חדשה.",
  },
  {
    key: "jitsi",
    label: "Jitsi Meet",
    color: "from-gray-600 to-gray-400",
    url: "auto-jitsi",
    regex: /^https:\/\/meet\.jit\.si\/[A-Za-z0-9_\-]{3,}/,
    help: "לחיצה יוצרת קישור Jitsi מיידי לפגישה עתידית.",
  },
];

function detectPlatformFromLink(link: string): string {
  const plat = platforms.find((p) => p.regex.test(link));
  return plat?.key || "";
}
function isValidMeetingLink(link: string): boolean {
  if (!link.startsWith("https://")) return false;
  if (
    link.includes("javascript:") ||
    link.includes("base64,") ||
    link.includes("<script") ||
    link.includes("data:")
  )
    return false;
  return !!platforms.find((p) => p.regex.test(link));
}

const durations = [
  { label: "30 דקות", value: 30 },
  { label: "שעה", value: 60 },
  { label: "שעתיים", value: 120 },
];

const maxParticipantsOptions = [
  { label: "ללא הגבלה", value: 0 },
  ...Array.from({ length: 49 }, (_, i) => ({
    label: `${i + 2}`,
    value: i + 2,
  })),
];

interface ScheduledSessionModalProps {
  courseId: string;
  isLoggedIn: boolean;
}

const ScheduledSessionModal: React.FC<ScheduledSessionModalProps> = ({
  courseId,
  isLoggedIn,
}) => {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [headline, setHeadline] = useState("");
  const [meetingLink, setMeetingLink] = useState("");
  const [description, setDescription] = useState("");
  const [platformDetected, setPlatformDetected] = useState<string>("");
  const [meetingLinkError, setMeetingLinkError] = useState<string>("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [duration, setDuration] = useState(60);
  const [maxParticipants, setMaxParticipants] = useState<number>(0);
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [timeWarning, setTimeWarning] = useState<string>("");
  const { mutate: createSession, isPending } = useCreateSharedSession();
  const { toast } = useToast();

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    setTimeWarning("");
    if (scheduledDate === today && scheduledTime) {
      const now = new Date();
      const [hh, mm] = scheduledTime.split(":").map(Number);
      if (
        hh < now.getHours() ||
        (hh === now.getHours() && mm < now.getMinutes())
      ) {
        setTimeWarning("לא ניתן לבחור שעה שכבר עברה היום");
      }
    }
  }, [scheduledDate, scheduledTime]);

  const handlePlatformSelect = (platKey: string) => {
    setSelectedPlatform(platKey);
    if (platKey === "jitsi") {
      const jitsiLink = `https://meet.jit.si/BaliHofesh-${Math.random()
        .toString(36)
        .substring(2, 10)}`;
      setMeetingLink(jitsiLink);
      setPlatformDetected("jitsi");
      setMeetingLinkError("");
      toast({
        title: "קישור Jitsi נוצר",
        description:
          "הקישור משויך לפגישה, אפשר להעתיק או לשתף לכל משתתף עתידי.",
        duration: 1800,
      });
    } else {
      setMeetingLink("");
      setPlatformDetected(platKey);
      setMeetingLinkError("");
    }
  };

  const handleOpenPlatform = (platKey: string) => {
    const plat = platforms.find((p) => p.key === platKey);
    if (!plat) return;
    if (plat.url === "auto-jitsi") return;
    window.open(plat.url, "_blank");
  };

  const handleMeetingLinkChange = (value: string) => {
    setMeetingLink(value);
    const detected = detectPlatformFromLink(value);
    setPlatformDetected(detected);
    if (value && !detected) {
      setMeetingLinkError(
        "יש להזין קישור מלא לחדר/מפגש תקני בלבד (Zoom / Meet / Teams / Jitsi)"
      );
    } else {
      setMeetingLinkError("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !meetingLink || !scheduledDate || !scheduledTime) {
      toast({
        title: "שגיאה",
        description: "יש למלא את כל השדות הנדרשים",
        variant: "destructive",
      });
      return;
    }
    if (timeWarning) {
      toast({
        title: "שגיאה בשעה",
        description: timeWarning,
        variant: "destructive",
      });
      return;
    }
    if (!isValidMeetingLink(meetingLink)) {
      setMeetingLinkError(
        "יש להזין קישור מלא לפגישה תקנית בלבד (Zoom / Meet / Teams / Jitsi)"
      );
      toast({
        title: "קישור לא תקין",
        description:
          "נא להדביק קישור מלא לחדר פגישה, לא לעמוד הבית של הפלטפורמה.",
        variant: "destructive",
      });
      return;
    }
    if (!platformDetected) {
      setMeetingLinkError("יש להזין קישור מלא לפגישה מפלטפורמה נתמכת בלבד");
      toast({
        title: "פלטפורמה לא מזוהה",
        description: "יש להזין קישור לחדר/מפגש תקני בפלטפורמה נתמכת בלבד.",
        variant: "destructive",
      });
      return;
    }

    const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`);
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id || null;

    if (!userId) {
      toast({
        title: "שגיאה",
        description: "יש להתחבר כדי ליצור מפגש",
        variant: "destructive",
      });
      return;
    }

    createSession(
      {
        course_id: courseId,
        user_id: userId,
        title,
        headline: headline || undefined, // אם אין שדה כזה – מחק שורה זו
        meeting_link: meetingLink,
        description,
        platform: platformDetected,
        scheduled_start_time: scheduledDateTime.toISOString(),
        is_active: true,
        duration_minutes: duration,
        max_participants: maxParticipants === 0 ? null : maxParticipants,
      },
      {
        onSuccess: () => {
          toast({
            title: "המפגש נוצר בהצלחה! 🎉",
            description: `המפגש מתוזמן ל־${scheduledDateTime.toLocaleDateString(
              "he-IL"
            )} בשעה ${scheduledTime}`,
          });
          setOpen(false);
          setTitle("");
          setHeadline("");
          setMeetingLink("");
          setDescription("");
          setPlatformDetected("");
          setScheduledDate("");
          setScheduledTime("");
          setDuration(60);
          setMeetingLinkError("");
          setMaxParticipants(0);
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

  if (!isLoggedIn) return null;

  const renderPlatformButtons = () => (
    <div className="flex flex-wrap justify-center gap-x-5 gap-y-6 mb-4 mt-2 w-full">
      {platforms.map((p) => (
        <div
          key={p.key}
          className="flex flex-col items-center min-w-[100px] max-w-[130px] text-center"
        >
          <Button
            type="button"
            className={`
              bg-gradient-to-r ${p.color} text-white rounded-lg
              flex items-center justify-center gap-1 px-3 py-2 text-[15px] shadow-md
              transition-all duration-200
              ${
                selectedPlatform === p.key
                  ? "ring-2 ring-blue-400 scale-105"
                  : "hover:ring hover:ring-blue-300"
              }
            `}
            style={{ fontWeight: 600, minHeight: 40, minWidth: 100 }}
            onClick={() => handlePlatformSelect(p.key)}
            title={p.label}
          >
            {p.label}
          </Button>
          <span className="text-[11px] text-gray-500 mt-1 leading-tight max-w-[110px]">
            {p.help}
          </span>
          <AnimatePresence>
            {selectedPlatform === p.key && p.url !== "auto-jitsi" && (
              <motion.div
                initial={{ opacity: 0, y: -7, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.97 }}
                transition={{ duration: 0.33, ease: "easeOut" }}
                className="w-full flex justify-center"
              >
               <Button
  variant="outline"
  className="mt-2 w-full min-w-[220px] px-3 py-2 border border-blue-300 text-blue-700 hover:bg-blue-50 text-sm font-semibold flex items-center justify-center gap-2 shadow-sm rounded-md transition whitespace-nowrap"
  onClick={() => handleOpenPlatform(p.key)}
>
  <ExternalLink className="w-4 h-4 ml-1" />
  פתח קישור חדש {p.label}
</Button>

              </motion.div>
            )}
            {selectedPlatform === p.key && p.url === "auto-jitsi" && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -7, scale: 0.97 }}
                transition={{ duration: 0.33, ease: "easeOut" }}
                className="mt-2 text-green-700 text-xs font-semibold w-full"
              >
                קישור Jitsi נוצר עבורך לפגישה עתידית!
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 text-white font-semibold px-5 py-2 rounded-lg shadow-lg text-base">
          <Video className="w-5 h-5 ml-2" />
          צור מפגש מתוזמן
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-w-[560px] w-full max-h-[96vh] overflow-y-auto rounded-2xl shadow-2xl bg-white dark:bg-gray-900 p-4" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold mb-1">
            <Calendar className="w-5 h-5" /> תכנון מפגש לימוד עתידי
          </DialogTitle>
        </DialogHeader>
        {renderPlatformButtons()}
        <form onSubmit={handleSubmit} className="space-y-3 px-1 pt-0">
          <div>
            <Label htmlFor="title" className="font-semibold text-[14px]">
              שם המפגש *
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="תרגול שאלות / חזרה למבחן..."
              required
              className="rounded-lg text-[15px] py-2"
            />
          </div>
          <div>
            <Label htmlFor="headline" className="font-semibold text-[14px]">
              כותרת מקוצרת (לא חובה)
            </Label>
            <Input
              id="headline"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder='פתרון ממ"ן 3'
              className="rounded-lg text-[15px] py-2"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="scheduledDate" className="font-semibold text-[14px]">
                תאריך *
              </Label>
              <Input
                id="scheduledDate"
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                min={today}
                required
                className="rounded-lg text-[15px]"
              />
            </div>
            <div>
              <Label htmlFor="scheduledTime" className="font-semibold text-[14px]">
                שעה *
              </Label>
              <Input
                id="scheduledTime"
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                required
                className="rounded-lg text-[15px]"
              />
            </div>
          </div>
          {timeWarning && (
            <div className="text-xs text-red-500 mt-0.5">{timeWarning}</div>
          )}
          {scheduledDate && scheduledTime && !timeWarning && (
            <div className="text-xs text-blue-700 mt-1">
              <b>המפגש יתחיל:</b>{" "}
              {new Date(`${scheduledDate}T${scheduledTime}`).toLocaleString(
                "he-IL",
                {
                  weekday: "long",
                  day: "2-digit",
                  month: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                }
              )}
            </div>
          )}
          <div>
            <Label htmlFor="meetingLink" className="font-semibold text-[14px]">
              קישור למפגש *
            </Label>
            <Input
              id="meetingLink"
              type="url"
              value={meetingLink}
              onChange={(e) => handleMeetingLinkChange(e.target.value)}
              placeholder="הדבק קישור או צור אוטומטית למעלה"
              required
              className={`rounded-lg text-[15px] py-2 ${
                meetingLinkError ? "border-red-500" : ""
              }`}
              dir="ltr"
            />
            <div className="text-xs text-gray-500 mt-1">
              הדבק קישור מלא (לא עמוד בית).{" "}
              <span className="text-gray-400">
                לדוג׳: https://zoom.us/j/123456789 | https://meet.google.com/xxx-xxxx-xxx
              </span>
            </div>
            {meetingLink && platformDetected && (
              <div className="text-xs text-green-700 mt-0.5">
                זוהתה פלטפורמה:{" "}
                <b>
                  {platforms.find((p) => p.key === platformDetected)?.label || ""}
                </b>
              </div>
            )}
            {meetingLinkError && (
              <div className="text-xs text-red-600 mt-0.5">
                {meetingLinkError}
              </div>
            )}
          </div>
          <div>
            <Label htmlFor="description" className="font-semibold text-[14px]">
              תיאור (לא חובה)
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="על מה נדבר? מה נלמד?"
              rows={2}
              className="rounded-lg text-[15px]"
            />
          </div>
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <Label className="font-semibold text-[14px]">משך משוער</Label>
              <Select
                value={duration.toString()}
                onValueChange={(val) => setDuration(Number(val))}
              >
                <SelectTrigger className="rounded-lg text-[15px] py-2">
                  <SelectValue placeholder="בחר משך" />
                </SelectTrigger>
                <SelectContent>
                  {durations.map((d) => (
                    <SelectItem key={d.value} value={d.value.toString()}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Label className="font-semibold text-[14px] flex items-center gap-1">
                <Users className="inline w-4 h-4" />
                כמות משתתפים
              </Label>
              <Select
                value={maxParticipants.toString()}
                onValueChange={(val) => setMaxParticipants(Number(val))}
              >
                <SelectTrigger className="rounded-lg text-[15px] py-2">
                  <SelectValue placeholder="ללא הגבלה" />
                </SelectTrigger>
                <SelectContent>
                  {maxParticipantsOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value.toString()}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <Button
              type="submit"
              disabled={isPending}
              className="flex-1 bg-gradient-to-r from-green-600 to-blue-700 hover:from-green-700 hover:to-blue-800 text-white font-bold text-base rounded-lg py-2 min-w-[0] max-w-[170px]"
              style={{ minWidth: "120px", fontSize: "1rem", height: "42px" }}
            >
              {isPending ? "יוצר..." : "צור מפגש"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              className="font-semibold text-base text-gray-600"
            >
              ביטול
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ScheduledSessionModal;
