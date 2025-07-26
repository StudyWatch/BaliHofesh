import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Star,
  Pencil,
  Save,
  MapPin,
  DollarSign,
  Clock,
  Award,
  Eye,
  EyeOff,
  User,
  Loader2,
  Mail,
  Phone,
} from "lucide-react";

const TutorDashboard = () => {
  const [tutor, setTutor] = useState<any>(null);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState<any>({});
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/login");
        return;
      }
      // נסה למצוא לפי user_id (עדיף מהשדה id)
      const { data, error } = await supabase
        .from("tutors")
        .select("*")
        .eq("user_id", user.id)
        .single();
      if (!data || error) {
        setError("לא נמצא פרופיל מורה פעיל.");
        setLoading(false);
        return;
      }
      setTutor(data);
      setForm(data);
      fetchReviews(data.id);
      setLoading(false);
    };
    load();
    // eslint-disable-next-line
  }, []);

  // שליפת ביקורות של המורה
  const fetchReviews = async (tutorId: string) => {
    const { data } = await supabase
      .from("tutor_reviews")
      .select(
        "id, review_text, rating, is_public, created_at, profiles(name, avatar_url)"
      )
      .eq("tutor_id", tutorId)
      .order("created_at", { ascending: false });
    setReviews(data || []);
  };

  // שמירת עדכוני פרופיל
  const handleSave = async () => {
    setSaving(true);
    setError(null);
    const { error } = await supabase
      .from("tutors")
      .update({
        name: form.name,
        hourly_rate: form.hourly_rate,
        trial_lesson: form.trial_lesson,
        trial_price: form.trial_price,
        location: form.location,
        description: form.description,
        experience: form.experience,
        availability: form.availability,
        is_online: form.is_online,
        is_verified: form.is_verified,
        phone: form.phone,
        email: form.email,
        avatar_url: form.avatar_url,
        tutor_page_promo: form.tutor_page_promo,
      })
      .eq("id", tutor.id);
    if (!error) {
      setTutor({ ...tutor, ...form });
      setEditMode(false);
    } else {
      setError("שגיאה בעדכון הפרופיל, נסה שוב.");
    }
    setSaving(false);
  };

  // הסתרה/הצגה של ביקורת
  const toggleReviewVisibility = async (reviewId: string, isPublic: boolean) => {
    await supabase
      .from("tutor_reviews")
      .update({ is_public: !isPublic })
      .eq("id", reviewId);
    fetchReviews(tutor.id);
  };

  if (loading)
    return (
      <div className="flex h-screen justify-center items-center bg-gradient-to-br from-blue-100 to-purple-100">
        <Loader2 className="animate-spin w-16 h-16 text-indigo-600" />
      </div>
    );

  if (error || !tutor) {
    return (
      <div className="flex flex-col items-center mt-24 text-center">
        <Award className="w-16 h-16 text-indigo-500 mb-4" />
        <p className="text-2xl font-bold text-red-600">{error || "מורה לא נמצא."}</p>
        <Button className="mt-4" onClick={() => navigate("/apply-tutor")}>
          הצטרף כמורה חדש
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 px-2" dir="rtl">
      <Card className="mb-8 shadow-2xl rounded-3xl bg-gradient-to-l from-blue-50 via-white to-indigo-100">
        <CardHeader>
          <CardTitle className="text-3xl font-bold flex gap-2 items-center">
            <Award className="w-8 h-8 text-indigo-700" />
            דף ניהול מורה
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col lg:flex-row gap-12">
            {/* פרטי מורה ועריכה */}
            <div className="flex-1 space-y-6">
              <div className="flex flex-col md:flex-row items-center gap-6 mb-4">
                {/* תמונת אווטאר */}
                <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-indigo-300 shadow bg-white flex items-center justify-center">
                  {tutor.avatar_url ? (
                    <img
                      src={tutor.avatar_url}
                      alt="avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-20 h-20 text-indigo-200" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    {editMode ? (
                      <Input
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        className="font-bold text-2xl w-48"
                        maxLength={30}
                        placeholder="שם מלא"
                      />
                    ) : (
                      <span className="font-bold text-2xl">{tutor.name}</span>
                    )}
                    {tutor.is_verified && (
                      <Badge className="bg-green-500 text-white ml-2">
                        מאומת
                      </Badge>
                    )}
                    {tutor.is_online && (
                      <span className="text-green-600 ml-2 font-bold animate-pulse">
                        ● זמין עכשיו
                      </span>
                    )}
                  </div>
                  <div className="flex gap-4 mt-2 text-gray-500">
                    <div className="flex items-center gap-1">
                      <Star className="w-5 h-5 text-yellow-400" />
                      <span>{tutor.rating?.toFixed(1) || "0.0"}</span>
                      <span className="text-xs ml-1">
                        ({tutor.reviews_count || 0} ביקורות)
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Mail className="w-4 h-4" />
                    {editMode ? (
                      <Input
                        value={form.email || ""}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        className="w-56"
                        placeholder="אימייל מורה"
                      />
                    ) : (
                      <span>{tutor.email}</span>
                    )}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Phone className="w-4 h-4" />
                    {editMode ? (
                      <Input
                        value={form.phone || ""}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        className="w-40"
                        placeholder="טלפון"
                      />
                    ) : (
                      <span>{tutor.phone}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* מחיר לשעה */}
                <div className="flex items-center gap-3">
                  <DollarSign className="w-5 h-5" />
                  {editMode ? (
                    <Input
                      type="number"
                      value={form.hourly_rate || ""}
                      min={40}
                      max={800}
                      onChange={(e) =>
                        setForm({ ...form, hourly_rate: +e.target.value })
                      }
                      className="w-28"
                      placeholder="מחיר לשעה"
                    />
                  ) : (
                    <span className="text-lg font-semibold">
                      ₪{tutor.hourly_rate} לשעה
                    </span>
                  )}
                </div>
                {/* שיעור ניסיון */}
                <div className="flex gap-4 items-center">
                  <Switch
                    checked={form.trial_lesson}
                    onCheckedChange={(checked) =>
                      setForm({ ...form, trial_lesson: checked })
                    }
                    id="trial_lesson"
                  />
                  <label htmlFor="trial_lesson" className="font-medium">
                    הצע שיעור ניסיון
                  </label>
                  {form.trial_lesson && (
                    <Input
                      type="number"
                      value={form.trial_price || ""}
                      onChange={(e) =>
                        setForm({ ...form, trial_price: +e.target.value })
                      }
                      className="w-28 ml-2"
                      placeholder="מחיר מיוחד"
                    />
                  )}
                </div>
                {/* מיקום */}
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5" />
                  {editMode ? (
                    <Input
                      value={form.location || ""}
                      onChange={(e) =>
                        setForm({ ...form, location: e.target.value })
                      }
                      className="w-36"
                      maxLength={24}
                      placeholder="איזור בארץ"
                    />
                  ) : (
                    <span>{tutor.location}</span>
                  )}
                </div>
                {/* זמינות */}
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5" />
                  {editMode ? (
                    <Input
                      value={form.availability || ""}
                      onChange={(e) =>
                        setForm({ ...form, availability: e.target.value })
                      }
                      className="w-36"
                      maxLength={32}
                      placeholder="זמינות"
                    />
                  ) : (
                    <span>{tutor.availability || "לא צוינה"}</span>
                  )}
                </div>
              </div>
              {/* תיאור אישי */}
              <div className="mb-4">
                <label className="block font-medium mb-1">תיאור אישי</label>
                {editMode ? (
                  <Textarea
                    value={form.description || ""}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                    rows={2}
                    className="w-full"
                    maxLength={600}
                  />
                ) : (
                  <p className="text-gray-700">{tutor.description}</p>
                )}
              </div>
              {/* ניסיון והכשרה */}
              <div className="mb-4">
                <label className="block font-medium mb-1">ניסיון והכשרה</label>
                {editMode ? (
                  <Textarea
                    value={form.experience || ""}
                    onChange={(e) =>
                      setForm({ ...form, experience: e.target.value })
                    }
                    rows={2}
                    className="w-full"
                    maxLength={300}
                  />
                ) : (
                  <p className="text-gray-700">{tutor.experience}</p>
                )}
              </div>
              {/* זמינות אונליין */}
              <div className="mb-4 flex gap-2 items-center">
                <Switch
                  checked={form.is_online}
                  onCheckedChange={(checked) =>
                    setForm({ ...form, is_online: checked })
                  }
                  id="is_online"
                />
                <label htmlFor="is_online" className="font-medium">
                  סמן כמורה זמין כעת
                </label>
              </div>
              {/* שורת כפתורים */}
              <div className="flex gap-4 mt-2">
                {editMode ? (
                  <Button
                    className="bg-indigo-600 text-white"
                    onClick={handleSave}
                    disabled={saving}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? "שומר..." : "שמור שינויים"}
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    className="border-indigo-500"
                    onClick={() => setEditMode(true)}
                  >
                    <Pencil className="w-4 h-4 mr-2" />
                    ערוך פרופיל
                  </Button>
                )}
              </div>
              {/* הצגת התראה על שגיאה */}
              {error && (
                <div className="mt-2 text-red-600 font-bold">{error}</div>
              )}
              {/* טקסט פרומו או שדה חדש */}
              <div className="mt-4">
                <label className="block font-medium mb-1">הצג משפט/מבצע בפרופיל</label>
                {editMode ? (
                  <Input
                    value={form.tutor_page_promo || ""}
                    onChange={(e) =>
                      setForm({ ...form, tutor_page_promo: e.target.value })
                    }
                    className="w-full"
                    maxLength={60}
                    placeholder="מבצע, משפט מיוחד, או כל מסר שיווקי"
                  />
                ) : (
                  <p className="text-indigo-700">{tutor.tutor_page_promo}</p>
                )}
              </div>
            </div>

            {/* ניהול ביקורות */}
            <div className="w-full lg:max-w-xs mt-12 lg:mt-0">
              <Card className="shadow bg-white/90">
                <CardHeader>
                  <CardTitle className="flex gap-2 items-center">
                    <Star className="w-5 h-5 text-yellow-500" />
                    ניהול ביקורות
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {reviews.length === 0 && (
                    <div className="text-gray-400 text-center py-3">
                      אין עדיין ביקורות
                    </div>
                  )}
                  <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                    {reviews.map((r) => (
                      <div
                        key={r.id}
                        className="flex gap-3 items-center justify-between p-2 rounded bg-gray-50"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <Star className="w-4 h-4 text-yellow-400" />
                            <span className="font-bold">{r.rating}</span>
                            <span className="text-xs text-gray-500 ml-2">
                              {r.profiles?.name || "סטודנט"}
                            </span>
                          </div>
                          <div className="text-sm text-gray-700 mt-1">{r.review_text}</div>
                        </div>
                        <Button
                          size="sm"
                          variant={r.is_public ? "outline" : "secondary"}
                          className="rounded-full p-2"
                          onClick={() => toggleReviewVisibility(r.id, r.is_public)}
                          title={r.is_public ? "הסתר מהפרופיל" : "הצג בפרופיל"}
                        >
                          {r.is_public ? <EyeOff /> : <Eye />}
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TutorDashboard;
