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

// סוגי טיפוסים:
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

// הצעות ברירת מחדל:
const defaultOffers: Offer[] = [
  { id: "1", title: "שיעור ראשון ב־50% הנחה", description: "הזדמנות להצטרף ולנסות!", price: 0, active: true }
];

// הרכיב הראשי
const TutorDashboard: React.FC = () => {
  // STATE (הרבה state כי יש הרבה תצוגות)
  const [tab, setTab] = useState("stats");
  const [tutor, setTutor] = useState<Tutor | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState<Tutor | null>(null);
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
  const [newSession, setNewSession] = useState<Partial<Session>>({});
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
        name: form?.name,
        hourly_rate: form?.hourly_rate,
        trial_lesson: form?.trial_lesson,
        trial_price: form?.trial_price,
        location: form?.location,
        description: form?.description,
        experience: form?.experience,
        availability: form?.availability,
        is_online: form?.is_online,
        courses: selectedCourses,
        avatar_url: form?.avatar_url,
      })
      .eq('id', tutor?.id);
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
    const filePath = `avatars/${tutor?.id}.${fileExt}`;
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
    if (!newSession?.title || !newSession?.date) return toast({ title: "נא למלא את כל השדות", variant: "destructive" });
    await supabase.from("shared_sessions").insert({
      title: newSession?.title,
      date: newSession?.date,
      user_id: tutor?.id,
      course_id: newSession?.course_id
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
            <h1 className="text-3xl font-bold text-indigo-900">ברוך הבא, {form?.name}!</h1>
            <div className="flex gap-2 mt-2">
              <Badge className="bg-indigo-100 text-indigo-600">דשבורד מורה</Badge>
              {tutor?.is_verified && (
                <Badge className="bg-green-500 text-white flex items-center">
                  <Award className="w-3 h-3 mr-1" /> מאומת
                </Badge>
              )}
              {form?.is_online && (
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
            <div className="text-gray-600 text-sm mb-2">
