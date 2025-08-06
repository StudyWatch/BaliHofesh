import React, { useState, useEffect, useRef, useMemo, FC, FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Star, Users, Clock, Heart, Search, Filter, Plus, Pencil, Trash2, X, TrendingUp, LogIn,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  useLecturerRatings,
  useCourseLecturers,
  useLecturerReviews,
  useSubmitLecturerReview,
  useAddLecturer,
  useDeleteLecturerReview,
} from "@/hooks/useLecturerRatings";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/contexts/AuthProvider';
import { format } from "date-fns";
import { he } from "date-fns/locale";

// טיפוסים
interface Lecturer {
  id: string;
  name: string;
  average_rating: number;
  reviews_count: number;
  avatar_url?: string;
}
interface Review {
  id: string;
  user_id: string;
  rating: number;
  teaching_quality?: number;
  lecturer_availability?: number;
  personal_approach?: number;
  comment?: string;
  created_at: string;
}
interface ParamInfo {
  icon: FC<{ className?: string }>;
  label: string;
  color: string;
  bg: string;
}
const PARAMS: Record<string, ParamInfo> = {
  teaching_quality: {
    icon: Users,
    label: "איכות הוראה",
    color: "text-amber-600 dark:text-yellow-300",
    bg: "bg-amber-50 dark:bg-amber-900/30",
  },
  lecturer_availability: {
    icon: Clock,
    label: "זמינות",
    color: "text-sky-600 dark:text-sky-200",
    bg: "bg-sky-50 dark:bg-sky-900/30",
  },
  personal_approach: {
    icon: Heart,
    label: "יחס אישי",
    color: "text-pink-600 dark:text-pink-300",
    bg: "bg-pink-50 dark:bg-pink-900/30",
  },
};
const MODAL_BG = "bg-gradient-to-br from-amber-50 via-[#f7f6f4] to-white dark:from-zinc-900 dark:via-zinc-950 dark:to-amber-900";
const MODAL_SHADOW = "shadow-2xl shadow-amber-100/30 dark:shadow-zinc-900/70";

// דירוג כוכבים
const StarRating: FC<{
  rating: number;
  size?: "sm" | "md" | "lg";
  interactive?: boolean;
  onRate?: (n: number) => void;
}> = ({ rating, size = "md", interactive = false, onRate }) => {
  const dims = size === "lg" ? "w-8 h-8" : size === "sm" ? "w-4 h-4" : "w-6 h-6";
  const [hover, setHover] = useState<number | null>(null);
  return (
    <div className="flex flex-row-reverse gap-0.5 items-center justify-center w-full">
      {[5, 4, 3, 2, 1].map((i) => (
        <button
          key={i}
          type={interactive ? "button" : undefined}
          tabIndex={interactive ? 0 : -1}
          onMouseEnter={() => interactive && setHover(i)}
          onMouseLeave={() => interactive && setHover(null)}
          onClick={() => interactive && onRate?.(i)}
          style={{ background: "transparent", border: 0, padding: 0, margin: 0 }}
          aria-label={`דרג ${i} כוכבים`}
        >
          <Star
            className={
              (hover !== null ? i <= hover : i <= Math.round(rating))
                ? `${dims} fill-yellow-400 text-yellow-400 drop-shadow-sm transition`
                : `${dims} text-gray-300 dark:text-gray-600`
            }
          />
        </button>
      ))}
    </div>
  );
};

