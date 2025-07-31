import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  Star,
  MessageSquare,
  Plus,
  ThumbsUp,
  ThumbsDown,
  Search,
  Filter,
  Pencil,
  UserPlus,
  Trash2,
  CheckCircle,
  User,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  useLecturerRatings,
  useLecturerReviews,
  useCourseLecturers,
  useUserLecturerReview,
  useSubmitLecturerReview,
  useAddLecturer,
} from "@/hooks/useLecturerRatings";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { he } from "date-fns/locale";

// ====== הגדרות עיצוב =======
const GRADIENTS = [
  "from-green-50 to-green-100",
  "from-blue-50 to-blue-100",
  "from-yellow-50 to-yellow-100",
  "from-rose-50 to-pink-100",
  "from-indigo-50 to-purple-100",
];
const getRandomGradient = (i: number) =>
  GRADIENTS[i % GRADIENTS.length] || "from-gray-50 to-gray-100";

const BADGE_BY_RATING = (avg: number) =>
  avg >= 4.5
    ? { label: "מעולה", color: "emerald" }
    : avg >= 4
    ? { label: "טוב מאוד", color: "green" }
    : avg >= 3
    ? { label: "בסדר", color: "yellow" }
    : avg > 0
    ? { label: "דרוש שיפור", color: "rose" }
    : { label: "אין מספיק נתונים", color: "gray" };

// ====== קומפוננטת כוכבים =======
const renderStars = (
  count: number,
  size: "sm" | "md" | "lg" = "md",
  interactive = false,
  onClick?: (n: number) => void
) => (
  <div className="flex flex-row-reverse gap-0.5" dir="rtl">
    {[1, 2, 3, 4, 5].map((star) => (
      <motion.span
        key={star}
        whileHover={interactive ? { scale: 1.17, rotate: 10 } : {}}
        className={interactive ? "cursor-pointer" : ""}
        onClick={() => interactive && onClick && onClick(star)}
      >
        <Star
          className={`transition-colors duration-150 ${
            size === "sm" ? "w-4 h-4" : size === "lg" ? "w-8 h-8" : "w-6 h-6"
          } ${
            star <= count
              ? "fill-yellow-400 text-yellow-400 drop-shadow"
              : "text-gray-300 dark:text-gray-700"
          }`}
        />
      </motion.span>
    ))}
  </div>
);

// ====== טופס הוספת מרצה =======
const AddLecturerForm = ({
  onAdd,
  isPending,
  errorMsg,
}: {
  onAdd: (name: string) => void;
  isPending: boolean;
  errorMsg?: string;
}) => {
  const [name, setName] = useState("");
  return (
    <form
      className="space-y-5 p-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (name.trim().length > 2) onAdd(name.trim());
      }}
      dir="rtl"
    >
      <Label className="font-bold text-base">הוסף מרצה חדש</Label>
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="שם המרצה (בעברית או אנגלית)"
        required
        minLength={2}
        autoFocus
        className="rounded-lg"
      />
      <div className="flex gap-2">
        <Button
          type="submit"
          className="flex-1"
          disabled={isPending || name.trim().length < 2}
        >
          {isPending ? "מוסיף..." : "הוסף מרצה"}
        </Button>
      </div>
      {errorMsg && <p className="text-xs text-red-500">{errorMsg}</p>}
    </form>
  );
};

