import React, { useState, useMemo, useEffect } from "react";
import {
  Star,
  Heart,
  Plus,
  ThumbsUp,
  Trash2,
  ChevronDown,
  ChevronUp,
  Smile,
  Sparkles,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  useCourseReviews,
  useCourseRating,
  useCreateCourseReview,
  useMarkReviewHelpful,
  useDeleteCourseReview,
} from "@/hooks/useCourseReviews";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";

// === Utils ===
const RATING_LABELS = {
  1: "ממש לא מומלץ",
  2: "לא טוב",
  3: "בסדר",
  4: "מומלץ",
  5: "מצוין!",
};
const formatDate = (dateStr) =>
  new Date(dateStr).toLocaleDateString("he-IL", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });
const renderStars = (count, size = "md") => (
  <div className="flex gap-1">
    {[1, 2, 3, 4, 5].map((star) => (
      <Star
        key={star}
        className={`
          ${size === "lg" ? "w-6 h-6" : size === "sm" ? "w-4 h-4" : "w-5 h-5"}
          ${star <= count
            ? "fill-yellow-400 text-yellow-400 drop-shadow"
            : "text-gray-300 dark:text-gray-600"}
        `}
      />
    ))}
  </div>
);
const RatingBarChart = ({ reviews = [] }) => {
  const counts = [0, 0, 0, 0, 0];
  reviews.forEach((r) => {
    if (r.rating >= 1 && r.rating <= 5) counts[r.rating - 1]++;
  });
  const max = Math.max(...counts, 1);

  return (
    <div className="flex flex-col gap-1 w-full px-1">
      {[5, 4, 3, 2, 1].map((star, idx) => (
        <div className="flex items-center gap-2" key={star}>
          <span className="text-xs text-gray-600 dark:text-gray-300 w-5">{star}</span>
          {renderStars(star, "sm")}
          <div className="bg-gray-200 dark:bg-gray-700 rounded h-2 w-28 sm:w-40 relative overflow-hidden">
            <motion.div
              className="absolute left-0 h-2 rounded bg-yellow-300"
              style={{
                width: `${(counts[star - 1] / max) * 100}%`,
                minWidth: counts[star - 1] > 0 ? 10 : 0,
              }}
              initial={{ width: 0 }}
              animate={{ width: `${(counts[star - 1] / max) * 100}%` }}
              transition={{ delay: 0.1 + idx * 0.07, duration: 0.3 }}
            />
          </div>
          <span className="text-xs text-gray-600 dark:text-gray-300 min-w-6 text-center">{counts[star - 1]}</span>
        </div>
      ))}
    </div>
  );
};