// כרטיס טופ 3
const Top3LecturerCard: FC<{
  lecturer: Lecturer;
  rank: number;
  onSelect: (id: string) => void;
}> = ({ lecturer, rank, onSelect }) => (
  <motion.div
    whileHover={{ scale: 1.025 }}
    className="cursor-pointer"
    onClick={() => onSelect(lecturer.id)}
    dir="rtl"
    tabIndex={0}
  >
    <div className={`
      relative flex flex-row items-center w-full
      bg-yellow-50 dark:bg-yellow-100/5 shadow-xl border-2 border-yellow-200 dark:border-yellow-700
      rounded-2xl px-4 py-4 min-w-[180px] max-w-full
      transition-all
    `}>
      <div className={`
        absolute -top-5 -end-5 bg-yellow-400 text-white w-10 h-10 text-center text-lg font-extrabold rounded-full shadow-md ring-2 ring-yellow-300 dark:ring-yellow-700 flex items-center justify-center z-20
      `}>
        {rank}
      </div>
      {rank === 1 && (
        <div className="
          absolute top-3 end-14 text-yellow-600 text-sm font-bold flex items-center gap-1 bg-yellow-100 dark:bg-yellow-900/70 px-3 py-0.5 rounded-full shadow-sm z-20
        ">
          <TrendingUp className="w-5 h-5" />
          הכי מומלץ
        </div>
      )}
      <div className="flex-1 flex flex-col md:flex-row md:items-center md:gap-5">
        {lecturer.avatar_url && (
          <img
            src={lecturer.avatar_url}
            alt={lecturer.name}
            className="w-14 h-14 rounded-full border-2 border-yellow-200 shadow mb-3 md:mb-0 md:me-3"
            loading="lazy"
          />
        )}
        <div>
          <div className="text-lg font-extrabold text-gray-900 dark:text-yellow-100 mb-1 text-right">
            {lecturer.name}
          </div>
          <div className="flex flex-col items-center text-center gap-2 mb-2">
            <StarRating rating={lecturer.average_rating} />
            <span className="text-base font-bold text-gray-800 dark:text-yellow-200">
              {lecturer.average_rating.toFixed(1)}
            </span>
            <Badge
              variant="secondary"
              className="text-xs px-2 py-0.5 bg-yellow-100 dark:bg-yellow-700/30 text-yellow-800 dark:text-yellow-100 font-semibold"
            >
              {lecturer.reviews_count} ביקורות
            </Badge>
          </div>
        </div>
      </div>
    </div>
  </motion.div>
);

// כרטיס רגיל
const LecturerCard: FC<{
  lecturer: Lecturer;
  onSelect: (id: string) => void;
}> = ({ lecturer, onSelect }) => (
  <motion.div
    whileHover={{ scale: 1.02 }}
    className="cursor-pointer"
    onClick={() => onSelect(lecturer.id)}
    dir="rtl"
    tabIndex={0}
  >
    <div className={`
      flex flex-row items-center w-full
      bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-100 dark:border-yellow-800
      rounded-2xl px-3 py-2 min-w-[150px] max-w-full shadow hover:shadow-lg transition
    `}>
      {lecturer.avatar_url && (
        <img
          src={lecturer.avatar_url}
          alt={lecturer.name}
          className="w-10 h-10 rounded-full border-2 border-yellow-200 shadow ms-3"
          loading="lazy"
        />
      )}
      <div className="flex flex-col flex-1">
        <div className="text-base font-bold text-gray-900 dark:text-yellow-100 mb-1">{lecturer.name}</div>
        <div className="flex flex-col items-center text-center gap-1">
          <StarRating rating={lecturer.average_rating} />
          <span className="text-sm font-semibold text-gray-800 dark:text-yellow-200">
            {lecturer.average_rating.toFixed(1)}
          </span>
          <Badge
            variant="secondary"
            className="text-xs px-2 py-0.5 bg-yellow-100 dark:bg-yellow-700/20 text-yellow-800 dark:text-yellow-100 font-semibold"
          >
            {lecturer.reviews_count} ביקורות
          </Badge>
        </div>
      </div>
    </div>
  </motion.div>
);