// ====== טופס דירוג מרצה =======
const LecturerReviewForm = ({
  lecturer,
  defaultReview,
  onSubmit,
  onCancel,
  isPending,
  isEditMode,
}: any) => {
  const [teaching_quality, setTeachingQuality] = useState(
    defaultReview?.teaching_quality ?? 0
  );
  const [lecturer_availability, setLecturerAvailability] = useState(
    defaultReview?.lecturer_availability ?? 0
  );
  const [personal_approach, setPersonalApproach] = useState(
    defaultReview?.personal_approach ?? 0
  );
  const [comment, setComment] = useState(defaultReview?.comment ?? "");

  // דירוג ממוצע ודינמי
  const overallRating =
    Math.round(
      (Number(teaching_quality) +
        Number(lecturer_availability) +
        Number(personal_approach)) /
        3
    ) || 0;

  // גלילה במובייל/מסכים קטנים
  return (
    <form
      className="space-y-7 max-h-[72vh] overflow-y-auto scrollbar-thin px-2 pb-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (overallRating === 0) return;
        onSubmit({
          lecturer_id: lecturer.id,
          rating: overallRating,
          teaching_quality,
          lecturer_availability,
          personal_approach,
          comment,
          is_positive: overallRating >= 4,
        });
      }}
      dir="rtl"
    >
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur py-2 -mx-2 px-2 rounded-t-xl shadow-sm">
        <Label className="text-base font-bold mb-2 block">
          דירוג כולל:{" "}
          <span className="font-black text-lg text-yellow-500">{overallRating}</span>
        </Label>
        {renderStars(
          overallRating,
          "lg",
          true,
          (n: number) => {
            setTeachingQuality(n);
            setLecturerAvailability(n);
            setPersonalApproach(n);
          }
        )}
        {overallRating === 0 && (
          <p className="text-xs text-red-500 mt-1">חובה לבחור דירוג</p>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label className="text-sm font-medium mb-1 block">איכות הוראה</Label>
          {renderStars(teaching_quality, "md", true, setTeachingQuality)}
        </div>
        <div>
          <Label className="text-sm font-medium mb-1 block">זמינות</Label>
          {renderStars(lecturer_availability, "md", true, setLecturerAvailability)}
        </div>
        <div>
          <Label className="text-sm font-medium mb-1 block">יחס אישי</Label>
          {renderStars(personal_approach, "md", true, setPersonalApproach)}
        </div>
      </div>
      <div>
        <Label className="text-base font-bold mb-2 block">חוות דעת (אופציונלי)</Label>
        <Textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="ספר בקצרה על המרצה, יחס אישי, דוגמאות..."
          className="min-h-[70px] rounded-xl"
          maxLength={420}
        />
        <div className="text-xs text-gray-400 text-left mt-1">
          {comment.length}/420 תווים
        </div>
      </div>
      <div className="sticky bottom-0 bg-white/95 py-2 flex gap-2 z-10">
        <Button
          type="submit"
          className="flex-1 h-12 font-bold"
          disabled={overallRating === 0 || isPending}
        >
          {isPending ? "שולח..." : isEditMode ? "עדכן ביקורת" : "פרסם ביקורת"}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="flex-1 h-12"
          onClick={onCancel}
        >
          ביטול
        </Button>
      </div>
    </form>
  );
};

// ====== כרטיס חוות דעת =======
const ReviewCard = ({
  review,
  onEdit,
  canEdit,
}: any) => (
  <motion.div
    initial={{ opacity: 0, y: 18 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: 12 }}
    transition={{ duration: 0.4 }}
    className="overflow-hidden"
    dir="rtl"
  >
    <Card className="rounded-xl bg-gradient-to-br from-white to-slate-50 shadow hover:scale-[1.015] transition-transform border-r-4 border-emerald-300">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="font-bold text-gray-900 text-base">
            {review.user_profile?.name || "סטודנט"}
          </span>
          <Badge
            variant="secondary"
            className="text-xs font-normal px-2 py-0.5"
          >
            {format(new Date(review.created_at), "dd/MM/yyyy", { locale: he })}
          </Badge>
          <span className="text-xs text-gray-500">
            {review.is_positive ? (
              <ThumbsUp className="inline w-4 h-4 text-green-500" />
            ) : (
              <ThumbsDown className="inline w-4 h-4 text-red-500" />
            )}
          </span>
          {canEdit && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(review)}
              className="text-blue-400 hover:text-blue-700 ml-2"
              title="ערוך ביקורת"
            >
              <Pencil className="w-5 h-5" />
            </Button>
          )}
        </div>
        <div className="flex gap-2 mb-2">
          {renderStars(review.rating, "md")}
          <span className="text-xs text-gray-500">({review.rating}/5)</span>
        </div>
        <div className="flex flex-col gap-1 text-xs text-gray-700 mb-1">
          <div className="flex gap-2">
            <span className="font-medium">איכות הוראה:</span>
            {renderStars(review.teaching_quality, "sm")}
          </div>
          <div className="flex gap-2">
            <span className="font-medium">זמינות:</span>
            {renderStars(review.lecturer_availability, "sm")}
          </div>
          <div className="flex gap-2">
            <span className="font-medium">יחס אישי:</span>
            {renderStars(review.personal_approach, "sm")}
          </div>
        </div>
        <p className="text-sm text-gray-900 leading-relaxed whitespace-pre-line mt-2">
          {review.comment || <span className="text-gray-400">לא נכתב תוכן</span>}
        </p>
      </CardContent>
    </Card>
  </motion.div>
);