// === ReviewCard ===
const ReviewCard = ({
  review,
  index,
  currentUserId,
  onDelete,
  onHelpful,
  isLoggedIn,
  optimisticHelpful = 0,
  disableHelpful = false,
}) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: 10 }}
    transition={{ duration: 0.28, delay: index * 0.03 }}
    className="h-full"
  >
    <Card className={`
      h-full rounded-2xl shadow border border-gray-200 dark:border-gray-800
      bg-white dark:bg-zinc-900 flex flex-col justify-between transition-all min-w-0
    `}>
      <CardContent className="p-5 flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center gap-2 mb-2">
          <Avatar className="w-8 h-8">
            <AvatarImage
              src={
                review.is_anonymous
                  ? ""
                  : review.user_profile?.avatar_url ||
                    `https://api.dicebear.com/8.x/thumbs/svg?seed=${
                      review.user_profile?.name || review.user_id
                    }`
              }
            />
            <AvatarFallback className="bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-200">
              {review.is_anonymous
                ? "?"
                : review.user_profile?.name?.charAt(0)?.toUpperCase() || "S"}
            </AvatarFallback>
          </Avatar>
          <span className="font-bold text-gray-800 dark:text-yellow-100 text-base truncate max-w-[90px] sm:max-w-[160px]">
            {review.is_anonymous
              ? "סטודנט אנונימי"
              : review.user_profile?.name || "סטודנט"}
          </span>
          <Badge variant="secondary" className="text-xs font-normal px-2 py-0.5">
            {formatDate(review.created_at)}
          </Badge>
          {review.rating === 5 && (
            <span className="text-green-500 text-xs ml-2 flex gap-1 items-center">
              <Sparkles className="w-4 h-4" /> מומלץ!
            </span>
          )}
          {currentUserId === review.user_id && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(review.id)}
              className="text-red-400 hover:text-red-700 ml-1"
              title="מחק ביקורת"
            >
              <Trash2 className="w-5 h-5" />
            </Button>
          )}
        </div>
        {/* Stars */}
        <div className="flex items-center gap-1 mb-1">
          {renderStars(review.rating, "sm")}
          <span className="text-xs text-gray-500">({review.rating}/5)</span>
        </div>
        {/* Label */}
        <div className="mb-1 text-gray-800 dark:text-yellow-100 text-xs font-semibold">
          {RATING_LABELS[review.rating]}
        </div>
        {/* Text */}
        <div className="mb-1 min-h-[22px] max-h-20 overflow-auto leading-snug text-gray-900 dark:text-yellow-50 text-[15px]">
          {review.review_text || <span className="text-gray-400">לא נכתב תוכן</span>}
        </div>
        {/* טיפ */}
        {review.tips && (
          <div className="bg-indigo-50 dark:bg-indigo-900/40 border border-indigo-200 dark:border-indigo-800 rounded-lg p-1.5 mb-2 text-indigo-700 dark:text-indigo-100 text-xs flex gap-1 items-center">
            <Heart className="w-4 h-4" /> <strong>טיפ:</strong> {review.tips}
          </div>
        )}
        {/* מועיל */}
        <div className="flex items-center justify-between mt-auto pt-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => !disableHelpful && onHelpful(review.id)}
            disabled={!isLoggedIn || disableHelpful}
            className={`
              gap-1 hover:bg-green-100/40 dark:hover:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-semibold
              px-2 py-1 rounded
              ${disableHelpful ? "opacity-70 pointer-events-none" : ""}
            `}
          >
            <ThumbsUp className="w-4 h-4" />
            מועיל
            <span>
              {review.helpful_count + optimisticHelpful > 0 &&
                <> ({review.helpful_count + optimisticHelpful})</>
              }
            </span>
          </Button>
        </div>
      </CardContent>
    </Card>
  </motion.div>
);

// === ReviewForm ===
const ReviewForm = ({
  rating,
  setRating,
  reviewText,
  setReviewText,
  tips,
  setTips,
  isAnonymous,
  setIsAnonymous,
  isLoading,
  onSubmit,
  onCancel,
  existingReview,
}) => (
  <form
    className="space-y-5"
    onSubmit={(e) => {
      e.preventDefault();
      onSubmit();
    }}
    dir="rtl"
  >
    <div className="flex flex-col items-center gap-2">
      <span className="font-bold text-lg">איך היית מדרג/ת את הקורס?</span>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((num) => (
          <button
            key={num}
            type="button"
            onClick={() => setRating(num)}
            className={`
              w-9 h-9 rounded-full border-2 flex items-center justify-center text-2xl
              ${rating >= num
                ? "bg-yellow-400 border-yellow-500 text-white shadow"
                : "bg-gray-100 border-gray-300 text-gray-400"}
              transition
            `}
            title={RATING_LABELS[num]}
          >
            <Star className="w-6 h-6" fill={rating >= num ? "#fbbf24" : "none"} />
          </button>
        ))}
      </div>
      {rating ? (
        <span className="text-xs text-indigo-600 dark:text-indigo-300 mt-1 font-bold animate-fade">
          {RATING_LABELS[rating]}
        </span>
      ) : null}
    </div>
    <div>
      <Label className="text-base font-bold mb-2 block">חוות דעת על הקורס</Label>
      <Textarea
        value={reviewText}
        onChange={(e) => setReviewText(e.target.value)}
        placeholder="ספר/י על חווייתך, המלצות, יתרונות/חסרונות, קשיים ועוד..."
        className="resize-none min-h-[70px] rounded-xl border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-base"
        maxLength={500}
      />
    </div>
    <div>
      <Label className="text-base font-bold mb-2 block">טיפ לסטודנטים</Label>
      <Textarea
        value={tips}
        onChange={(e) => setTips(e.target.value)}
        placeholder="יש טיפ לסטודנטים? לא חובה :)"
        className="resize-none min-h-[40px] rounded-xl border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-base"
        maxLength={120}
      />
    </div>
    <div className="flex items-center gap-2">
      <Switch
        id="anonymous"
        checked={isAnonymous}
        onCheckedChange={setIsAnonymous}
      />
      <Label htmlFor="anonymous" className="font-medium">
        פרסם ביקורת באופן אנונימי
      </Label>
    </div>
    <div className="flex gap-3 pt-3">
      <Button
        type="submit"
        disabled={isLoading || !rating}
        className="flex-1 h-11 text-lg font-bold rounded-xl"
      >
        {isLoading ? "שולח..." : existingReview ? "עדכן ביקורת" : "פרסם ביקורת"}
      </Button>
      <Button
        variant="outline"
        onClick={onCancel}
        className="flex-1 h-11 text-lg rounded-xl"
        type="button"
      >
        ביטול
      </Button>
    </div>
  </form>
);

