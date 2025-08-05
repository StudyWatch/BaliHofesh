import React, { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  ExternalLink,
  User,
  Clock
} from "lucide-react";
import {
  useStudyRooms,
  useCreateStudyRoom,
  useUpdateStudyRoom
} from "@/hooks/useStudyRooms";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface StudyRoomsSectionProps {
  courseId: string;
  isLoggedIn: boolean;
}

// הגדרות Regex לכל פלטפורמה
const platformPatterns = [
  {
    key: "zoom",
    label: "Zoom",
    regex: /^https:\/\/(www\.)?(zoom\.us|us04web\.zoom\.us)\/j\/\d{9,}/
  },
  {
    key: "google-meet",
    label: "Google Meet",
    regex: /^https:\/\/meet\.google\.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}(?:\?.*)?$/
  },
  {
    key: "teams",
    label: "Teams",
    regex: /^https:\/\/teams\.microsoft\.com\/l\/meetup-join\/.*/
  },
  {
    key: "jitsi",
    label: "Jitsi Meet",
    regex: /^https:\/\/meet\.jit\.si\/[A-Za-z0-9_\-]{3,}/
  }
];

// זיהוי פלטפורמה לפי regex
function detectPlatformFromLink(link: string): string {
  const plat = platformPatterns.find((p) => p.regex.test(link));
  return plat?.key || "";
}

// ולידציה: רק קישור לפגישה יעבור
function isValidMeetingLink(link: string): boolean {
  if (!link.startsWith("https://")) return false;
  if (
    link.includes("javascript:") ||
    link.includes("base64,") ||
    link.includes("<script") ||
    link.includes("data:")
  )
    return false;
  return !!platformPatterns.find((p) => p.regex.test(link));
}

