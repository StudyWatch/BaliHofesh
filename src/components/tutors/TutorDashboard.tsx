// /components/tutors/TutorDashboard.tsx

import React, { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import {
  Card, CardHeader, CardTitle, CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as ChartTooltip, PieChart, Pie, Cell, Legend } from "recharts";
import {
  Star, MapPin, Phone, Mail, BookOpen, Clock, DollarSign,
  GraduationCap, Award, EyeOff, Eye, Pencil, Save, Users, PlusCircle, Calendar,
  Trash2, MessageSquare, Info, Book, UploadCloud, ExternalLink
} from "lucide-react";
import { format, parseISO } from "date-fns";
import clsx from "clsx";

const glassCard = "bg-white/60 backdrop-blur-md rounded-3xl shadow-2xl border border-white/30";
const sectionTitle = "text-2xl font-bold flex gap-2 items-center";
const label = "block font-medium mb-1 text-indigo-800";
const value = "text-gray-800";
const gradientBg = "bg-gradient-to-br from-indigo-100 via-purple-100 to-blue-50";

type Course = { id: string, name_he: string, code?: string, semester?: string };
type Student = { id: string, name: string, email: string, avatar_url?: string };
type Review = {
  id: string, tutor_id: string, user_id: string, review_text: string,
  rating: number, is_public: boolean, created_at: string,
  profiles: { name: string, avatar_url?: string },
};
type Offer = { id: string, title: string, description: string, price: number, active: boolean };

type Session = {
  id: string, title: string, date: string, user_id: string, course_id: string,
  participants: Student[],
};

type Notification = {
  id: string, message: string, type: "booking" | "review" | "reminder" | "general",
  created_at: string, link?: string, read: boolean
};

const defaultOffers: Offer[] = [
  { id: "1", title: "שיעור ראשון ב־50% הנחה", description: "הזדמנות להצטרף ולנסות!", price: 0, active: true }
];

const TutorDashboard: React.FC = () => {
  // STATE (הרבה state כי יש הרבה תצוגות)
  const [tab, setTab] = useState("stats");
  const [tutor, setTutor] = useState<any>(null);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState<any>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [coursesSearch, setCoursesSearch] = useState("");
  const [students, setStudents] = useState<Student[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>({});
  const [calendarEvents, setCalendarEvents] = useState<Session[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [uploading, setUploading] = useState(false);
  const [showAddSession, setShowAddSession] = useState(false);
  const [newSession, setNewSession] = useState<any>({});
  const { toast } = useToast();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ========== INIT ==========
  useEffect(() => { load(); }, []);

  // ========== LOAD ==========
  const load = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate('/login'); return; }
    // פרטי מורה
    const { data: tutorData, error } = await supabase
      .from('tutors').select('*').eq('id', user.id).single();
    if (!tutorData || error) { setLoading(false); return; }
    setTutor(tutorData);
    setForm(tutorData);
    setSelectedCourses(tutorData.courses || []);
    // קורסים
    const { data: allCourses } = await supabase
      .from('courses')
      .select('id, name_he, code, semester');
    setAllCourses(allCourses || []);
    // מפגשים
    const { data: sessions } = await supabase
      .from('shared_sessions')
      .select('id, title, date, user_id, course_id, participants:profiles(id,name,avatar_url,email)')
      .eq('user_id', user.id)
      .order('date', { ascending: false });
    setCalendarEvents(sessions || []);
    // סטודנטים ייחודיים מתוך המפגשים
    const studentsSet: { [k: string]: Student } = {};
    (sessions || []).forEach((sess: any) => {
      (sess.participants || []).forEach((p: any) => {
        if (p.id) studentsSet[p.id] = p;
      });
    });
    setStudents(Object.values(studentsSet));
    // ביקורות
    const { data: reviews } = await supabase
      .from('tutor_reviews')
      .select('id, review_text, rating, is_public, created_at, profiles(name, avatar_url)')
      .eq('tutor_id', user.id)
      .order('created_at', { ascending: false });
    setReviews(reviews || []);
    // התראות (דמה, אמיתי: למשוך מטבלת notifications)
    setNotifications([
      { id: "n1", message: "קיבלת פנייה לתיאום שיעור!", type: "booking", created_at: new Date().toISOString(), link: "#", read: false },
      { id: "n2", message: "סטודנט כתב ביקורת חדשה!", type: "review", created_at: new Date().toISOString(), read: false },
    ]);
    // מבצעים
    setOffers(defaultOffers);
    // סטטיסטיקות
    setStats({
      lessons: (sessions || []).length,
      unique_students: Object.keys(studentsSet).length,
      avg_rating: reviews && reviews.length ? (
        (reviews.reduce((acc, r) => acc + (r.rating || 0), 0) / reviews.length).toFixed(2)
      ) : 0,
      reviews_count: reviews ? reviews.length : 0,
      revenue: ((sessions || []).length * (tutorData.hourly_rate || 0)),
    });
    setLoading(false);
  };

  // ========== PROFILE ==========

  // עדכון פרופיל
  const handleSave = async () => {
    const { error } = await supabase
      .from('tutors')
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
        courses: selectedCourses,
        avatar_url: form.avatar_url,
      })
      .eq('id', tutor.id);
    if (!error) {
      setTutor({ ...tutor, ...form, courses: selectedCourses });
      setEditMode(false);
      toast({ title: "הפרופיל עודכן בהצלחה!" });
    }
  };

  // העלאת תמונה
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fileExt = file.name.split('.').pop();
    const filePath = `avatars/${tutor.id}.${fileExt}`;
    const { error: uploadError } = await supabase.storage
      .from('avatars').upload(filePath, file, { upsert: true });
    if (!uploadError) {
      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      setForm({ ...form, avatar_url: data.publicUrl });
      toast({ title: "תמונת הפרופיל הועלתה בהצלחה!" });
    } else {
      toast({ title: "שגיאה בהעלאת תמונה", variant: "destructive" });
    }
    setUploading(false);
  };

  // ========== COURSES ==========
  const addCourse = (courseId: string) => {
    if (!selectedCourses.includes(courseId)) {
      setSelectedCourses([...selectedCourses, courseId]);
    }
  };
  const removeCourse = (courseId: string) => {
    setSelectedCourses(selectedCourses.filter(id => id !== courseId));
  };

  // ========== OFFERS ==========
  const addOffer = () => {
    setOffers([...offers, { id: String(Date.now()), title: "", description: "", price: 0, active: true }]);
  };
  const handleOfferChange = (index: number, key: string, value: any) => {
    setOffers(offers.map((offer, i) => i === index ? { ...offer, [key]: value } : offer));
  };
  const removeOffer = (id: string) => {
    setOffers(offers.filter(o => o.id !== id));
  };

  // ========== SESSIONS ==========
  const handleAddSession = async () => {
    if (!newSession.title || !newSession.date) return toast({ title: "נא למלא את כל השדות", variant: "destructive" });
    await supabase.from("shared_sessions").insert({
      title: newSession.title,
      date: newSession.date,
      user_id: tutor.id,
      course_id: newSession.course_id
    });
    setShowAddSession(false);
    setNewSession({});
    load();
    toast({ title: "מפגש חדש נוסף!" });
  };

  // ========== REVIEWS ==========
  const toggleReviewVisibility = async (reviewId: string, isPublic: boolean) => {
    await supabase
      .from('tutor_reviews')
      .update({ is_public: !isPublic })
      .eq('id', reviewId);
    load();
  };

  // ========== UTILITIES ==========
  const colors = ['#6366f1', '#a21caf', '#f59e42', '#38bdf8', '#ef4444', '#16a34a'];
  const pieColors = ["#a78bfa", "#facc15", "#38bdf8", "#f59e42", "#16a34a"];

  if (loading || !form) return (
    <div className="flex h-screen justify-center items-center bg-gradient-to-br from-blue-100 to-purple-100">
      <div className="animate-spin rounded-full h-14 w-14 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <div className={`${gradientBg} min-h-screen w-full`}>
      <div className="max-w-6xl mx-auto py-10 px-2" dir="rtl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-indigo-900">ברוך הבא, {form.name}!</h1>
            <div className="flex gap-2 mt-2">
              <Badge className="bg-indigo-100 text-indigo-600">דשבורד מורה</Badge>
              {tutor.is_verified && (
                <Badge className="bg-green-500 text-white flex items-center">
                  <Award className="w-3 h-3 mr-1" /> מאומת
                </Badge>
              )}
              {form.is_online && (
                <span className="flex items-center gap-1 text-green-600">
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-sm">זמין</span>
                </span>
              )}
            </div>
          </div>
          <div>
            <Button size="sm" variant="secondary" onClick={load}>רענן נתונים</Button>
          </div>
        </div>

        {/* התראות */}
        <div className="mb-8">
          <div className="flex gap-2 items-center mb-2">
            <Info className="w-5 h-5 text-blue-500" />
            <span className="font-bold">התראות אחרונות</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            {notifications.map((n) => (
              <Badge key={n.id} className={clsx("text-sm px-3 py-2", n.read ? "bg-gray-200 text-gray-500" : "bg-blue-200 text-blue-800")}>
                <span className="mr-2">{n.message}</span>
                {n.link && <a href={n.link} target="_blank" rel="noopener noreferrer"><ExternalLink className="w-4 h-4" /></a>}
              </Badge>
            ))}
          </div>
        </div>

        {/* כרטיסי נתונים מהירים */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 bg-white/90 shadow rounded-xl flex flex-col items-center">
            <div className="text-gray-600 text-sm mb-2">שיעורים</div>
            <div className="text-3xl font-bold text-indigo-700">{stats.lessons}</div>
          </Card>
          <Card className="p-6 bg-white/90 shadow rounded-xl flex flex-col items-center">
            <div className="text-gray-600 text-sm mb-2">תלמידים שונים</div>
            <div className="text-3xl font-bold text-green-600">{stats.unique_students}</div>
          </Card>
          <Card className="p-6 bg-white/90 shadow rounded-xl flex flex-col items-center">
            <div className="text-gray-600 text-sm mb-2">הכנסה (₪)</div>
            <div className="text-3xl font-bold text-blue-500">{stats.revenue}</div>
          </Card>
          <Card className="p-6 bg-white/90 shadow rounded-xl flex flex-col items-center">
            <div className="text-gray-600 text-sm mb-2">ממוצע דירוג</div>
            <div className="text-3xl font-bold text-yellow-500">{stats.avg_rating} <Star className="inline-block w-7 h-7 -mt-1" /></div>
          </Card>
        </div>

        <Card className={`${glassCard} mb-8`}>
          <CardHeader>
            <CardTitle className={sectionTitle}>
              <Award className="w-6 h-6 text-indigo-700" />
              ניהול מתקדם
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={tab} onValueChange={setTab}>
              <TabsList className="bg-gradient-to-l from-blue-200 to-purple-100 rounded-xl shadow mb-4 flex flex-wrap">
                <TabsTrigger value="stats">📊 נתונים</TabsTrigger>
                <TabsTrigger value="profile">👤 פרופיל</TabsTrigger>
                <TabsTrigger value="courses">📚 קורסים</TabsTrigger>
                <TabsTrigger value="students">🧑‍🎓 תלמידים</TabsTrigger>
                <TabsTrigger value="reviews">⭐ ביקורות</TabsTrigger>
                <TabsTrigger value="offers">🎁 מבצעים</TabsTrigger>
                <TabsTrigger value="calendar">🗓️ מפגשים</TabsTrigger>
                <TabsTrigger value="settings">⚙️ הגדרות</TabsTrigger>
              </TabsList>

              {/* ----- TAB: נתונים וגרפים ----- */}
              <TabsContent value="stats">
                <div className="grid md:grid-cols-2 gap-8 mb-10">
                  {/* בר גרף דירוגים */}
                  <Card className="p-6 bg-white/90 shadow rounded-xl flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Star className="w-5 h-5 text-yellow-400" />
                      <div className="text-lg font-bold">פיזור דירוגים</div>
                    </div>
                    <ResponsiveContainer width="100%" height={210}>
                      <BarChart data={[
                        { name: '5 כוכבים', value: reviews.filter(r => r.rating === 5).length },
                        { name: '4 כוכבים', value: reviews.filter(r => r.rating === 4).length },
                        { name: '3 כוכבים', value: reviews.filter(r => r.rating === 3).length },
                        { name: '2 כוכבים', value: reviews.filter(r => r.rating === 2).length },
                        { name: '1 כוכב', value: reviews.filter(r => r.rating === 1).length },
                      ]}>
                        <XAxis dataKey="name" />
                        <YAxis allowDecimals={false} />
                        <Bar dataKey="value" fill={colors[0]} radius={[8,8,0,0]} />
                        <ChartTooltip />
                      </BarChart>
                    </ResponsiveContainer>
                  </Card>
                  {/* Pie של סוגי שיעורים */}
                  <Card className="p-6 bg-white/90 shadow rounded-xl flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <BookOpen className="w-5 h-5 text-blue-500" />
                      <div className="text-lg font-bold">התפלגות קורסים</div>
                    </div>
                    <ResponsiveContainer width="100%" height={210}>
                      <PieChart>
                        <Pie
                          data={selectedCourses.map(id => {
                            const course = allCourses.find(c => c.id === id);
                            return { name: course?.name_he || "לא ידוע", value: 1 };
                          })}
                          cx="50%" cy="50%" outerRadius={80} dataKey="value" label
                        >
                          {selectedCourses.map((_, i) => <Cell key={i} fill={pieColors[i % pieColors.length]} />)}
                        </Pie>
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </Card>
                </div>
              </TabsContent>

              {/* ----- TAB: פרופיל ----- */}
              <TabsContent value="profile">
                <div className="flex flex-col md:flex-row gap-8 items-start">
                  <div className="flex-1">
                    {/* תמונה + כפתור העלאה */}
                    <div className="flex items-center gap-4 mb-6">
                      <Avatar className="w-20 h-20 shadow-xl relative">
                        <AvatarImage src={form.avatar_url || undefined} />
                        <AvatarFallback>{form.name?.charAt(0) || 'M'}</AvatarFallback>
                        <Button
                          size="icon"
                          className="absolute bottom-0 left-0 w-8 h-8 rounded-full bg-indigo-200/80 hover:bg-indigo-300"
                          onClick={() => fileInputRef.current?.click()}
                          title="העלה תמונה"
                          disabled={uploading}
                        >
                          <UploadCloud className="w-4 h-4" />
                          <input
                            ref={fileInputRef}
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={handleAvatarUpload}
                          />
                        </Button>
                      </Avatar>
                      <div>
                        <h1 className="text-3xl font-bold text-indigo-900 mb-1">{form.name}</h1>
                        <div className="flex gap-2 mt-1">
                          {tutor.is_verified && (
                            <Badge className="bg-green-500 text-white">
                              <Award className="w-3 h-3 mr-1" />
                              מאומת
                            </Badge>
                          )}
                          {form.is_online && (
                            <span className="flex items-center gap-1 text-green-600">
                              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
                              <span className="text-sm">זמין</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-6 text-indigo-900 mb-6">
                      <div className="flex items-center gap-3">
                        <DollarSign className="w-5 h-5" />
                        {editMode ? (
                          <Input
                            type="number"
                            value={form.hourly_rate}
                            min={40}
                            max={600}
                            onChange={e => setForm({ ...form, hourly_rate: +e.target.value })}
                            className="w-24"
                          />
                        ) : (
                          <span className="text-lg font-semibold">₪{form.hourly_rate} לשעה</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <MapPin className="w-5 h-5" />
                        {editMode ? (
                          <Input
                            value={form.location}
                            onChange={e => setForm({ ...form, location: e.target.value })}
                            className="w-36"
                            maxLength={24}
                          />
                        ) : (
                          <span>{form.location}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <Clock className="w-5 h-5" />
                        {editMode ? (
                          <Input
                            value={form.availability || ''}
                            onChange={e => setForm({ ...form, availability: e.target.value })}
                            className="w-36"
                            maxLength={32}
                          />
                        ) : (
                          <span>{form.availability || "לא צוינה"}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-4 items-center mb-4">
                      <Switch
                        checked={form.trial_lesson}
                        onCheckedChange={checked => setForm({ ...form, trial_lesson: checked })}
                        id="trial_lesson"
                      />
                      <label htmlFor="trial_lesson" className="font-medium">
                        הצע שיעור ניסיון
                      </label>
                      {form.trial_lesson && (
                        <Input
                          type="number"
                          value={form.trial_price || ''}
                          onChange={e => setForm({ ...form, trial_price: +e.target.value })}
                          className="w-28 ml-2"
                          placeholder="מחיר מיוחד"
                        />
                      )}
                    </div>
                    <div className="mb-4">
                      <label className={label}>תיאור אישי</label>
                      {editMode ? (
                        <Textarea
                          value={form.description || ''}
                          onChange={e => setForm({ ...form, description: e.target.value })}
                          rows={2}
                          className="w-full"
                          maxLength={600}
                        />
                      ) : (
                        <p className={value}>{form.description}</p>
                      )}
                    </div>
                    <div className="mb-4">
                      <label className={label}>ניסיון והכשרה</label>
                      {editMode ? (
                        <Textarea
                          value={form.experience || ''}
                          onChange={e => setForm({ ...form, experience: e.target.value })}
                          rows={2}
                          className="w-full"
                          maxLength={300}
                        />
                      ) : (
                        <p className={value}>{form.experience}</p>
                      )}
                    </div>
                    <div className="flex gap-3">
                      {editMode ? (
                        <Button className="bg-indigo-600 text-white" onClick={handleSave}>
                          <Save className="w-4 h-4 mr-2" />
                          שמור שינויים
                        </Button>
                      ) : (
                        <Button variant="outline" className="border-indigo-500" onClick={() => setEditMode(true)}>
                          <Pencil className="w-4 h-4 mr-2" />
                          ערוך פרופיל
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* ----- TAB: קורסים ----- */}
              <TabsContent value="courses">
                <div className="flex flex-col md:flex-row gap-8">
                  <div className="flex-1">
                    <label className={label}>הוסף קורס שאתה מלמד</label>
                    <div className="flex gap-2 mb-4">
                      <Input
                        type="text"
                        placeholder="חפש לפי שם או קוד..."
                        value={coursesSearch}
                        onChange={e => setCoursesSearch(e.target.value)}
                        className="w-64"
                      />
                      <Button variant="outline" onClick={() => setCoursesSearch('')}>נקה</Button>
                    </div>
                    <div className="max-h-56 overflow-y-auto border rounded-lg p-2 mb-4 bg-white/80">
                      {(allCourses.filter(c =>
                        c.name_he.includes(coursesSearch) ||
                        (c.code && c.code.includes(coursesSearch))
                      )).map((course) => (
                        <div key={course.id} className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{course.name_he}</span>
                          {course.code && <Badge>{course.code}</Badge>}
                          <Button
                            size="xs"
                            variant={selectedCourses.includes(course.id) ? "secondary" : "outline"}
                            onClick={() =>
                              selectedCourses.includes(course.id)
                                ? removeCourse(course.id)
                                : addCourse(course.id)
                            }
                            className="ml-auto"
                          >
                            {selectedCourses.includes(course.id) ? "הסר" : "הוסף"}
                          </Button>
                        </div>
                      ))}
                    </div>
                    <div>
                      <h3 className="font-bold mb-2">קורסים שלך:</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedCourses.map(id => {
                          const course = allCourses.find(c => c.id === id);
                          return (
                            <Badge key={id} variant="secondary" className="px-3 py-2 text-md">
                              {course?.name_he || "קורס"} <span className="ml-1">{course?.code}</span>
                              <Button size="xs" variant="ghost" onClick={() => removeCourse(id)}>
                                ✕
                              </Button>
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* ----- TAB: תלמידים ----- */}
              <TabsContent value="students">
                <div className="mb-6">
                  <h3 className={sectionTitle}>
                    <Users className="w-5 h-5" />
                    תלמידים שלמדו איתך (או פנו אליך)
                  </h3>
                </div>
                <div className="grid md:grid-cols-3 gap-6">
                  {students.length === 0 && <div className="text-gray-400 text-center">אין עדיין תלמידים.</div>}
                  {students.map((s, i) => (
                    <Card className="bg-white/90 shadow-md p-4 flex flex-col items-center" key={i}>
                      <Avatar className="w-14 h-14 mb-2">
                        <AvatarImage src={s.avatar_url || undefined} />
                        <AvatarFallback>{s.name?.charAt(0) || 'S'}</AvatarFallback>
                      </Avatar>
                      <div className="font-bold">{s.name}</div>
                      <div className="text-xs text-gray-500">{s.email}</div>
                      <Button size="sm" className="mt-2 bg-blue-500 text-white">
                        <MessageSquare className="w-4 h-4 mr-1" /> שלח הודעה
                      </Button>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* ----- TAB: ביקורות ----- */}
              <TabsContent value="reviews">
                <div className="mb-4 flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-500" />
                  <span className="font-bold">ביקורות מהסטודנטים</span>
                </div>
                <div className="space-y-3">
                  {reviews.length === 0 && (
                    <div className="text-gray-400 text-center py-3">
                      אין עדיין ביקורות
                    </div>
                  )}
                  {reviews.map((r) => (
                    <Card key={r.id} className="p-4 bg-white/95 shadow flex flex-col md:flex-row items-start gap-4">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={r.profiles?.avatar_url || undefined} />
                        <AvatarFallback>{r.profiles?.name?.charAt(0) || 'S'}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex gap-2 items-center">
                          {[...Array(r.rating)].map((_, i) =>
                            <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          )}
                          <span className="text-gray-700 font-bold">{r.profiles?.name}</span>
                        </div>
                        <p className="text-gray-700 mt-2">{r.review_text}</p>
                        <div className="text-xs text-gray-500 mt-1">{format(parseISO(r.created_at), 'dd/MM/yy')}</div>
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
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* ----- TAB: מבצעים ----- */}
              <TabsContent value="offers">
                <div className="mb-4 flex items-center gap-2">
                  <PlusCircle className="w-5 h-5 text-green-500" />
                  <span className="font-bold">נהל מבצעים אישיים</span>
                  <Button size="sm" onClick={addOffer}>הוסף מבצע</Button>
                </div>
                <div className="space-y-3">
                  {offers.length === 0 && (
                    <div className="text-gray-400 text-center py-3">
                      אין מבצעים כרגע.
                    </div>
                  )}
                  {offers.map((offer, i) => (
                    <Card key={offer.id} className="p-4 bg-white/95 shadow flex flex-col md:flex-row items-center gap-4">
                      <Input
                        className="mb-2"
                        value={offer.title}
                        onChange={e => handleOfferChange(i, 'title', e.target.value)}
                        placeholder="כותרת מבצע"
                      />
                      <Textarea
                        className="mb-2"
                        value={offer.description}
                        onChange={e => handleOfferChange(i, 'description', e.target.value)}
                        rows={2}
                        placeholder="תיאור מבצע"
                      />
                      <Input
                        type="number"
                        className="mb-2 w-32"
                        value={offer.price}
                        onChange={e => handleOfferChange(i, 'price', +e.target.value)}
                        placeholder="מחיר"
                      />
                      <Switch
                        checked={offer.active}
                        onCheckedChange={checked => handleOfferChange(i, 'active', checked)}
                        id={`offer_active_${i}`}
                      />
                      <label htmlFor={`offer_active_${i}`} className="font-medium">פעיל</label>
                      <Button variant="ghost" size="icon" onClick={() => removeOffer(offer.id)} title="מחק">
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* ----- TAB: מפגשים / לוח שנה ----- */}
              <TabsContent value="calendar">
                <div className="mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-500" />
                  <span className="font-bold">לוח שיעורים/פגישות</span>
                  <Button size="sm" onClick={() => setShowAddSession(true)}><PlusCircle className="w-4 h-4 mr-1" />הוסף מפגש</Button>
                </div>
                {showAddSession && (
                  <div className="p-4 bg-white/90 rounded-xl shadow mb-4 flex gap-4 flex-wrap">
                    <Input
                      placeholder="שם המפגש"
                      value={newSession.title || ""}
                      onChange={e => setNewSession({ ...newSession, title: e.target.value })}
                      className="w-60"
                    />
                    <Input
                      type="date"
                      value={newSession.date || ""}
                      onChange={e => setNewSession({ ...newSession, date: e.target.value })}
                      className="w-40"
                    />
                    <select
                      className="rounded-lg border p-2"
                      value={newSession.course_id || ""}
                      onChange={e => setNewSession({ ...newSession, course_id: e.target.value })}
                    >
                      <option value="">בחר קורס</option>
                      {selectedCourses.map(id => {
                        const course = allCourses.find(c => c.id === id);
                        return <option value={id} key={id}>{course?.name_he}</option>;
                      })}
                    </select>
                    <Button onClick={handleAddSession} className="bg-indigo-600 text-white">
                      הוסף
                    </Button>
                    <Button variant="outline" onClick={() => setShowAddSession(false)}>
                      בטל
                    </Button>
                  </div>
                )}
                <div className="space-y-3">
                  {calendarEvents.length === 0 && (
                    <div className="text-gray-400 text-center py-3">
                      אין עדיין שיעורים עתידיים
                    </div>
                  )}
                  {calendarEvents.map(ev => (
                    <Card key={ev.id} className="p-4 bg-white/95 shadow flex flex-col md:flex-row items-center gap-4">
                      <div className="text-lg font-bold">{ev.title}</div>
                      <div className="text-gray-600">{ev.date && format(parseISO(ev.date), 'dd/MM/yyyy')}</div>
                      <div className="flex gap-2 items-center">
                        {ev.participants && ev.participants.length > 0 && (
                          <>
                            <span className="font-semibold ml-2">סטודנטים:</span>
                            {ev.participants.map((s, i) =>
                              <Avatar key={s.id} className="w-7 h-7 ml-1">
                                <AvatarImage src={s.avatar_url || undefined} />
                                <AvatarFallback>{s.name?.charAt(0) || "S"}</AvatarFallback>
                              </Avatar>
                            )}
                          </>
                        )}
                      </div>
                      <Button size="sm" variant="outline">צפה בפרטים</Button>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* ----- TAB: הגדרות/פיצ'רים עתידיים ----- */}
              <TabsContent value="settings">
                <div className="mb-4 flex items-center gap-2">
                  <SettingsIcon /> <span className="font-bold">הגדרות ופיצ'רים מתקדמים</span>
                </div>
                <div className="p-4 bg-white/80 rounded-xl shadow">
                  <ul className="list-disc list-inside text-gray-700 space-y-2">
                    <li>הפעל/כבה התראות</li>
                    <li>היסטוריית משיכות ותשלומים</li>
                    <li>קישור ל־WhatsApp להודעות מהירות</li>
                    <li>ייבוא תלמידים מקובץ Excel</li>
                    <li>API אישי לסינכרון מול יומן Google</li>
                  </ul>
                  <Button variant="secondary" className="mt-4">פיצ'רים בקרוב 🚀</Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
      <style>{`
        body {
          background: linear-gradient(120deg,#dbeafe 0%,#f3e8ff 100%);
        }
        .glass-blur {
          backdrop-filter: blur(18px) saturate(110%);
          background: rgba(255,255,255,0.5);
        }
      `}</style>
    </div>
  );
};

// Dummy icon for settings tab
function SettingsIcon() {
  return <svg width="22" height="22" viewBox="0 0 20 20" fill="none" className="inline-block mr-2"><path d="M10 13.333a3.333 3.333 0 100-6.666 3.333 3.333 0 000 6.666zm8.167-4.833c.056-.472-.338-.834-.789-.834h-1.73a6.675 6.675 0 00-.583-1.399l1.23-1.229c.326-.326.326-.857 0-1.183l-1.18-1.18a.834.834 0 00-1.183 0l-1.23 1.23c-.435-.278-.9-.513-1.398-.582V2.62c0-.451-.362-.845-.834-.789h-1.667a.834.834 0 00-.834.789v1.73c-.498.069-.963.304-1.398.582L4.543 3.702a.834.834 0 00-1.183 0l-1.18 1.18a.834.834 0 000 1.183l1.23 1.229a6.675 6.675 0 00-.583 1.399H2.62a.834.834 0 00-.789.834v1.667c.056.472.338.834.789.834h1.73c.07.498.305.963.583 1.398l-1.23 1.23a.834.834 0 000 1.183l1.18 1.18c.326.326.857.326 1.183 0l1.23-1.23c.435.278.9.513 1.398.582v1.73c0 .451.362.845.834.789h1.667a.834.834 0 00.834-.789v-1.73c.498-.07.963-.304 1.398-.582l1.23 1.23a.834.834 0 001.183 0l1.18-1.18a.834.834 0 000-1.183l-1.23-1.23c.278-.435.513-.9.582-1.398h1.73a.834.834 0 00.789-.834v-1.667z" fill="#6366f1"/></svg>
}

export default TutorDashboard;