// === Main Component ===
const REVIEWS_TO_SHOW = 10;

const CourseReviewsSection = ({
  courseId,
  courseName,
  isLoggedIn,
}) => {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [tips, setTips] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [showAll, setShowAll] = useState(false);
  const [optimisticHelpful, setOptimisticHelpful] = useState({});
  const [disabledHelpful, setDisabledHelpful] = useState({});

  const { data: reviews = [], isLoading } = useCourseReviews(courseId);
  const { data: ratingData } = useCourseRating(courseId);
  const createReview = useCreateCourseReview();
  const markHelpful = useMarkReviewHelpful();
  const deleteReview = useDeleteCourseReview();

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    };
    getCurrentUser();
  }, []);

  const displayedReviews = showAll ? reviews : reviews.slice(0, REVIEWS_TO_SHOW);
  const hasMoreReviews = reviews.length > REVIEWS_TO_SHOW;

  const myReview = useMemo(
    () => reviews.find((r) => r.user_id === currentUserId),
    [reviews, currentUserId]
  );

  // ---- מועיל Optimistic ----
  const handleMarkHelpful = async (reviewId) => {
    if (!isLoggedIn) {
      toast({
        title: "נדרשת התחברות",
        description: "יש להתחבר כדי לסמן ביקורת כמועילה",
        variant: "destructive",
      });
      return;
    }
    if (disabledHelpful[reviewId]) return;
    setOptimisticHelpful((prev) => ({
      ...prev,
      [reviewId]: (prev[reviewId] || 0) + 1,
    }));
    setDisabledHelpful((prev) => ({
      ...prev,
      [reviewId]: true,
    }));
    try {
      await markHelpful.mutateAsync(reviewId);
      toast({
        title: "תודה!",
        description: "הביקורת סומנה כמועילה",
      });
    } catch {
      setOptimisticHelpful((prev) => ({
        ...prev,
        [reviewId]: (prev[reviewId] || 1) - 1,
      }));
      toast({
        title: "שגיאה",
        description: "כבר סימנת ביקורת זו כמועילה",
        variant: "destructive",
      });
    }
  };

  const handleDeleteReview = async (reviewId) => {
    try {
      await deleteReview.mutateAsync(reviewId);
      toast({
        title: "הביקורת נמחקה",
        description: "הביקורת הוסרה בהצלחה",
      });
    } catch {
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה במחיקת הביקורת",
        variant: "destructive",
      });
    }
  };

  return (
    <section
      className={`
        w-full min-h-[50vh] md:min-h-[60vh] max-w-6xl mx-auto
        py-8 px-2 md:px-10
        bg-gradient-to-br from-yellow-50 via-white to-gray-50 dark:from-[#181406] dark:via-zinc-900 dark:to-zinc-800
        rounded-[2.5rem] shadow-2xl border border-yellow-100/40 dark:border-yellow-900/50
        flex flex-col gap-8
        relative overflow-visible
        transition-all
      `}
      dir="rtl"
    >
      {/* Header */}
      <div className="flex flex-col items-center w-full mb-4">
        <div className="flex flex-col sm:flex-row items-center justify-between w-full max-w-2xl mx-auto gap-4">
          <div className="flex flex-col items-center flex-1">
            <span className="text-4xl font-black text-yellow-600 dark:text-yellow-300 flex items-center gap-2">
              {ratingData?.average?.toFixed(1) || 0}
              <Star className="w-7 h-7 text-yellow-400" />
            </span>
            <span className="text-lg text-gray-700 dark:text-yellow-100 mb-2">
              {ratingData?.count || 0} חוות דעת
            </span>
            <div className="w-full max-w-[250px] mx-auto mb-2">
              <RatingBarChart reviews={reviews} />
            </div>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Button
              className="font-bold rounded-full h-12 px-7 shadow bg-gradient-to-r from-yellow-400 to-yellow-500 dark:from-yellow-700 dark:to-yellow-500 text-xl mt-1"
              variant="secondary"
              onClick={() => setIsDialogOpen(true)}
            >
              <Plus className="w-6 h-6 mr-2" />
              {myReview ? "עדכן ביקורת" : "הוסף ביקורת"}
            </Button>
            {myReview && (
              <span className="bg-green-50 dark:bg-green-800/60 text-green-700 dark:text-green-200 px-4 py-1 rounded-full text-xs font-semibold border border-green-200 dark:border-green-700 shadow mt-2">
                כבר כתבת ביקורת על קורס זה!
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Dialog לכתיבת ביקורת */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <span />
        </DialogTrigger>
        <DialogContent className="w-full max-w-2xl bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border py-8 px-6 md:px-12 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl font-bold mb-2">
              {myReview ? "עדכון ביקורת" : `כתיבת ביקורת חדשה על ${courseName}`}
            </DialogTitle>
          </DialogHeader>
          <ReviewForm
            rating={rating}
            setRating={setRating}
            reviewText={reviewText}
            setReviewText={setReviewText}
            tips={tips}
            setTips={setTips}
            isAnonymous={isAnonymous}
            setIsAnonymous={setIsAnonymous}
            isLoading={createReview.isPending}
            onSubmit={async () => {
              if (!isLoggedIn) {
                toast({
                  title: "נדרשת התחברות",
                  description: "יש להתחבר כדי להוסיף ביקורת",
                  variant: "destructive"
                });
                return;
              }
              if (rating === 0) {
                toast({
                  title: "דירוג חסר",
                  description: "אנא בחר דירוג לקורס",
                  variant: "destructive"
                });
                return;
              }
              try {
                await createReview.mutateAsync({
                  course_id: courseId,
                  rating,
                  review_text: reviewText || undefined,
                  tips: tips || undefined,
                  is_anonymous: isAnonymous
                });
                toast({
                  title: "הביקורת נשלחה בהצלחה!",
                  description: "תודה על השיתוף שלך"
                });
                setRating(0);
                setReviewText("");
                setTips("");
                setIsAnonymous(false);
                setIsDialogOpen(false);
              } catch (error) {
                toast({
                  title: "שגיאה",
                  description: "אירעה שגיאה בשליחת הביקורת",
                  variant: "destructive"
                });
              }
            }}
            onCancel={() => setIsDialogOpen(false)}
            existingReview={!!myReview}
          />
        </DialogContent>
      </Dialog>

      {/* ביקורות – גריד רספונסיבי */}
      <div className={`
        grid gap-5
        grid-cols-1
        sm:grid-cols-2
        md:grid-cols-3
        xl:grid-cols-4
        w-full
        min-h-[160px]
        transition-all
      `}>
        {isLoading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="rounded-2xl bg-gradient-to-r from-gray-200 to-gray-100 dark:from-gray-800 dark:to-gray-900 h-40 animate-pulse shadow-inner" />
          ))
        ) : reviews.length === 0 ? (
          <motion.div
            className="col-span-full text-center py-14 flex flex-col items-center gap-3"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Smile className="w-14 h-14 text-yellow-400 mb-2 animate-bounce" />
            <span className="text-xl font-semibold text-gray-700 dark:text-gray-300">עדיין אין ביקורות על הקורס...</span>
            <span className="text-gray-500">היה הראשון לשתף חוויה, טיפ או המלצה!</span>
            <Button
              onClick={() => setIsDialogOpen(true)}
              variant="default"
              className="mt-2 rounded-full px-8 py-3 font-bold bg-gradient-to-r from-yellow-200 via-pink-200 to-green-200 dark:from-indigo-900 dark:to-blue-800"
            >
              כתוב ביקורת ראשונה
            </Button>
          </motion.div>
        ) : (
          <AnimatePresence>
            {displayedReviews.map((review, i) => (
              <ReviewCard
                key={review.id}
                review={review}
                index={i}
                currentUserId={currentUserId}
                onDelete={handleDeleteReview}
                onHelpful={handleMarkHelpful}
                isLoggedIn={isLoggedIn}
                optimisticHelpful={optimisticHelpful[review.id] || 0}
                disableHelpful={!!disabledHelpful[review.id]}
              />
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Show More/Less */}
      {hasMoreReviews && (
        <div className="text-center pt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAll(!showAll)}
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            {showAll ? (
              <>
                <ChevronUp className="w-4 h-4" />
                הראה פחות
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                הראה עוד ({reviews.length - REVIEWS_TO_SHOW} ביקורות)
              </>
            )}
          </Button>
        </div>
      )}
    </section>
  );
};

export default CourseReviewsSection;