const StudyRoomsSection = ({ courseId, isLoggedIn }: StudyRoomsSectionProps) => {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [link, setLink] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [duration, setDuration] = useState(60); // דקות
  const [platformDetected, setPlatformDetected] = useState<string>("");
  const [linkError, setLinkError] = useState<string>("");
  const { data: studyRooms = [] } = useStudyRooms(courseId);
  const createStudyRoom = useCreateStudyRoom();
  const updateStudyRoom = useUpdateStudyRoom();
  const { toast } = useToast();

  // זיהוי פלטפורמה אוטומטי בלבד
  const handleLinkChange = (value: string) => {
    setLink(value);
    const detected = detectPlatformFromLink(value);
    setPlatformDetected(detected);
    if (value && !detected) {
      setLinkError("יש להזין קישור מלא לחדר/מפגש תקני בלבד (Zoom / Meet / Teams / Jitsi)");
    } else {
      setLinkError("");
    }
  };

  // ולידציה לפני שמירה
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "שגיאה",
        description: "יש להתחבר כדי לפתוח מפגש",
        variant: "destructive"
      });
      return;
    }
    if (!isValidMeetingLink(link)) {
      setLinkError("יש להזין קישור מלא לחדר/מפגש תקני בלבד (Zoom / Meet / Teams / Jitsi)");
      toast({
        title: "קישור לא תקין",
        description: "נא להדביק קישור מלא לחדר פגישה, לא לעמוד הבית של הפלטפורמה.",
        variant: "destructive"
      });
      return;
    }
    if (!platformDetected) {
      setLinkError("יש להזין קישור מלא לפגישה מפלטפורמה נתמכת בלבד");
      toast({
        title: "פלטפורמה לא מזוהה",
        description: "יש להזין קישור לחדר/מפגש תקני בפלטפורמה נתמכת בלבד.",
        variant: "destructive"
      });
      return;
    }

    const expiresAt = new Date(Date.now() + duration * 60000);

    try {
      await createStudyRoom.mutateAsync({
        course_id: courseId,
        title,
        description,
        link,
        contact_info: contactInfo,
        platform: platformDetected,
        expires_at: expiresAt.toISOString(),
        created_by: user.id,
        status: "open"
      });

      setTitle("");
      setDescription("");
      setLink("");
      setContactInfo("");
      setPlatformDetected("");
      setDuration(60);
      setShowForm(false);
      setLinkError("");

      toast({
        title: "הצלחה!",
        description: "המפגש נפתח בהצלחה"
      });
    } catch (error) {
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה ביצירת המפגש",
        variant: "destructive"
      });
    }
  };

  const handleEndSession = async (roomId: string) => {
    try {
      await updateStudyRoom.mutateAsync({ id: roomId, status: "closed" });
      toast({
        title: "המפגש נסגר",
        description: "המפגש נסגר בהצלחה"
      });
    } catch (error) {
      toast({
        title: "שגיאה",
        description: "לא ניתן לסגור את המפגש",
        variant: "destructive"
      });
    }
  };

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diffMs = expires.getTime() - now.getTime();
    if (diffMs <= 0) return "המפגש נסגר";
    const minutes = Math.floor(diffMs / 60000);
    const hours = Math.floor(minutes / 60);
    const remMinutes = minutes % 60;
    return `${hours > 0 ? `${hours} שעות ו-` : ""}${remMinutes} דקות`;
  };

  if (!isLoggedIn) return null;

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-right flex items-center justify-between">
          📅 מפגשי לימוד פתוחים
          <Button
            onClick={() => setShowForm(!showForm)}
            size="sm"
            className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white"
          >
            <Plus className="w-4 h-4" /> פתח מפגש חדש
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="mb-6 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800 space-y-4"
            autoComplete="off"
          >
            <div>
              <label className="block text-sm font-medium mb-2 text-right">
                כותרת המפגש
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="למשל: חזרה למבחן - פרק 3"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-right">
                קישור למפגש <span className="text-xs text-gray-500">(Zoom / Meet / Teams / Jitsi)</span>
              </label>
              <Input
                type="url"
                value={link}
                onChange={(e) => handleLinkChange(e.target.value)}
                placeholder="https://zoom.us/j/123456789"
                required
                className={linkError ? "border-red-500" : ""}
              />
              {link && platformDetected && (
                <div className="text-xs text-green-700 mt-1">
                  זוהתה פלטפורמה: <b>{platformPatterns.find(p => p.key === platformDetected)?.label || ""}</b>
                </div>
              )}
              {linkError && (
                <div className="text-xs text-red-600 mt-1">{linkError}</div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-right">
                תיאור (לא חובה)
              </label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="פרטים נוספים למשתתפים..."
                rows={2}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-right">
                פרטי קשר (אופציונלי)
              </label>
              <Input
                value={contactInfo}
                onChange={(e) => setContactInfo(e.target.value)}
                placeholder="user@gmail.com / 050-1234567"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-right">
                משך המפגש (בדקות)
              </label>
              <Input
                type="number"
                min="15"
                max="240"
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value))}
                required
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                ביטול
              </Button>
              <Button type="submit" disabled={createStudyRoom.isPending}>
                {createStudyRoom.isPending ? "פותח..." : "✅ פתח מפגש"}
              </Button>
            </div>
          </form>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {studyRooms.map((room) => (
            <div
              key={room.id}
              className="p-4 border rounded-lg bg-white dark:bg-gray-900 shadow-md hover:shadow-xl transition-all"
            >
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold">{room.title}</h3>
                <Badge
                  className={`${
                    room.status === "open" ? "bg-green-500" : "bg-red-500"
                  } text-white`}
                >
                  {room.status === "open" ? "פתוח" : "סגור"}
                </Badge>
              </div>
              <p className="text-sm text-gray-600 mb-2">{room.description}</p>
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                <Clock className="w-4 h-4" />
                <span>נותר: {getTimeRemaining(room.expires_at)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                <User className="w-4 h-4" />
                <span>{room.profiles?.name || "משתמש אנונימי"}</span>
              </div>
              <div className="flex gap-2 justify-between mt-3">
                <Button
                  asChild
                  size="sm"
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                >
                  <a href={room.link} target="_blank" rel="noopener noreferrer">
                    הצטרף למפגש <ExternalLink className="w-3 h-3" />
                  </a>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEndSession(room.id)}
                >
                  סגור מפגש
                </Button>
              </div>
              {room.contact_info && (
                <div className="mt-2 text-xs text-gray-400">
                  📞 {room.contact_info}
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default StudyRoomsSection;