// ReviewItem – כל הדירוגים והכוכבים במרכז
const ReviewItem: FC<{
  review: Review;
  isOwn: boolean;
  onEdit: (r: Review) => void;
  onDelete: (id: string) => void;
}> = ({ review, isOwn, onEdit, onDelete }) => {
  const date = format(new Date(review.created_at), "dd/MM/yy", { locale: he });
  return (
    <motion.div
      className={`
        rounded-2xl bg-white dark:bg-zinc-900/80 shadow ring-1 ring-amber-100/40 dark:ring-zinc-800
        flex flex-col gap-3 p-3 sm:p-4 relative
        min-w-[150px] w-full max-w-full
        text-center items-center
      `}
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 22 }}
      dir="rtl"
    >
      <div className="flex flex-row justify-center items-center gap-2 w-full mb-1">
        <StarRating rating={review.rating} />
        <span className="text-sm text-gray-600 dark:text-yellow-200 font-bold">{review.rating}/5</span>
        <span className="text-xs text-gray-400 dark:text-yellow-400">{date}</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 w-full">
        {Object.entries(PARAMS).map(([key, cfg]) => {
          const val = (review as any)[key];
          if (!val) return null;
          return (
            <div
              key={key}
              className={`flex flex-col items-center text-center justify-center rounded-xl p-3 ${cfg.bg} w-full mb-2`}
            >
              <cfg.icon className={`w-6 h-6 mb-1 ${cfg.color}`} />
              <div className="font-semibold text-base">{cfg.label}</div>
              <div className="font-bold text-base mt-1">{val}/5</div>
            </div>
          );
        })}
      </div>
      {review.comment && (
        <blockquote className="text-base text-gray-700 dark:text-yellow-100 italic bg-amber-50/80 dark:bg-yellow-950/40 p-2 rounded-lg border-r-4 border-yellow-300 dark:border-yellow-600 w-full mt-2">
          “{review.comment}”
        </blockquote>
      )}
      {isOwn && (
        <div className="flex justify-end gap-2 absolute top-3 left-3">
          <Button size="icon" variant="ghost" onClick={() => onEdit(review)}>
            <Pencil className="w-4 h-4" />
          </Button>
          <Button size="icon" variant="ghost" onClick={() => onDelete(review.id)}>
            <Trash2 className="w-4 h-4 text-red-500" />
          </Button>
        </div>
      )}
    </motion.div>
  );
};

