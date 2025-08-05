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
import { Share2, Video, X, Info, Users, ExternalLink } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

const platforms = [
  {
    label: "Zoom",
    value: "zoom",
    color: "from-purple-400 to-blue-400",
    icon: "📹",
    quickUrl: "https://zoom.us/start/videomeeting",
    regex: /^https:\/\/(www\.)?(zoom\.us|us04web\.zoom\.us)\/j\/\d{9,}/,
    help: "העתק קישור מ־Zoom, או פתח פגישה חדשה.",
  },
  {
    label: "Google Meet",
    value: "google-meet",
    color: "from-green-400 to-teal-300",
    icon: "🟢",
    quickUrl: "https://meet.google.com/new",
    regex: /^https:\/\/meet\.google\.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}(?:\?.*)?$/,
    help: "העתק קישור מ־Google Meet, או פתח פגישה חדשה.",
  },
  {
    label: "Teams",
    value: "teams",
    color: "from-blue-500 to-indigo-300",
    icon: "🟦",
    quickUrl: "https://teams.microsoft.com/l/meeting/new",
    regex: /^https:\/\/teams\.microsoft\.com\/l\/meetup-join\/.*/,
    help: "העתק קישור מ־Teams, או פתח פגישה חדשה.",
  },
  {
    label: "Jitsi Meet",
    value: "jitsi",
    color: "from-gray-600 to-gray-300",
    icon: "🔗",
    quickUrl: "auto-jitsi",
    regex: /^https:\/\/meet\.jit\.si\/[A-Za-z0-9_\-]{3,}/,
    help: "לחיצה יוצרת קישור Jitsi מיידי.",
  }
];

