import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  Star,
  MessageSquare,
  Search,
  Filter,
  Plus,
  Users,
  Clock,
  Heart,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  UserPlus,
  Pencil,
  Trash2,
  Sparkles,
  Reply,
  X
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { useLecturerRatings, useLecturerReviews, useCourseLecturers, useSubmitLecturerReview, useAddLecturer, useUserLecturerReview, useDeleteLecturerReview } from "@/hooks/useLecturerRatings";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/App";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { AnimatePresence, motion } from "framer-motion";

// ---- תצוגת כוכבים מודרנית + RTL ----
function renderStars(
  rating: number,
  size: "sm" | "md" | "lg" = "md",
  interactive = false,
  onClick?: (n: number) => void,
  rtl = true,
  hovered = 0,
  onHover?: (n: number) => void,
  onHoverEnd?: () => void
) {
  const sizeClass = size === "sm" ? "w-3 h-3" : size === "lg" ? "w-8 h-8" : "w-6 h-6";
  return (
    <div className={`flex ${rtl ? "flex-row-reverse" : ""} gap-0.5 items-center`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={interactive ? "cursor-pointer transition-transform hover:scale-110" : ""}
          onClick={() => interactive && onClick && onClick(star)}
          onMouseEnter={() => interactive && onHover && onHover(star)}
          onMouseLeave={() => interactive && onHoverEnd && onHoverEnd()}
        >
          <Star
            className={`
              ${sizeClass}
              ${(hovered ? star <= hovered : star <= Math.round(rating))
                ? "fill-yellow-400 text-yellow-400 drop-shadow"
                : "text-gray-300"}
              transition-colors
            `}
          />
        </span>
      ))}
    </div>
  );
}

// ---- פידבק טקסטואלי לכוכבים ----
function getRatingDesc(n: number) {
  return (
    {
      1: "גרוע מאוד",
      2: "גרוע",
      3: "בסדר",
      4: "טוב",
      5: "מעולה"
    }[n] || ""
  );
}

// ---- אייקונים לכל פרמטר ----
const parameterIcons = {
  teaching_quality: { icon: Users, label: "איכות הוראה", color: "text-blue-600" },
  lecturer_availability: { icon: Clock, label: "זמינות", color: "text-green-600" },
  personal_approach: { icon: Heart, label: "יחס אישי", color: "text-purple-600" }
};

const GRADIENTS = [
  "from-yellow-50 to-orange-100",
  "from-gray-50 to-slate-200",
  "from-orange-50 to-red-100",
  "from-blue-50 to-purple-100"
];