// טופס דירוג / הוספת מרצה חדש כולל חוות דעת (הכוכבים במרכז!)
const LecturerReviewForm: FC<{
  courseId: string;
  lecturers: Lecturer[];
  user: any;
  onAdded: (l: Lecturer) => void;
  onSuccess: () => void;
}> = ({ courseId, lecturers, user, onAdded, onSuccess }) => {
  const { toast } = useToast();
  const submitReview = useSubmitLecturerReview();
  const addLecturer = useAddLecturer();

  const [selected, setSelected] = useState("");
  const [rates, setRates] = useState({
    teaching_quality: 0,
    lecturer_availability: 0,
    personal_approach: 0,
  });
  const [comment, setComment] = useState("");
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, [inputRef]);

  const canSubmit = !!user && !!selected && Object.values(rates).every((v) => v > 0);

  const handleAdd = async () => {
    if (!newName.trim() || Object.values(rates).some((v) => v === 0)) {
      toast({
        title: "חובה למלא שם ולדרג בכל הקטגוריות!",
        variant: "destructive"
      });
      return;
    }
    setAdding(true);
    try {
      const res = await addLecturer.mutateAsync({
        name: newName.trim(),
        course_id: courseId,
      });
      const lec = res.existing?.[0] || res.new;
      await submitReview.mutateAsync({
        course_id: courseId,
        lecturer_id: lec.id,
        ...rates,
        comment: comment.trim(),
      });
      onAdded(lec);
      setSelected(lec.id);
      setNewName("");
      setRates({
        teaching_quality: 0,
        lecturer_availability: 0,
        personal_approach: 0,
      });
      setComment("");
      toast({ title: "מרצה ודירוג נוספו בהצלחה" });
      onSuccess();
    } catch {
      toast({ title: "שגיאה בהוספת מרצה", variant: "destructive" });
    } finally {
      setAdding(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) {
      toast({
        title: !user
          ? "התחבר כדי לדרג"
          : "אנא מלא את כל הדירוגים",
        variant: "destructive",
      });
      return;
    }
    await submitReview.mutateAsync({
      course_id: courseId,
      lecturer_id: selected,
      ...rates,
      comment: comment.trim(),
    });
    toast({ title: "הדירוג נשמר!" });
    onSuccess();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 py-2 max-h-[56vh] overflow-auto px-2"
      dir="rtl"
    >
      <div className="flex flex-col sm:flex-row gap-2">
        <Input
          ref={inputRef}
          placeholder="הוסף מרצה חדש..."
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className="flex-1 h-10 text-base text-right"
          dir="rtl"
        />
        <Button
          onClick={handleAdd}
          disabled={adding}
          variant="secondary"
          type="button"
          className="px-3 h-10 text-base rounded-lg"
          dir="rtl"
        >
          {adding ? "מוסיף..." : <><Plus className="w-5 h-5 ml-2" />הוסף</>}
        </Button>
      </div>
      <Select value={selected} onValueChange={setSelected}>
        <SelectTrigger className="h-10 text-base rounded-lg text-right" dir="rtl">
          <SelectValue placeholder="בחר מרצה..." />
        </SelectTrigger>
        <SelectContent dir="rtl">
          {lecturers.map((l) => (
            <SelectItem key={l.id} value={l.id} className="text-base py-2 text-right" dir="rtl">
              {l.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full">
        {Object.entries(PARAMS).map(([key, info]) => (
          <div
            key={key}
            className={`
              flex flex-col items-center justify-center py-4 rounded-xl shadow-sm ${info.bg}
              text-center w-full
            `}
            dir="rtl"
          >
            <info.icon className={`w-6 h-6 ${info.color} mb-2`} />
            <div className="font-bold mb-1 text-base">{info.label}</div>
            <StarRating
              rating={rates[key as keyof typeof rates]!}
              size="md"
              interactive
              onRate={(n) => setRates((r) => ({ ...r, [key]: n }))}
            />
          </div>
        ))}
      </div>
      <Textarea
        placeholder="הערה (אופציונלי)..."
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={2}
        className="text-base rounded-lg text-right"
        dir="rtl"
      />
      <Button
        type="submit"
        disabled={!canSubmit || submitReview.status === "loading"}
        className={`
          w-full py-2 text-lg font-bold rounded-xl shadow
          bg-gradient-to-r from-amber-400 to-yellow-500
          text-white hover:scale-105 transition-transform
        `}
      >
        {submitReview.status === "loading" ? "שולח..." : "שלח דירוג"}
      </Button>
    </form>
  );
};

// MAIN SECTION
const EnhancedLecturerRatingsSection: FC<{
  courseId: string;
  courseName: string;
}> = ({ courseId, courseName }) => {
  const { data: initLecs = [] } = useLecturerRatings(courseId);
  const { data: courseLecs = [] } = useCourseLecturers(courseId);
  const [lecturers, setLecturers] = useState<Lecturer[]>(initLecs);

  useEffect(() => setLecturers(initLecs), [initLecs]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string>("");
  const { data: reviews = [] } = useLecturerReviews(selectedId);
  const { user, login } = useAuth();
  const { toast } = useToast();
  const deleteReview = useDeleteLecturerReview();

  const [tab, setTab] = useState<"rate" | "view">("view");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"rating" | "reviews" | "name">("rating");
  const [filterStars, setFilterStars] = useState<number | null>(null);

  // סינון ומיון
  const filtered = useMemo(() => {
    let arr = lecturers.filter((l) =>
      l.name.includes(search.trim())
    );
    if (filterStars)
      arr = arr.filter(
        (l) => Math.round(l.average_rating) === filterStars
      );
    arr.sort((a, b) => {
      if (sortBy === "reviews") return b.reviews_count - a.reviews_count;
      if (sortBy === "name") return a.name.localeCompare(b.name, "he");
      return b.average_rating - a.average_rating;
    });
    return arr;
  }, [lecturers, search, sortBy, filterStars]);

  const top3 = filtered.slice(0, 3);
  const restLecturers = filtered.slice(3);

  const totalRatings = lecturers.reduce((sum, l) => sum + l.reviews_count, 0);
  const avgOverall =
    lecturers.length > 0
      ? lecturers.reduce((sum, l) => sum + l.average_rating, 0) / lecturers.length
      : 0;

  const handleDelete = async (id: string) => {
    await deleteReview.mutateAsync({
      reviewId: id,
      lecturerId: selectedId,
      courseId,
    });
    toast({ title: "הדירוג נמחק" });
  };

  const openDialogFor = (lecId: string, mode: "view" | "rate" = "view") => {
    setSelectedId(lecId);
    setTab(mode);
    setDialogOpen(true);
  };

  // כפתורי דירוג מודרניים
  const ratingButtons = [5, 4, 3, 2, 1].map((n) => (
    <Button
      key={n}
      variant={filterStars === n ? "default" : "outline"}
      size="icon"
      onClick={() => setFilterStars((f) => (f === n ? null : n))}
      className={`
        text-base rounded-full mx-0.5
        ${filterStars === n ? "bg-amber-400 text-white border-amber-400" : "bg-white text-yellow-600 border border-yellow-300"}
        transition shadow
      `}
      style={{ width: 38, height: 38, fontWeight: "bold" }}
    >
      {n}★
    </Button>
  ));

  return (
    <section
      className={`
        w-full min-h-[60vh] flex flex-col items-center justify-center
        py-3 md:py-10 relative z-0
        ${MODAL_BG} ${MODAL_SHADOW}
        transition-colors duration-300
        font-[Assistant,sans-serif]
      `}
      dir="rtl"
    >
      {/* Header */}
      <header className="text-center mb-6 md:mb-9 space-y-2">
        <h2 className="text-2xl md:text-4xl font-extrabold text-amber-700 dark:text-yellow-200 drop-shadow">
          דירוג מרצים מתקדם
        </h2>
        <p className="text-gray-700 dark:text-yellow-200/90 text-base md:text-xl font-semibold">
          {courseName} — דירוג איכות, זמינות ויחס אישי
        </p>
      </header>
      {/* סטטיסטיקות */}
      <div className="flex flex-row gap-4 justify-center items-center mb-5">
        <div className="flex flex-col items-center">
          <div className="text-xl font-bold text-amber-600 dark:text-yellow-200">{lecturers.length}</div>
          <div className="text-sm text-gray-500 dark:text-yellow-100">מרצים</div>
        </div>
        <div className="flex flex-col items-center">
          <div className="text-xl font-bold text-amber-600 dark:text-yellow-200">{totalRatings}</div>
          <div className="text-sm text-gray-500 dark:text-yellow-100">דירוגים</div>
        </div>
        <div className="flex flex-col items-center">
          <div className="text-xl font-bold text-amber-600 dark:text-yellow-200">{avgOverall.toFixed(1)}</div>
          <div className="text-sm text-gray-500 dark:text-yellow-100">ממוצע כללי</div>
        </div>
      </div>
      {/* חיפוש ומיון */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between w-full max-w-2xl mx-auto mb-4 px-2">
        <div className="relative w-full md:w-56">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-amber-300 dark:text-yellow-700" />
          <Input
            placeholder="חפש מרצה..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-9 text-base rounded-lg bg-amber-50 dark:bg-yellow-950/40 w-full text-right"
            dir="rtl"
          />
        </div>
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
          <SelectTrigger className="h-9 w-28 text-base rounded-lg text-right" dir="rtl">
            <Filter className="ml-2" />
            <SelectValue placeholder="מיון" />
          </SelectTrigger>
          <SelectContent dir="rtl">
            <SelectItem value="rating">לפי דירוג</SelectItem>
            <SelectItem value="reviews">לפי ביקורות</SelectItem>
            <SelectItem value="name">לפי שם</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-0.5">
          {ratingButtons}
        </div>
      </div>
      {/* Top 3 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mx-auto w-full max-w-3xl pb-3">
        {top3.map((lec, i) => (
          <Top3LecturerCard
            key={lec.id}
            lecturer={lec}
            rank={i + 1}
            onSelect={openDialogFor}
          />
        ))}
      </div>
      {/* כל שאר המרצים */}
      {restLecturers.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 mx-auto max-w-2xl w-full">
          {restLecturers.map((lec) => (
            <LecturerCard
              key={lec.id}
              lecturer={lec}
              onSelect={openDialogFor}
            />
          ))}
        </div>
      )}
      {/* כפתור דירוג */}
      <div className="text-center mb-3">
        <Button
          onClick={() => openDialogFor("", "rate")}
          className={`
            flex items-center gap-2 mx-auto
            bg-gradient-to-r from-amber-400 to-yellow-500 dark:from-yellow-500 dark:to-yellow-400
            text-white text-base md:text-xl font-extrabold px-6 md:px-8 py-2 md:py-4
            rounded-full shadow-xl hover:from-yellow-500 hover:to-yellow-600 hover:scale-105 transition
            border border-yellow-200 dark:border-yellow-800
            tracking-wide
          `}
        >
          <Plus className="w-6 h-6" />
          דרג או הוסף מרצה
        </Button>
      </div>
      {/* Dialog Modal */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          className={`
            !max-w-[99vw] md:!max-w-3xl lg:!max-w-4xl
            !rounded-2xl !p-0
            border-0
            bg-transparent
            overflow-visible
            min-h-[36vh] max-h-[95vh]
            flex items-center justify-center
            font-[Assistant,sans-serif]
            mt-1 sm:mt-0
          `}
        >
          <motion.div
            className={`
              relative z-10
              bg-white dark:bg-zinc-900
              rounded-2xl overflow-hidden
              shadow-lg
              max-h-[94vh] min-h-[25vh]
              flex flex-col w-full max-w-full
            `}
            initial={{ opacity: 0, scale: 0.98, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 60 }}
            transition={{ duration: 0.28 }}
            dir="rtl"
          >
            <DialogHeader className="px-5 pt-4 pb-2 flex items-center justify-between bg-gradient-to-b from-amber-50 dark:from-yellow-900/10 to-transparent" dir="rtl">
              <DialogTitle className="text-lg md:text-2xl font-extrabold text-amber-700 dark:text-yellow-200" dir="rtl">
                דירוג מרצים — {courseName}
              </DialogTitle>
              <DialogClose asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-gray-600 dark:text-yellow-100 hover:bg-amber-100 dark:hover:bg-yellow-700/30 transition"
                >
                  <X className="w-6 h-6" />
                </Button>
              </DialogClose>
            </DialogHeader>
            <Tabs
              value={tab}
              onValueChange={(v) => setTab(v as any)}
              className="flex flex-col flex-1 w-full"
              dir="rtl"
            >
              <TabsList
                className={`
                  flex w-full bg-gradient-to-r from-[#f2e1c2] via-[#232629] to-[#2d3135] dark:from-[#33373a] dark:via-[#18181b] dark:to-[#232629]
                  rounded-2xl border border-amber-200/40 dark:border-yellow-700/40 shadow-lg mb-5 overflow-hidden
                  min-h-[38px] flex-row-reverse
                `}
                dir="rtl"
              >
                <TabsTrigger
                  value="rate"
                  className={`
                    flex-1 text-base md:text-xl font-bold transition
                    data-[state=active]:bg-gradient-to-r data-[state=active]:from-yellow-500 data-[state=active]:to-amber-600
                    data-[state=active]:text-white
                    data-[state=inactive]:bg-transparent
                    data-[state=inactive]:text-amber-700/90
                    px-2 py-2 md:py-3 rounded-2xl
                  `}
                  dir="rtl"
                >
                  דרג מרצה
                </TabsTrigger>
                <TabsTrigger
                  value="view"
                  className={`
                    flex-1 text-base md:text-xl font-bold transition
                    data-[state=active]:bg-gradient-to-r data-[state=active]:from-yellow-500 data-[state=active]:to-amber-600
                    data-[state=active]:text-white
                    data-[state=inactive]:bg-transparent
                    data-[state=inactive]:text-amber-700/90
                    px-2 py-2 md:py-3 rounded-2xl
                  `}
                  dir="rtl"
                >
                  הצג דירוגים
                </TabsTrigger>
              </TabsList>
              {/* בחירת מרצה בראש */}
              {tab === "view" && (
                <div className="flex items-center gap-3 px-5 pb-3">
                  <Select value={selectedId} onValueChange={setSelectedId}>
                    <SelectTrigger className="h-10 w-full md:w-64 text-base rounded-lg text-right" dir="rtl">
                      <SelectValue placeholder="בחר מרצה לצפייה..." />
                    </SelectTrigger>
                    <SelectContent dir="rtl">
                      {lecturers.map((l) => (
                        <SelectItem key={l.id} value={l.id} className="text-base py-2 text-right" dir="rtl">
                          {l.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {/* תוכן צפייה */}
              <TabsContent
                value="view"
                className="space-y-6 px-5 py-2 max-h-[48vh] overflow-y-auto"
                dir="rtl"
              >
                {!selectedId ? (
                  <div className="text-center text-gray-400 py-6 text-base">
                    בחר מרצה לצפייה בפרטים
                  </div>
                ) : reviews.length === 0 ? (
                  <div className="text-center text-gray-500 dark:text-yellow-200 py-6 text-base">
                    אין חוות דעת למרצה זה עדיין
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <AnimatePresence>
                      {reviews.map((rev) => (
                        <ReviewItem
                          key={rev.id}
                          review={rev}
                          isOwn={rev.user_id === user?.id}
                          onEdit={() => setTab("rate")}
                          onDelete={handleDelete}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </TabsContent>
              {/* תוכן דירוג (דרוש התחברות) */}
              <TabsContent
                value="rate"
                className="px-5 py-2 max-h-[48vh] overflow-y-auto"
                dir="rtl"
              >
                {!user ? (
                  <div className="flex flex-col items-center justify-center py-10">
                    <LogIn className="w-12 h-12 mb-4 text-yellow-500" />
                    <div className="text-base font-bold mb-3">להגשת דירוג — יש להתחבר</div>
                    <Button
                      className="bg-yellow-400 text-white rounded-xl px-8 py-2 font-bold"
                      onClick={login}
                    >
                      התחברות
                    </Button>
                  </div>
                ) : (
                  <LecturerReviewForm
                    courseId={courseId}
                    lecturers={courseLecs}
                    user={user}
                    onAdded={(l) => setLecturers((prev) => [...prev, l])}
                    onSuccess={() => setTab("view")}
                  />
                )}
              </TabsContent>
            </Tabs>
            <DialogFooter className="px-5 pb-5 pt-1 flex justify-end" dir="rtl">
              <DialogClose asChild>
                <Button
                  variant="outline"
                  size="lg"
                  className="text-base px-5 py-2 rounded-xl border-amber-300 dark:border-yellow-800"
                >
                  סגור
                </Button>
              </DialogClose>
            </DialogFooter>
          </motion.div>
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default EnhancedLecturerRatingsSection;
