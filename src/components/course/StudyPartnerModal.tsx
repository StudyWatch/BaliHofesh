import React, { useEffect, useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { UploadCloud, X, Pencil } from "lucide-react";
import { useCreateStudyPartner } from "@/hooks/useStudyPartners";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const daysOfWeek = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];
const hours = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, "0")}:00`);
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

interface StudyPartnerModalProps {
  courseId: string;
  isLoggedIn: boolean;
  editMode: boolean;
  initialData: any;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const StudyPartnerModal = ({
  courseId,
  isLoggedIn,
  editMode = false,
  initialData = null,
  open,
  onClose,
  onSuccess,
}: StudyPartnerModalProps) => {
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
  const { toast } = useToast();

  // טען ערכים במצב עריכה
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
      setDescription("");
      setContactInfo("");
      setAvatarUrl(defaultAvatars[0]);
      setAvatarPreview(defaultAvatars[0]);
      setSelectedTimes([]);
      setNoSpecificTime(false);
      setDuration("7");
    }
  }, [editMode, initialData, open]);

  // העלאת תמונה
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
      await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("id", user.id);
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

  // שליחה
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
          onSuccess();
        },
        onError: () => {
          toast({
            title: "❌ שגיאה",
            description: "אירעה שגיאה בפרסום הבקשה",
            variant: "destructive",
          });
        },
      }
    );
  };

  if (!isLoggedIn) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-gray-900 shadow-lg" dir="rtl">
        <DialogHeader>
          <DialogTitle>
            {editMode ? "עריכת שותפות לימודים" : "✨ פרסום שותפות ללמידה"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Avatar Section */}
          <div>
            <Label>בחר תמונת פרופיל</Label>
            <div className="flex gap-3 items-center flex-wrap">
              <img src={avatarPreview} alt="Avatar Preview" className="w-16 h-16 rounded-full border-2 border-purple-300" />
              <Input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" id="avatarUpload" />
              <label htmlFor="avatarUpload" className="cursor-pointer flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-gray-500" />
                העלה תמונה
              </label>
              <Button variant="ghost" size="sm" onClick={() => handleAvatarChange(defaultAvatars[0])}>ברירת מחדל</Button>
            </div>
            <div className="grid grid-cols-4 gap-2 mt-3">
              {defaultAvatars.map((url, idx) => (
                <img
                  key={idx}
                  src={url}
                  alt={`Avatar ${idx}`}
                  className={`w-12 h-12 rounded-full border cursor-pointer ${avatarPreview === url ? "ring-2 ring-purple-400" : ""}`}
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
              className="bg-white dark:bg-slate-800 rounded-lg"
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
              className="bg-white dark:bg-slate-800 rounded-lg"
            />
          </div>
          {/* Time Selection */}
          <div>
            <Label>הוסף זמן למפגש</Label>
            <div className="flex items-center gap-2 mb-2">
              <input type="checkbox" checked={noSpecificTime} onChange={() => setNoSpecificTime(!noSpecificTime)} />
              <span className="text-sm">אין זמן מסוים</span>
            </div>
            {!noSpecificTime && (
              <>
                <div className="flex gap-2 mt-2 flex-wrap">
                  <Select value={newDay} onValueChange={setNewDay}>
                    <SelectTrigger>
                      <SelectValue placeholder="בחר יום" />
                    </SelectTrigger>
                    <SelectContent>
                      {daysOfWeek.map((day) => (
                        <SelectItem key={day} value={day}>{day}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={newStart} onValueChange={setNewStart}>
                    <SelectTrigger>
                      <SelectValue placeholder="שעת התחלה" />
                    </SelectTrigger>
                    <SelectContent>
                      {hours.map((hour) => (
                        <SelectItem key={hour} value={hour}>{hour}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={newEnd} onValueChange={setNewEnd}>
                    <SelectTrigger>
                      <SelectValue placeholder="שעת סיום" />
                    </SelectTrigger>
                    <SelectContent>
                      {hours.map((hour) => (
                        <SelectItem key={hour} value={hour}>{hour}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button type="button" onClick={addTimeSlot}>
                    ➕ הוסף
                  </Button>
                </div>
                <div className="mt-3 space-y-1">
                  {selectedTimes.map((t, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-gray-100 dark:bg-gray-800 p-2 rounded">
                      <span className="text-sm">📅 {t.day}, 🕒 {t.start}-{t.end}</span>
                      <Button size="sm" variant="outline" onClick={() => removeTimeSlot(idx)}>הסר</Button>
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
              onClick={onClose}
              className="text-gray-600 dark:text-gray-300"
            >
              <X className="w-5 h-5 ml-1" /> ביטול
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default StudyPartnerModal;