// ====== הקומפוננטה הראשית =======
const LecturerRatingsSection = ({
  courseId,
  courseName,
  isLoggedIn,
}: LecturerRatingsSectionProps) => {
  const { toast } = useToast();
  const { data: lecturers = [], isLoading } = useLecturerRatings(courseId);
  const { data: allLecturers = [] } = useCourseLecturers(courseId);
  const [selectedLecturer, setSelectedLecturer] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("rating");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editReview, setEditReview] = useState<any>(null);
  const [addLecturerDialog, setAddLecturerDialog] = useState(false);
  const [addLecturerError, setAddLecturerError] = useState<string | null>(null);
  const addLecturer = useAddLecturer();

  const { data: reviews = [] } = useLecturerReviews(selectedLecturer || "");
  const userReview = useUserLecturerReview(selectedLecturer || "", courseId);
  const submitReview = useSubmitLecturerReview();

  // Top 3 lecturers
  const topLecturers = useMemo(() => {
    if (!lecturers) return [];
    return [...lecturers]
      .sort((a, b) => b.average_rating - a.average_rating)
      .slice(0, 3);
  }, [lecturers]);

  // Search & Sort
  const filteredLecturers = useMemo(() => {
    let list = lecturers || [];
    if (searchTerm.trim()) {
      const term = searchTerm.trim().toLowerCase();
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

  // Handle add lecturer
  const handleAddLecturer = async (name: string) => {
    setAddLecturerError(null);
    try {
      const res = await addLecturer.mutateAsync({ name, course_id: courseId });
      if (res?.existing && res.existing.length > 0) {
        setAddLecturerError("מרצה דומה כבר קיים");
      } else {
        setAddLecturerDialog(false);
        toast({ title: "המרצה נוסף!", description: "המרצה נוסף לרשימת הקורס." });
      }
    } catch (e) {
      setAddLecturerError("שגיאה בהוספת מרצה");
    }
  };

  return (
    <section id="course-lecturers" className="space-y-6 mt-6 max-w-5xl mx-auto" dir="rtl">
      <div>
        <h2 className="text-3xl font-black text-gray-900 mb-2 bg-gradient-to-r from-yellow-100 to-yellow-50 px-3 py-2 rounded-lg inline-block shadow">
          דירוג מרצים בקורס זה
        </h2>
        <p className="text-gray-600 text-base font-light mb-6">
          מבוסס על חוות דעת אנונימיות של סטודנטים
        </p>
      </div>

      {/* Top 3 Lecturers */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {topLecturers.map((lecturer, i) => (
          <motion.div
            key={lecturer.id}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07, duration: 0.4 }}
          >
            <Card className={`hover:shadow-lg transition-shadow bg-gradient-to-br ${getRandomGradient(i)} border-r-4 border-yellow-400`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-bold text-gray-900">{lecturer.name}</h3>
                  <Badge variant="secondary" className="text-xs font-semibold px-3">
                    {BADGE_BY_RATING(lecturer.average_rating).label}
                  </Badge>
                </div>
                <div className="flex gap-2 items-center">
                  {renderStars(lecturer.average_rating)}
                  <span className="text-sm text-gray-700 font-medium">{lecturer.average_rating.toFixed(1)}</span>
                  <span className="text-xs text-gray-500">({lecturer.reviews_count} ביקורות)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-3">
                  <div className="flex flex-col items-center">
                    <span className="text-xs text-gray-500">איכות הוראה</span>
                    {renderStars(lecturer.teaching_quality || lecturer.average_rating, "sm")}
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-xs text-gray-500">זמינות</span>
                    {renderStars(lecturer.lecturer_availability || lecturer.average_rating, "sm")}
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-xs text-gray-500">יחס אישי</span>
                    {renderStars(lecturer.personal_approach || lecturer.average_rating, "sm")}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
      {/* Dialog לכל המרצים/חוות דעת */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            className="w-full font-bold text-blue-700 bg-blue-50 border-blue-200 hover:bg-blue-100 mt-4"
          >
            <MessageSquare className="w-5 h-5 mr-2" />
            ראה את כל המרצים וחוות הדעת
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-5xl max-h-[93vh] overflow-hidden bg-white rounded-xl shadow-2xl p-0" dir="rtl">
          {/* גלילה פנימית לכל הדיאלוג */}
          <div className="overflow-y-auto max-h-[86vh] p-7 scrollbar-thin">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">
                כל המרצים בקורס "{courseName}"
              </DialogTitle>
            </DialogHeader>
            <Tabs defaultValue="view" className="w-full mt-2">
              <TabsList className="grid w-full grid-cols-3 mb-3 sticky top-0 z-10 bg-white/95 backdrop-blur rounded-b-none">
                <TabsTrigger value="view">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  צפייה בדירוגים
                </TabsTrigger>
                <TabsTrigger value="rate">
                  <Plus className="w-4 h-4 mr-2" />
                  דרג מרצה
                </TabsTrigger>
                <TabsTrigger value="add">
                  <UserPlus className="w-4 h-4 mr-2" />
                  הוסף מרצה חדש
                </TabsTrigger>
              </TabsList>
              {/* --- טאבים --- */}
              <TabsContent value="view" className="space-y-4">
                {/* חיפוש + סינון - דביק */}
                <div className="flex gap-4 mb-2 sticky top-14 bg-white/90 py-2 z-10">
                  <div className="relative flex-1">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="חפש מרצה..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pr-10"
                    />
                  </div>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-48">
                      <Filter className="w-4 h-4 mr-2" />
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
                <div className="space-y-4 max-h-[300px] overflow-y-auto pb-3 pr-1">
                  {filteredLecturers.map((lecturer, idx) => (
                    <motion.div
                      key={lecturer.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: idx * 0.03 }}
                    >
                      <Card className="p-4 hover:shadow-lg transition">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h4 className="font-semibold text-gray-900">{lecturer.name}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              {renderStars(lecturer.average_rating, "sm")}
                              <span className="text-sm text-gray-600">
                                {lecturer.average_rating.toFixed(1)}
                              </span>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedLecturer(lecturer.id)}
                          >
                            ראה {lecturer.reviews_count} ביקורות
                          </Button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-2">
                          <div className="flex flex-col items-center">
                            <span className="text-xs text-gray-500">איכות הוראה</span>
                            {renderStars(
                              lecturer.teaching_quality || lecturer.average_rating,
                              "sm"
                            )}
                          </div>
                          <div className="flex flex-col items-center">
                            <span className="text-xs text-gray-500">זמינות</span>
                            {renderStars(
                              lecturer.lecturer_availability || lecturer.average_rating,
                              "sm"
                            )}
                          </div>
                          <div className="flex flex-col items-center">
                            <span className="text-xs text-gray-500">יחס אישי</span>
                            {renderStars(
                              lecturer.personal_approach || lecturer.average_rating,
                              "sm"
                            )}
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </div>
                {/* חוות דעת לפי בחירת מרצה */}
                {selectedLecturer && (
                  <div className="border-t pt-4">
                    <h4 className="font-semibold mb-3">חוות דעת על מרצה</h4>
                    <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                      <AnimatePresence>
                        {reviews.map((review, i) => (
                          <ReviewCard
                            key={review.id}
                            review={review}
                            canEdit={userReview?.data?.id === review.id}
                            onEdit={setEditReview}
                          />
                        ))}
                      </AnimatePresence>
                    </div>
                  </div>
                )}
              </TabsContent>
              <TabsContent value="rate" className="space-y-4">
                <div className="max-h-[65vh] overflow-y-auto scrollbar-thin px-1">
                  {/* בחר מרצה לפני דירוג */}
                  <Select
                    value={selectedLecturer || ""}
                    onValueChange={setSelectedLecturer}
                  >
                    <SelectTrigger className="w-full mb-3">
                      <User className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="בחר מרצה" />
                    </SelectTrigger>
                    <SelectContent>
                      {allLecturers.map((l) => (
                        <SelectItem value={l.id} key={l.id}>
                          {l.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedLecturer && (
                    <LecturerReviewForm
                      lecturer={allLecturers.find((l) => l.id === selectedLecturer)}
                      defaultReview={userReview?.data}
                      onSubmit={async (reviewData: any) => {
                        try {
                          await submitReview.mutateAsync({
                            ...reviewData,
                            course_id: courseId,
                          });
                          toast({ title: "הביקורת נשמרה", description: "תודה על הדירוג!" });
                          setEditReview(null);
                          setSelectedLecturer(null);
                          setIsDialogOpen(false);
                        } catch (e) {
                          toast({
                            title: "שגיאה",
                            description: "בעיה בשליחת הביקורת",
                            variant: "destructive",
                          });
                        }
                      }}
                      onCancel={() => setSelectedLecturer(null)}
                      isPending={submitReview.isPending}
                      isEditMode={!!userReview?.data}
                    />
                  )}
                  {!selectedLecturer && (
                    <p className="text-center text-sm text-gray-500">
                      יש לבחור מרצה לפני דירוג
                    </p>
                  )}
                </div>
              </TabsContent>
              <TabsContent value="add" className="space-y-4">
                <div className="max-w-md mx-auto">
                  <AddLecturerForm
                    onAdd={handleAddLecturer}
                    isPending={addLecturer.isPending}
                    errorMsg={addLecturerError}
                  />
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>
      {/* כפתור הוספה דביק בתחתית המסך */}
      <div className="flex gap-2 justify-end sticky bottom-2 z-30 bg-transparent pointer-events-none select-none">
        <Button
          variant="secondary"
          className="gap-2 mt-3 bg-gradient-to-r from-blue-100 to-green-100 text-blue-900 shadow font-bold pointer-events-auto select-auto"
          onClick={() => setIsDialogOpen(true)}
        >
          <Plus className="w-4 h-4" />
          דרג או הוסף מרצה
        </Button>
      </div>
    </section>
  );
};

export default LecturerRatingsSection;