function detectPlatformFromLink(link: string): string {
  const plat = platforms.find((p) => p.regex.test(link));
  return plat?.value || "";
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
  return !!detectPlatformFromLink(link);
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

interface SharedStudyModalProps {
  courseId: string;
  isLoggedIn: boolean;
}

const SharedStudyModal: React.FC<SharedStudyModalProps> = ({ courseId, isLoggedIn }) => {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [meetingLink, setMeetingLink] = useState("");
  const [platform, setPlatform] = useState<"zoom"|"google-meet"|"teams"|"jitsi">("zoom");
  const [description, setDescription] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [duration, setDuration] = useState(60);
  const [maxParticipants, setMaxParticipants] = useState<number>(0);
  const [copied, setCopied] = useState(false);
  const [linkError, setLinkError] = useState("");
  const [platformDetected, setPlatformDetected] = useState<string>("zoom");
  const [showOpenLinkBtn, setShowOpenLinkBtn] = useState<string | null>(null);
  const { mutate: createSession, isPending } = useCreateSharedSession();
  const { toast } = useToast();

  const generateJitsiLink = () => {
    const randomId = Math.random().toString(36).substring(2, 10);
    return `https://meet.jit.si/BaliHofesh-${randomId}`;
  };

  // בוחרים פלטפורמה – לא פותח לינק! רק מחליף בחירה
  const handlePlatformSelect = (platValue: string) => {
    setPlatform(platValue as any);
    setShowOpenLinkBtn(platValue);
    setLinkError("");
    // Jitsi – מייצר אוטומטית קישור ומעתיק ללוח
    if (platValue === "jitsi") {
      const jitsiLink = generateJitsiLink();
      setMeetingLink(jitsiLink);
      setPlatformDetected("jitsi");
      toast({
        title: "קישור Jitsi נוצר",
        description: "הקישור הועתק ללוח! אפשר להדביק או לשתף.",
        duration: 1800,
      });
      navigator.clipboard.writeText(jitsiLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 1300);
    } else {
      setMeetingLink("");
      setPlatformDetected(platValue);
    }
  };

  // פותח את הפלטפורמה בחלון חדש
  const handleOpenPlatform = (platValue: string) => {
    const plat = platforms.find(p => p.value === platValue);
    if (!plat) return;
    if (plat.quickUrl === "auto-jitsi") {
      // כבר נוצר בלמעלה
      return;
    }
    window.open(plat.quickUrl, "_blank");
  };

  const handleMeetingLinkChange = (value: string) => {
    setMeetingLink(value);
    const detected = detectPlatformFromLink(value);
    setPlatformDetected(detected);
    if (detected && detected !== platform) setPlatform(detected as any);
    if (value && !detected) {
      setLinkError("יש להזין קישור לפגישה תקנית (Zoom / Meet / Teams / Jitsi בלבד)");
    } else {
      setLinkError("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !meetingLink) {
      toast({
        title: "שגיאה",
        description: "יש למלא את כל השדות החובה",
        variant: "destructive",
      });
      return;
    }
    if (!isValidMeetingLink(meetingLink)) {
      setLinkError("יש להדביק קישור מלא לפגישה תקנית, או ליצור Jitsi בלחיצה.");
      toast({
        title: "קישור לא תקין",
        description: "יש להדביק קישור ישיר לחדר פגישה.",
        variant: "destructive"
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
    const startTime = new Date();

    createSession(
      {
        course_id: courseId,
        user_id: user.id,
        title,
        meeting_link: meetingLink,
        description: description || undefined,
        platform: platformDetected || platform,
        is_active: true,
        scheduled_start_time: startTime.toISOString(),
        contact_info: contactInfo || undefined,
        max_participants: maxParticipants === 0 ? null : maxParticipants,
      },
      {
        onSuccess: (session) => {
          toast({
            title: "המפגש נוצר!",
            description: (
              <span>
                קישור מוכן לשיתוף<br/>
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
                  {copied ? "קישור הועתק!" : "העתק קישור"}
                </Button>
              </span>
            ),
            duration: 4000,
          });
          setOpen(false);
          resetForm();
        },
        onError: () => {
          toast({
            title: "שגיאה",
            description: "אירעה שגיאה ביצירת המפגש",
            variant: "destructive",
          });
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
    setDuration(60);
    setCopied(false);
    setLinkError("");
    setPlatformDetected("zoom");
    setMaxParticipants(0);
    setShowOpenLinkBtn(null);
  };

  // עיצוב כפתורי פלטפורמות – רספונסיבי ונעים, תומך "פתח קישור חדש" + אנימציה
  const renderPlatformButtons = () => (
    <div className="flex flex-wrap justify-center gap-x-6 gap-y-7 mb-4 mt-2 w-full">
      {platforms.map((p) => (
        <div
          key={p.value}
          className={`flex flex-col items-center min-w-[105px] max-w-[130px] text-center relative group`}
        >
          <Button
            size="sm"
            type="button"
            className={`
              bg-gradient-to-r ${p.color} text-white rounded-lg
              flex items-center justify-center gap-1 px-3 py-2 text-[15px] shadow-md
              transition-all duration-200 border-2
              ${platform === p.value ? "ring-2 ring-blue-400 scale-105 border-blue-400" : "hover:ring hover:ring-blue-300 border-transparent"}
            `}
            style={{ fontWeight: 600, minHeight: 40, minWidth: 100 }}
            onClick={() => handlePlatformSelect(p.value)}
            title={p.label}
          >
            <span className="text-lg">{p.icon}</span>
            {p.label}
          </Button>
          <span className="text-[11px] text-gray-500 mt-1 leading-tight max-w-[110px]">
            {p.help}
          </span>
          <AnimatePresence>
            {showOpenLinkBtn === p.value && p.quickUrl !== "auto-jitsi" && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.98 }}
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
            {showOpenLinkBtn === p.value && p.quickUrl === "auto-jitsi" && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -7, scale: 0.97 }}
                transition={{ duration: 0.33, ease: "easeOut" }}
                className="mt-2 text-green-700 text-xs font-semibold w-full"
              >
                קישור Jitsi חדש נוצר והועתק ללוח!
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );

  if (!isLoggedIn) {
    return (
      <Button disabled className="mb-4 w-full">
        📚 יש להתחבר כדי לפתוח מפגש
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="mb-5 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white shadow rounded-lg text-base font-semibold px-4 py-1.5 w-fit min-w-[170px] max-w-[220px]">
          <Video className="inline w-5 h-5 ml-2" />
          פתח מפגש לימוד
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-w-[560px] w-full max-h-[96vh] overflow-y-auto rounded-2xl shadow-2xl bg-white dark:bg-gray-900 p-4" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold mb-1">
            <Video className="w-5 h-5 text-blue-500" /> פתיחת מפגש לימוד
          </DialogTitle>
        </DialogHeader>
        <div className="rounded-lg bg-blue-50 px-2.5 py-1.5 text-blue-900 text-[13px] mb-2 border border-blue-100 font-normal flex items-center gap-1">
          <Info className="w-4 h-4 mr-1 text-blue-400" />
          בחר פלטפורמה, פתח קישור או צור קישור Jitsi אוטומטי. אפשר גם להדביק קישור קיים.
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 px-1 pt-0">
          {renderPlatformButtons()}
          <div>
            <Label htmlFor="title" className="font-semibold text-[14px]">שם המפגש *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="תרגול / הכנה / פתרון..."
              required
              className="rounded-lg text-[15px] py-2"
            />
          </div>
          <div>
            <Label htmlFor="meetingLink" className="font-semibold text-[14px]">קישור למפגש *</Label>
            <Input
              id="meetingLink"
              type="url"
              value={meetingLink}
              onChange={(e) => handleMeetingLinkChange(e.target.value)}
              placeholder="הדבק קישור או צור אוטומטית למעלה"
              required
              dir="ltr"
              className={`rounded-lg text-[15px] py-2 ${linkError ? "border-red-500" : ""}`}
            />
            {meetingLink && platformDetected && (
              <div className="text-xs text-green-700 mt-0.5">
                זוהתה פלטפורמה: <b>{platforms.find(p => p.value === platformDetected)?.label || ""}</b>
              </div>
            )}
            {linkError && (
              <div className="text-xs text-red-600 mt-0.5">{linkError}</div>
            )}
          </div>
          <div>
            <Label htmlFor="description" className="font-semibold text-[14px]">תיאור (לא חובה)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="על מה נדבר? מה נלמד?"
              rows={2}
              className="rounded-lg text-[15px]"
            />
          </div>
          <div>
            <Label htmlFor="contactInfo" className="font-semibold text-[14px]">פרטי קשר (לא חובה)</Label>
            <Input
              id="contactInfo"
              value={contactInfo}
              onChange={(e) => setContactInfo(e.target.value)}
              placeholder="מייל / טלפון"
              className="rounded-lg text-[15px]"
            />
          </div>
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <Label className="font-semibold text-[14px]">משך משוער</Label>
              <Select value={duration.toString()} onValueChange={val => setDuration(Number(val))}>
                <SelectTrigger className="rounded-lg text-[15px] py-2">
                  <SelectValue placeholder="בחר משך" />
                </SelectTrigger>
                <SelectContent>
                  {durations.map(d => (
                    <SelectItem key={d.value} value={d.value.toString()}>{d.label}</SelectItem>
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
                onValueChange={val => setMaxParticipants(Number(val))}
              >
                <SelectTrigger className="rounded-lg text-[15px] py-2">
                  <SelectValue placeholder="ללא הגבלה" />
                </SelectTrigger>
                <SelectContent>
                  {maxParticipantsOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value.toString()}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-2 pt-1 justify-between">
            <Button
              type="submit"
              disabled={isPending}
              className="flex-1 bg-gradient-to-r from-green-600 to-blue-700 hover:from-green-700 hover:to-blue-800 text-white font-bold text-base rounded-lg py-2 min-w-[0] max-w-[170px]"
              style={{ minWidth: "120px", fontSize: "1rem", height: "42px" }}
            >
              {isPending ? "פותח..." : "🚀 פתח מפגש"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              className="font-semibold text-base text-gray-600"
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