// ---- מודול דירוג/עריכה/הוספה למרצה ----
function LecturerReviewForm({ lecturers, courseId, onSuccess, editData, isRTL = true }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedLecturer, setSelectedLecturer] = useState(editData?.lecturer_id || "");
  const [ratings, setRatings] = useState({
    teaching_quality: editData?.teaching_quality || 0,
    lecturer_availability: editData?.lecturer_availability || 0,
    personal_approach: editData?.personal_approach || 0
  });
  const [hovered, setHovered] = useState<{ [k: string]: number }>({});
  const [comment, setComment] = useState(editData?.comment || "");
  const [showAddLecturer, setShowAddLecturer] = useState(false);
  const [newLecturerName, setNewLecturerName] = useState("");
  const [suggestedLecturers, setSuggestedLecturers] = useState<any[]>([]);
  const submitReview = useSubmitLecturerReview();
  const addLecturer = useAddLecturer();

  // הגשת דירוג
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({ title: "התחברות נדרשת", description: "יש להתחבר כדי לדרג מרצה", variant: "destructive" });
      return;
    }
    const allRated = Object.values(ratings).every((r) => r > 0);
    if (!selectedLecturer || !allRated) {
      toast({ title: "שגיאה", description: "אנא מלא את כל הדירוגים", variant: "destructive" });
      return;
    }
    try {
      await submitReview.mutateAsync({
        lecturer_id: selectedLecturer,
        course_id: courseId,
        teaching_quality: ratings.teaching_quality,
        lecturer_availability: ratings.lecturer_availability,
        personal_approach: ratings.personal_approach,
        comment: comment.trim()
      });
      toast({ title: "הדירוג נשמר!", description: "הדירוג שלך נוסף בהצלחה" });
      onSuccess?.();
    } catch {
      toast({ title: "שגיאה", description: "אירעה שגיאה בשליחה", variant: "destructive" });
    }
  };

  // הוספת מרצה
  const handleAddLecturer = async () => {
    if (!newLecturerName.trim()) return;
    try {
      const result = await addLecturer.mutateAsync({
        name: newLecturerName.trim(),
        course_id: courseId
      });
      if (result.existing) {
        setSuggestedLecturers(result.existing);
        toast({ title: "מרצים דומים נמצאו", description: "בחר מרצה מהרשימה או הוסף חדש" });
      } else {
        toast({ title: "מרצה נוסף", description: "המרצה נוסף בהצלחה" });
        setSelectedLecturer(result.new.id);
        setShowAddLecturer(false);
        setNewLecturerName("");
        setSuggestedLecturers([]);
      }
    } catch {
      toast({ title: "שגיאה", description: "אירעה שגיאה בהוספת המרצה", variant: "destructive" });
    }
  };

  // UI
  return (
    <form className="space-y-6" onSubmit={handleSubmit} dir={isRTL ? "rtl" : "ltr"}>
      {/* בחירת מרצה */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-lg font-semibold text-gray-800">בחר מרצה</label>
          <Dialog open={showAddLecturer} onOpenChange={setShowAddLecturer}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Plus className="w-4 h-4" />
                הוסף מרצה חדש
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>הוסף מרצה חדש</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="שם המרצה..."
                  value={newLecturerName}
                  onChange={(e) => setNewLecturerName(e.target.value)}
                />
                {suggestedLecturers.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">מרצים דומים נמצאו:</p>
                    {suggestedLecturers.map((lecturer) => (
                      <div key={lecturer.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span>{lecturer.name}</span>
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedLecturer(lecturer.id);
                            setShowAddLecturer(false);
                            setSuggestedLecturers([]);
                          }}
                        >
                          בחר
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <Button
                    onClick={handleAddLecturer}
                    disabled={addLecturer.isPending || !newLecturerName.trim()}
                    className="flex-1"
                  >
                    {addLecturer.isPending ? "מוסיף..." : "הוסף"}
                  </Button>
                  <Button variant="outline" onClick={() => setShowAddLecturer(false)}>
                    ביטול
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <Select value={selectedLecturer} onValueChange={setSelectedLecturer}>
          <SelectTrigger className="h-12 text-lg">
            <SelectValue placeholder="בחר מרצה מהרשימה..." />
          </SelectTrigger>
          <SelectContent>
            {lecturers.map((lecturer) => (
              <SelectItem key={lecturer.id} value={lecturer.id} className="text-lg flex items-center gap-2">
                <span>{lecturer.name}</span>
                {lecturer.reviews_count <= 1 && (
                  <Badge className="ml-2 bg-green-200 text-green-700">חדש</Badge>
                )}
                {lecturer.reviews_count > 1 && (
                  <Badge className="ml-2 bg-gray-200 text-gray-700">
                    {lecturer.average_rating?.toFixed(1)} ⭐
                  </Badge>
                )}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* כוכבים לכל פרמטר */}
      <div className="space-y-6">
        {Object.entries(parameterIcons).map(([key, param]) => {
          const IconComponent = param.icon;
          const value = ratings[key] || 0;
          return (
            <div key={key} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="text-center space-y-4">
                <div className="flex items-center justify-center gap-3">
                  <IconComponent className={`w-6 h-6 ${param.color}`} />
                  <h3 className="text-xl font-semibold text-gray-800">{param.label}</h3>
                </div>
                {renderStars(
                  value,
                  "lg",
                  true,
                  (star) => setRatings((prev) => ({ ...prev, [key]: star })),
                  true,
                  hovered[key] || 0,
                  (star) => setHovered((prev) => ({ ...prev, [key]: star })),
                  () => setHovered((prev) => ({ ...prev, [key]: 0 }))
                )}
                {value > 0 && (
                  <p className="text-sm font-medium text-gray-600 animate-fade-in">
                    {getRatingDesc(value)}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* טקסט חוות דעת */}
      <div className="space-y-3">
        <label className="text-lg font-semibold text-gray-800">חוות דעת (אופציונלי)</label>
        <Textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="שתף את החוויה שלך עם המרצה... (אופציונלי)"
          rows={4}
          className="resize-none text-lg p-4"
        />
      </div>

      {/* שליחה */}
      <Button
        type="submit"
        disabled={
          submitReview.isPending ||
          !selectedLecturer ||
          !Object.values(ratings).every((r) => r > 0)
        }
        className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105"
      >
        {submitReview.isPending ? "שולח..." : editData ? "עדכן דירוג" : "שלח דירוג"}
      </Button>
      <p className="text-xs text-gray-500 text-center">
        הדירוג יישאר אנונימי ויעזור לסטודנטים עתידיים
      </p>
    </form>
  );
}

// ---- דף דירוג מרצים מלא ----
const EnhancedLecturerRatingsSection = ({ courseId, courseName }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: lecturers = [], isLoading } = useLecturerRatings(courseId);
  const { data: allLecturers = [] } = useCourseLecturers(courseId);
  const [selectedLecturer, setSelectedLecturer] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("rating");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const { data: reviews = [] } = useLecturerReviews(selectedLecturer || "");
  const [editReview, setEditReview] = useState<any | null>(null);
  const userReview = useUserLecturerReview(selectedLecturer, courseId);
  const deleteReview = useDeleteLecturerReview();

  // RTL & אנימציה — גלילה אוטומטית לדירוג
  const reviewsRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (selectedLecturer && reviewsRef.current) {
      reviewsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [selectedLecturer]);

  // Filter + sort
  const filteredLecturers = useMemo(() => {
    let list = lecturers;
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      list = list.filter((l) => l.name.toLowerCase().includes(term));
    }
    if (sortBy === "reviews") {
      list = [...list].sort((a, b) => b.reviews_count - a.reviews_count);
    } else if (sortBy === "name") {
      list = [...list].sort((a, b) => a.name.localeCompare(b.name, "he"));
    } else {
      list = [...list].sort((a, b) => b.average_rating - a.average_rating);
    }
    return list;
  }, [lecturers, searchTerm, sortBy]);
  const topLecturers = filteredLecturers.slice(0, 3);

  // ---- Breakdown פרמטרים ----
  function renderParameterBreakdown(reviews: any[]) {
    if (!reviews || reviews.length === 0) return null;
    const averages = { teaching_quality: 0, lecturer_availability: 0, personal_approach: 0 };
    reviews.forEach((r) => {
      if (r.teaching_quality) averages.teaching_quality += r.teaching_quality;
      if (r.lecturer_availability) averages.lecturer_availability += r.lecturer_availability;
      if (r.personal_approach) averages.personal_approach += r.personal_approach;
    });
    Object.keys(averages).forEach((k) => (averages[k] = averages[k] / reviews.length));
    return (
      <div className="space-y-4 bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-xl border border-blue-200">
        <h4 className="font-semibold text-lg text-center mb-2">פירוט דירוגים לפי פרמטרים</h4>
        {Object.entries(averages).map(([key, value]) => {
          const param = parameterIcons[key as keyof typeof parameterIcons];
          if (!param) return null;
          const Icon = param.icon;
          const percentage = (value / 5) * 100;
          return (
            <div key={key} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className={`w-5 h-5 ${param.color}`} />
                  <span className="font-medium">{param.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  {renderStars(value, "sm")}
                  <span className="text-sm font-semibold text-gray-600">{value.toFixed(1)}</span>
                </div>
              </div>
              <Progress value={percentage} className="h-2" />
            </div>
          );
        })}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/2 mb-6"></div>
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!lecturers || lecturers.length === 0) {
    return (
      <div id="course-lecturers" className="space-y-8" dir="rtl">
        <div className="text-center">
          <h2 className="text-3xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3">
            דירוג מרצים מתקדם
          </h2>
          <p className="text-gray-600 text-lg mb-6">
            מבוסס על דירוגים תלת-פרמטריים של סטודנטים
          </p>
        </div>
        <div className="text-center py-12">
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-8 border-2 border-dashed border-blue-200">
            <MessageSquare className="w-16 h-16 text-blue-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">טרם נאספו חוות דעת</h3>
            <p className="text-gray-600 mb-6">היה הראשון לדרג מרצה!</p>
            <Dialog>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 text-lg font-semibold">
                  <Plus className="w-5 h-5 ml-2" />
                  הוסף חוות דעת
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="text-xl">דרג מרצה</DialogTitle>
                </DialogHeader>
                <LecturerReviewForm
                  lecturers={allLecturers || []}
                  courseId={courseId}
                  onSuccess={() => window.location.reload()}
                  isRTL={true}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="course-lecturers" className="space-y-8" dir="rtl">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3">
          דירוג מרצים מתקדם
        </h2>
        <p className="text-gray-600 text-lg">
          מבוסס על דירוגים תלת-פרמטריים של סטודנטים
        </p>
        <div className="flex justify-center gap-6 mt-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{lecturers.length}</div>
            <div className="text-sm text-gray-500">מרצים</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {lecturers.reduce((sum, l) => sum + l.reviews_count, 0)}
            </div>
            <div className="text-sm text-gray-500">דירוגים</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {lecturers.length > 0
                ? (
                    lecturers.reduce((sum, l) => sum + l.average_rating, 0) / lecturers.length
                  ).toFixed(1)
                : "0"}
            </div>
            <div className="text-sm text-gray-500">ממוצע כללי</div>
          </div>
        </div>
      </div>

      {/* Top 3 Lecturers */}
      <div className="grid md:grid-cols-3 gap-6">
        {topLecturers.map((lecturer, idx) => (
          <motion.div
            key={lecturer.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <Card
              className={`
                hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1
                ring-2 ${idx === 0 ? "ring-yellow-400" : idx === 1 ? "ring-gray-400" : "ring-orange-400"}
                bg-gradient-to-br ${GRADIENTS[idx % GRADIENTS.length]}
              `}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div
                      className={`
                        w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg
                        ${idx === 0 ? "bg-yellow-400 text-yellow-900 animate-pulse" : idx === 1 ? "bg-gray-400 text-gray-900" : "bg-orange-400 text-orange-900"}
                      `}
                    >
                      #{idx + 1}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-1">{lecturer.name}</h3>
                      <div className="flex items-center gap-3">
                        {renderStars(lecturer.average_rating, "md")}
                        <span className="text-lg font-semibold text-gray-700">
                          {lecturer.average_rating.toFixed(1)}
                        </span>
                        <Badge variant="secondary" className="text-sm">
                          {lecturer.reviews_count} ביקורות
                        </Badge>
                        {lecturer.reviews_count <= 1 && (
                          <Badge variant="outline" className="bg-green-100 text-green-700 ml-2">חדש</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  {idx === 0 && (
                    <div className="flex items-center gap-1 text-yellow-600 animate-bounce">
                      <TrendingUp className="w-5 h-5" />
                      <span className="font-semibold text-sm">הכי מומלץ</span>
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-sm text-gray-700 italic">"הסברים ברורים וסבלנות רבה"</p>
                  </div>
                  {lecturer.reviews_count > 1 && (
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-sm text-gray-700 italic">"קצת מהיר בהסברים"</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Dialog צפייה/הוספה/עריכה */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 hover:from-blue-100 hover:to-purple-100 mt-8"
          >
            <MessageSquare className="w-5 h-5 ml-2" />
            ראה את כל המרצים וחוות הדעת המפורטות
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-xl">
              כל המרצים - {courseName}
            </DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="view" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="view" className="text-lg">
                <MessageSquare className="w-4 h-4 ml-2" />
                צפייה בדירוגים
              </TabsTrigger>
              <TabsTrigger value="rate" className="text-lg">
                <Plus className="w-4 h-4 ml-2" />
                דרג מרצה
              </TabsTrigger>
            </TabsList>
            <TabsContent value="view" className="space-y-4">
              {/* חיפוש וסינון */}
              <div className="flex gap-4">
                <div className="relative flex-1">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="חפש מרצה..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pr-10 text-lg h-12"
                  />
                </div>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-48 h-12">
                    <Filter className="w-4 h-4 ml-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rating">דירוג גבוה</SelectItem>
                    <SelectItem value="reviews">הכי מבוקרים</SelectItem>
                    <SelectItem value="name">לפי שם</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {/* רשימת מרצים */}
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {filteredLecturers.map((lecturer) => (
                  <Card key={lecturer.id} className="p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-gray-900 text-lg">{lecturer.name}</h4>
                        <div className="flex items-center gap-3 mt-1">
                          {renderStars(lecturer.average_rating, "sm")}
                          <span className="text-sm text-gray-600 font-medium">
                            {lecturer.average_rating.toFixed(1)}
                          </span>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-sm">
                        {lecturer.reviews_count} ביקורות
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedLecturer(lecturer.id)}
                      className="w-full"
                    >
                      ראה פירוט מלא ו-{lecturer.reviews_count} ביקורות
                    </Button>
                  </Card>
                ))}
              </div>
              {/* חוות דעת למרצה נבחר */}
              <div ref={reviewsRef} />
              {selectedLecturer && (
                <div className="border-t pt-6 space-y-4">
                  <h4 className="font-bold text-lg">חוות דעת מפורטות</h4>
                  {renderParameterBreakdown(reviews)}
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    <AnimatePresence>
                      {reviews.map((review, i) => (
                        <motion.div
                          key={review.id}
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 15 }}
                          transition={{ delay: i * 0.02 }}
                        >
                          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex flex-col">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                {renderStars(review.rating, "sm")}
                                <span className="text-sm font-medium text-gray-600">
                                  {review.rating}/5
                                </span>
                              </div>
                              <span className="text-xs text-gray-500">
                                {format(new Date(review.created_at), "dd/MM/yyyy", { locale: he })}
                              </span>
                            </div>
                            {/* פרמטרים */}
                            {(review.teaching_quality ||
                              review.lecturer_availability ||
                              review.personal_approach) && (
                              <div className="grid grid-cols-3 gap-2 mb-3 text-xs">
                                {review.teaching_quality && (
                                  <div className="text-center">
                                    <div className="text-blue-600 font-medium">הוראה</div>
                                    <div className="font-bold">{review.teaching_quality}/5</div>
                                  </div>
                                )}
                                {review.lecturer_availability && (
                                  <div className="text-center">
                                    <div className="text-green-600 font-medium">זמינות</div>
                                    <div className="font-bold">{review.lecturer_availability}/5</div>
                                  </div>
                                )}
                                {review.personal_approach && (
                                  <div className="text-center">
                                    <div className="text-purple-600 font-medium">יחס</div>
                                    <div className="font-bold">{review.personal_approach}/5</div>
                                  </div>
                                )}
                              </div>
                            )}
                            {review.comment && (
                              <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded italic">
                                "{review.comment}"
                              </p>
                            )}
                            {/* אפשרות עריכה/מחיקה לבעל הדירוג */}
                            {user && review.user_id === user.id && (
                              <div className="flex gap-2 justify-end pt-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setEditReview(review)}
                                  className="gap-1"
                                >
                                  <Pencil className="w-4 h-4" />
                                  ערוך
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={async () => {
                                    await deleteReview.mutateAsync({
                                      reviewId: review.id,
                                      lecturerId: selectedLecturer
                                    });
                                    toast({ title: "הדירוג נמחק", description: "הדירוג הוסר בהצלחה" });
                                  }}
                                  className="gap-1 text-destructive hover:bg-destructive/10"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  מחק
                                </Button>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              )}
              {/* דיאלוג עריכה */}
              <Dialog open={!!editReview} onOpenChange={() => setEditReview(null)}>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>ערוך דירוג מרצה</DialogTitle>
                  </DialogHeader>
                  <LecturerReviewForm
                    lecturers={allLecturers}
                    courseId={courseId}
                    editData={editReview}
                    onSuccess={() => {
                      setEditReview(null);
                      setSelectedLecturer(editReview?.lecturer_id);
                    }}
                  />
                  <Button
                    variant="ghost"
                    className="absolute top-3 left-3"
                    onClick={() => setEditReview(null)}
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </DialogContent>
              </Dialog>
            </TabsContent>
            <TabsContent value="rate" className="space-y-4">
              <div className="max-h-96 overflow-y-auto">
                <LecturerReviewForm
                  lecturers={allLecturers}
                  courseId={courseId}
                  onSuccess={() => {
                    setIsDialogOpen(false);
                  }}
                />
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* קיצור - כפתור הוספה מהיר */}
      <div className="flex gap-2 justify-end">
        <Button
          variant="secondary"
          className="gap-2 mt-3 bg-gradient-to-r from-blue-100 to-green-100 text-blue-900 shadow font-bold"
          onClick={() => setIsDialogOpen(true)}
        >
          <Plus className="w-4 h-4" />
          דרג או הוסף מרצה
        </Button>
      </div>
    </div>
  );
};

export default EnhancedLecturerRatingsSection;
