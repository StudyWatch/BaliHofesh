import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useCreateStudyPartner,
  useUserActiveStudyPartner,
  useExtendStudyPartner,
} from "@/hooks/useStudyPartners";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { UserPlus, UploadCloud, X, Repeat, Pencil } from "lucide-react";

interface StudyPartnerModalProps {
  courseId: string;
  isLoggedIn: boolean;
  disabled?: boolean;
  editMode?: boolean;
  initialData?: any; // StudyPartner
}

const daysOfWeek = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];
const hours = Array.from({ length: 24 }, (_, i) =>
  `${i.toString().padStart(2, "0")}:00`
);

const defaultAvatars = [
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Grandpa",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Grandma",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Explorer",
  "https://api.dicebear.com/7.x/bottts/svg?seed=BotBuddy",
  "https://api.dicebear.com/7.x/pixel-art/svg?seed=PixelGuy",
  "https://api.dicebear.com/7.x/thumbs/svg?seed=Peace",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=HappyGal",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=CoolDude",
];

const StudyPartnerModal = ({
  courseId,
  isLoggedIn,
  disabled,
  editMode = false,
  initialData = null,
}: StudyPartnerModalProps) => {
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string>(defaultAvatars[0]);
  const [avatarPreview, setAvatarPreview] = useState(defaultAvatars[0]);
  const [selectedTimes, setSelectedTimes] = useState<{ day: string; start: string; end: string }[]>([]);
  const [newDay, setNewDay] = useState("");
  const [newStart, setNewStart] = useState("");
  const [newEnd, setNewEnd] = useState("");
  const [noSpecificTime, setNoSpecificTime] = useState(false);
  const [duration, setDuration] = useState("7"); // ברירת מחדל שבוע
  const { mutate: createPartner, isPending } = useCreateStudyPartner();
  const { mutate: extendPartner, isPending: isExtending } = useExtendStudyPartner();
  const { toast } = useToast();
  const { data: activeRequest, refetch: refetchActive } = useUserActiveStudyPartner(courseId);

  // 🟢 טען ערכים קיימים במצב עריכה
  useEffect(() => {
    if (editMode && initialData) {
      setDescription(initialData.description || "");
      setContactInfo(initialData.contact_info || "");
      setAvatarUrl(initialData.avatar_url || defaultAvatars[0]);
      setAvatarPreview(initialData.avatar_url || defaultAvatars[0]);

      if (
        initialData.available_hours?.length === 1 &&
        initialData.available_hours[0] === "אין זמן מסוים"
      ) {
        setNoSpecificTime(true);
      } else {
        const parsed = (initialData.available_hours || []).map((h) => {
          const [day, range] = h.split(" ");
          const [start, end] = (range || "").split("-");
          return { day, start, end };
        });
        setSelectedTimes(parsed);
      }
    } else if (!editMode) {
      // איפוס ערכים
      setDescription("");
      setContactInfo("");
      setAvatarUrl(defaultAvatars[0]);
      setAvatarPreview(defaultAvatars[0]);
      setSelectedTimes([]);
      setNoSpecificTime(false);
      setDuration("7");
    }
  }, [editMode, initialData, open]);

  // העלאת תמונה ושמירה ל-profiles
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (!user || userError) {
        toast({
          title: "שגיאה",
          description: "לא ניתן לאמת את המשתמש",
          variant: "destructive",
        });
        return;
      }

      const ext = file.name.split(".").pop();
      const filePath = `users/${user.id}.${ext}`;
      await supabase.storage.from("avatars").remove([filePath]);
      const { data, error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError || !data) {
        toast({
          title: "❌ שגיאה בהעלאת תמונה",
          description: uploadError?.message,
          variant: "destructive",
        });
        return;
      }
      const { publicUrl } = supabase.storage.from("avatars").getPublicUrl(filePath).data;
      setAvatarUrl(publicUrl);
      setAvatarPreview(publicUrl);
      const { error: profileUpdateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", user.id);
      if (profileUpdateError) {
        toast({
          title: "שגיאה בשמירת תמונה בפרופיל",
          description: profileUpdateError.message,
          variant: "destructive",
        });
      }
    }
  };

  const handleAvatarChange = (url: string) => {
    setAvatarUrl(url);
    setAvatarPreview(url);
  };

  const addTimeSlot = () => {
    if (newDay && newStart && newEnd) {
      setSelectedTimes([
        ...selectedTimes,
        { day: newDay, start: newStart, end: newEnd },
      ]);
      setNewDay("");
      setNewStart("");
      setNewEnd("");
    }
  };

  const removeTimeSlot = (index: number) => {
    setSelectedTimes((prev) => prev.filter((_, i) => i !== index));
  };

  // יצירה או עדכון בקשה (בהתאם ל־editMode)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description) {
      toast({
        title: "שגיאה",
        description: "יש למלא תיאור לשותפות הלמידה",
        variant: "destructive",
      });
      return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "שגיאה",
        description: "יש להתחבר כדי להציע שותפות ללמידה",
        variant: "destructive",
      });
      return;
    }

    const formattedTimes = noSpecificTime
      ? ["אין זמן מסוים"]
      : selectedTimes.map((t) => `${t.day} ${t.start}-${t.end}`);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + parseInt(duration, 10));

    // במצב עריכה - שלח עדכון (לא Insert!)
    if (editMode && initialData?.id) {
      const { error } = await supabase
        .from("study_partners")
        .update({
          description,
          contact_info: contactInfo.trim() || undefined,
          avatar_url: avatarUrl,
          available_hours: formattedTimes,
          preferred_times: formattedTimes,
          expires_at: expiresAt.toISOString(),
        })
        .eq("id", initialData.id);

      if (error) {
        toast({
          title: "שגיאה",
          description: "אירעה שגיאה בשמירת העריכה",
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "הבקשה עודכנה",
        description: "הבקשה שלך עודכנה בהצלחה",
      });
      setOpen(false);
      refetchActive?.();
      return;
    }

    // מצב יצירה רגיל
    createPartner(
      {
        course_id: courseId,
        user_id: user.id,
        description,
        available_hours: formattedTimes,
        preferred_times: formattedTimes,
        contact_info: contactInfo.trim() || undefined,
        avatar_url: avatarUrl || defaultAvatars[0],
        expires_at: expiresAt.toISOString(),
      },
      {
        onSuccess: () => {
          toast({
            title: "✅ הצלחה",
            description: `הבקשה פורסמה בהצלחה ותהיה פעילה למשך ${duration} ימים`,
          });
          setOpen(false);
          setDescription("");
          setSelectedTimes([]);
          setContactInfo("");
          setAvatarUrl(defaultAvatars[0]);
          setAvatarPreview(defaultAvatars[0]);
          setNoSpecificTime(false);
          setDuration("7");
          refetchActive?.();
        },
        onError: (error) => {
          toast({
            title: "❌ שגיאה",
            description: "אירעה שגיאה בפרסום הבקשה",
            variant: "destructive",
          });
          console.error(error);
        },
      }
    );
  };

  // הארכת בקשה
  const handleExtend = () => {
    if (!activeRequest) return;
    extendPartner(
      {
        id: activeRequest.id,
        extraDays: parseInt(duration, 10),
      },
      {
        onSuccess: () => {
          toast({
            title: "הבקשה הוארכה",
            description: `הבקשה פעילה לעוד ${duration} ימים!`,
          });
          setOpen(false);
          refetchActive?.();
        },
        onError: (error) => {
          toast({
            title: "שגיאה",
            description: "שגיאה בהארכת הבקשה",
            variant: "destructive",
          });
        },
      }
    );
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
        <Button
          className={
            editMode
              ? "bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white"
              : "mb-4 bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white shadow-xl font-bold py-3 px-6 rounded-lg text-lg transition"
          }
          onClick={() => setOpen(true)}
        >
          {editMode ? (
            <>
              <Pencil className="inline-block mr-2" />
              ערוך בקשה
            </>
          ) : (
            <>
              <UserPlus className="inline-block mr-2" />
              אני רוצה ללמוד עם אחרים
            </>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle>{editMode ? "עריכת שותפות לימודים" : "✨ פרסום שותפות ללמידה"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Avatar Section */}
          <div>
            <Label>בחר תמונת פרופיל</Label>
            <div className="flex gap-3 items-center">
              <img
                src={avatarPreview}
                alt="Avatar Preview"
                className="w-16 h-16 rounded-full border-2 border-purple-300"
              />
              <Input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
                id={`avatarUpload${editMode ? "Edit" : ""}`}
              />
              <label htmlFor={`avatarUpload${editMode ? "Edit" : ""}`} className="cursor-pointer flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-gray-500" />
                העלה תמונה
              </label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleAvatarChange(defaultAvatars[0])}
              >
                🌀 ברירת מחדל
              </Button>
            </div>
            <div className="grid grid-cols-4 gap-2 mt-3">
              {defaultAvatars.map((url, idx) => (
                <img
                  key={idx}
                  src={url}
                  alt={`Avatar ${idx}`}
                  className={`w-12 h-12 rounded-full border cursor-pointer ${
                    avatarPreview === url ? "ring-2 ring-purple-400" : ""
                  }`}
                  onClick={() => handleAvatarChange(url)}
                />
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">תיאור *</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="למשל: רוצה ללמוד פרק 4 עם דגש על התרגולים"
              rows={3}
              required
            />
          </div>

          {/* Contact Info */}
          <div>
            <Label htmlFor="contactInfo">פרטי קשר (אימייל/טלפון)</Label>
            <Input
              id="contactInfo"
              value={contactInfo}
              onChange={(e) => setContactInfo(e.target.value)}
              placeholder="user@gmail.com או 050-1234567"
            />
          </div>

          {/* Time Selection */}
          <div>
            <Label>הוסף זמן למפגש</Label>
            <div className="flex items-center gap-2 mb-2">
              <input
                type="checkbox"
                checked={noSpecificTime}
                onChange={() => setNoSpecificTime(!noSpecificTime)}
              />
              <span className="text-sm">אין זמן מסוים</span>
            </div>
            {!noSpecificTime && (
              <>
                <div className="flex gap-2 mt-2">
                  <Select value={newDay} onValueChange={setNewDay}>
                    <SelectTrigger>
                      <SelectValue placeholder="בחר יום" />
                    </SelectTrigger>
                    <SelectContent>
                      {daysOfWeek.map((day) => (
                        <SelectItem key={day} value={day}>
                          {day}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={newStart} onValueChange={setNewStart}>
                    <SelectTrigger>
                      <SelectValue placeholder="שעת התחלה" />
                    </SelectTrigger>
                    <SelectContent>
                      {hours.map((hour) => (
                        <SelectItem key={hour} value={hour}>
                          {hour}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={newEnd} onValueChange={setNewEnd}>
                    <SelectTrigger>
                      <SelectValue placeholder="שעת סיום" />
                    </SelectTrigger>
                    <SelectContent>
                      {hours.map((hour) => (
                        <SelectItem key={hour} value={hour}>
                          {hour}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button type="button" onClick={addTimeSlot}>
                    ➕ הוסף
                  </Button>
                </div>
                <div className="mt-3">
                  {selectedTimes.map((t, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between items-center bg-gray-100 dark:bg-gray-800 p-2 rounded"
                    >
                      <span className="text-sm">
                        📅 {t.day}, 🕒 {t.start}-{t.end}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => removeTimeSlot(idx)}
                      >
                        ❌ הסר
                      </Button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* משך בקשה */}
          <div>
            <Label>תוקף הבקשה</Label>
            <Select value={duration} onValueChange={setDuration}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="בחר משך" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">3 ימים</SelectItem>
                <SelectItem value="7">שבוע</SelectItem>
                <SelectItem value="14">שבועיים</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Submit */}
          <div className="flex gap-2 pt-4">
            <Button
              type="submit"
              disabled={isPending}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white text-lg"
            >
              {editMode
                ? isPending
                  ? "שומר שינויים..."
                  : "שמור שינויים"
                : isPending
                ? "📤 שולח..."
                : "✅ שלח בקשה"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              ביטול
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default StudyPartnerModal;
