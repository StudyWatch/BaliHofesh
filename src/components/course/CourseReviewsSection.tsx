import React, { useState, useMemo } from "react";
import {
  Star,
  Heart,
  MessageSquare,
  Plus,
  ThumbsUp,
  Trash2,
  ChevronDown,
  ChevronUp,
  Smile,
  Frown,
  User,
  Sparkles
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
  DialogTrigger
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  useCourseReviews,
  useCourseRating,
  useCreateCourseReview,
  useMarkReviewHelpful,
  useDeleteCourseReview
} from "@/hooks/useCourseReviews";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";

// ====== Utility Functions ====== //
const RATING_LABELS = {
  1: "ממש לא מומלץ",
  2: "לא טוב",
  3: "בסדר",
  4: "מומלץ",
  5: "מצוין!"
};

const GRADIENTS = [
  "from-green-50 to-green-100",
  "from-blue-50 to-blue-100",
  "from-yellow-50 to-yellow-100",
  "from-rose-50 to-pink-100",
  "from-indigo-50 to-purple-100"
];

const getRandomGradient = (i) =>
  GRADIENTS[i % GRADIENTS.length] || "from-gray-50 to-gray-100";

const formatDate = (dateStr) =>
  new Date(dateStr).toLocaleDateString("he-IL", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit"
  });

// ====== Render Stars ====== //
const renderStars = (count, size = "md", interactive = false, onClick) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((star) => (
      <motion.span
        key={star}
        whileHover={interactive ? { scale: 1.25, rotate: 8 } : {}}
        className={interactive ? "cursor-pointer" : ""}
        onClick={() => interactive && onClick && onClick(star)}
      >
        <Star
          className={`${
            size === "lg"
              ? "w-8 h-8"
              : size === "sm"
              ? "w-3.5 h-3.5"
              : "w-5 h-5"
          } transition-colors duration-150 ${
            star <= count
              ? "fill-yellow-400 text-yellow-400 drop-shadow"
              : "text-gray-300 dark:text-gray-700"
          }`}
        />
      </motion.span>
    ))}
  </div>
);

// ====== Bar Chart for Rating Distribution ====== //
const RatingBarChart = ({ reviews = [] }) => {
  const counts = [0, 0, 0, 0, 0];
  reviews.forEach((r) => {
    if (r.rating >= 1 && r.rating <= 5) counts[r.rating - 1]++;
  });
  const max = Math.max(...counts, 1);

  return (
    <div className="flex flex-col gap-0.5 w-full px-2">
      {[5, 4, 3, 2, 1].map((star, idx) => (
        <div className="flex items-center gap-2" key={star}>
          <span className="text-xs text-gray-600 dark:text-gray-300 w-5">{star}</span>
          {renderStars(star, "sm")}
          <div className="bg-gray-200 dark:bg-gray-800 rounded h-3 w-44 relative overflow-hidden">
            <motion.div
              className={`absolute left-0 h-3 rounded bg-yellow-300`}
              style={{
                width: `${(counts[star - 1] / max) * 100}%`,
                minWidth: counts[star - 1] > 0 ? 15 : 0
              }}
              initial={{ width: 0 }}
              animate={{ width: `${(counts[star - 1] / max) * 100}%` }}
              transition={{ delay: 0.1 + idx * 0.1, duration: 0.4 }}
            />
          </div>
          <span className="text-xs text-gray-600 dark:text-gray-300 min-w-6 text-center">{counts[star - 1]}</span>
        </div>
      ))}
    </div>
  );
};

// ====== Review Card ====== //
const ReviewCard = ({
  review,
  index,
  currentUserId,
  onDelete,
  onHelpful,
  isLoggedIn
}) => (
  <motion.div
    initial={{ opacity: 0, y: 22 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: 18 }}
    transition={{ duration: 0.45, delay: index * 0.05 }}
    className="overflow-hidden"
  >
    <Card
      className={`rounded-xl shadow bg-gradient-to-br ${getRandomGradient(
        index
      )} hover:scale-[1.02] transition-transform duration-300 border-l-4 ${
        review.rating >= 4
          ? "border-green-400"
          : review.rating <= 2
          ? "border-red-400"
          : "border-yellow-300"
      }`}
    >
      <CardContent className="p-5">
        <div className="flex items-center gap-3 mb-1">
          <Avatar className="w-10 h-10">
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
            <AvatarFallback className="bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-200">
              {review.is_anonymous
                ? "?"
                : review.user_profile?.name?.charAt(0)?.toUpperCase() || "S"}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-800 dark:text-gray-200 text-base">
                {review.is_anonymous
                  ? "סטודנט אנונימי"
                  : review.user_profile?.name || "סטודנט"}
              </span>
              <Badge
                variant="secondary"
                className="text-xs font-normal px-2 py-0.5"
              >
                {formatDate(review.created_at)}
              </Badge>
              {review.rating === 5 && (
                <span className="text-emerald-500 text-xs ml-2 animate-pulse flex gap-1 items-center">
                  <Sparkles className="w-4 h-4" /> מומלץ!
                </span>
              )}
              {review.rating === 1 && (
                <span className="text-rose-500 text-xs ml-2 flex gap-1 items-center">
                  <Frown className="w-4 h-4" /> {RATING_LABELS[1]}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              {renderStars(review.rating, "md")}
              <span className="text-xs text-gray-500">({review.rating}/5)</span>
            </div>
          </div>
          {review.is_anonymous && (
            <span className="ml-auto bg-gray-100 text-gray-600 text-xs rounded-full px-3 py-1 border">
              אנונימי
            </span>
          )}
          {currentUserId === review.user_id && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(review.id)}
              className="text-red-400 hover:text-red-700 ml-2"
              title="מחק ביקורת"
            >
              <Trash2 className="w-5 h-5" />
            </Button>
          )}
        </div>
        <div className="mb-2 mt-1 text-gray-700 dark:text-gray-100">
          <span className="font-semibold">{RATING_LABELS[review.rating]}</span>
        </div>
        <div className="mb-2">
          <p className="text-sm text-gray-900 dark:text-gray-100 leading-relaxed whitespace-pre-line">
            {review.review_text || <span className="text-gray-400">לא נכתב תוכן</span>}
          </p>
        </div>
        {review.tips && (
          <div className="bg-indigo-50 dark:bg-indigo-900/40 border border-indigo-200 dark:border-indigo-800 rounded-lg p-2 mb-2 text-indigo-700 dark:text-indigo-100 text-sm flex gap-1 items-center">
            <Heart className="w-4 h-4" /> <strong>טיפ:</strong> {review.tips}
          </div>
        )}
        <div className="flex items-center justify-between mt-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onHelpful(review.id)}
            disabled={!isLoggedIn}
            className="gap-1 hover:bg-green-100/50 dark:hover:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-semibold"
          >
            <ThumbsUp className="w-4 h-4" />
            מועיל
            {review.helpful_count > 0 && <span>({review.helpful_count})</span>}
          </Button>
        </div>
      </CardContent>
    </Card>
  </motion.div>
);

// ====== Review Form ====== //
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
  existingReview
}) => {
  return (
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
            <motion.button
              key={num}
              type="button"
              whileHover={{ scale: 1.23, rotate: 8 }}
              animate={{ scale: rating === num ? 1.14 : 1 }}
              transition={{ type: "spring", stiffness: 400 }}
              onClick={() => setRating(num)}
              className={`w-10 h-10 rounded-full border-2 flex items-center justify-center text-2xl transition ${
                rating >= num
                  ? "bg-yellow-400 border-yellow-500 text-white shadow-lg"
                  : "bg-gray-100 border-gray-300 text-gray-400"
              }`}
              title={RATING_LABELS[num]}
            >
              <Star className="w-7 h-7" fill={rating >= num ? "#fbbf24" : "none"} />
            </motion.button>
          ))}
        </div>
        {rating ? (
          <span className="text-sm text-indigo-600 dark:text-indigo-300 mt-1 font-bold animate-fade">
            {RATING_LABELS[rating]}
          </span>
        ) : null}
      </div>
      <div>
        <Label className="text-base font-bold mb-2 block">חוות דעת על הקורס</Label>
        <Textarea
          value={reviewText}
          onChange={(e) => setReviewText(e.target.value)}
          placeholder="שתף/י את חווייתך בקורס, המלצות, קשיים, מה אהבת/לא אהבת..."
          className="resize-none min-h-[70px] rounded-xl border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
          maxLength={550}
        />
      </div>
      <div>
        <Label className="text-base font-bold mb-2 block">טיפ לסטודנטים</Label>
        <Textarea
          value={tips}
          onChange={(e) => setTips(e.target.value)}
          placeholder="אם יש טיפ חשוב לסטודנטים - כתוב כאן! לא חובה"
          className="resize-none min-h-[45px] rounded-xl border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
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
          פרסם באופן אנונימי
        </Label>
      </div>
      <div className="flex gap-3 pt-3">
        <Button
          type="submit"
          disabled={isLoading || !rating}
          className="flex-1 h-11 text-lg font-bold"
        >
          {isLoading ? "שולח..." : existingReview ? "עדכן ביקורת" : "פרסם ביקורת"}
        </Button>
        <Button
          variant="outline"
          onClick={onCancel}
          className="flex-1 h-11 text-lg"
          type="button"
        >
          ביטול
        </Button>
      </div>
    </form>
  );
};

// ====== Main Component ====== //
const REVIEWS_TO_SHOW = 3;

const CourseReviewsSection = ({
  courseId,
  courseName,
  isLoggedIn
}) => {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [tips, setTips] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [showAll, setShowAll] = useState(false);

  const { data: reviews = [], isLoading } = useCourseReviews(courseId);
  const { data: ratingData } = useCourseRating(courseId);
  const createReview = useCreateCourseReview();
  const markHelpful = useMarkReviewHelpful();
  const deleteReview = useDeleteCourseReview();

  React.useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    };
    getCurrentUser();
  }, []);

  const displayedReviews = showAll ? reviews : reviews.slice(0, REVIEWS_TO_SHOW);
  const hasMoreReviews = reviews.length > REVIEWS_TO_SHOW;

  // Find my review (for allowing update button/message)
  const myReview = useMemo(
    () => reviews.find((r) => r.user_id === currentUserId),
    [reviews, currentUserId]
  );

  // Handlers
  const handleSubmitReview = async () => {
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
  };

  const handleMarkHelpful = async (reviewId) => {
    if (!isLoggedIn) {
      toast({
        title: "נדרשת התחברות",
        description: "יש להתחבר כדי לסמן ביקורת כמועילה",
        variant: "destructive"
      });
      return;
    }
    try {
      await markHelpful.mutateAsync(reviewId);
      toast({
        title: "תודה!",
        description: "הביקורת סומנה כמועילה"
      });
    } catch (error) {
      toast({
        title: "שגיאה",
        description: "כבר סימנת ביקורת זו כמועילה",
        variant: "destructive"
      });
    }
  };

  const handleDeleteReview = async (reviewId) => {
    try {
      await deleteReview.mutateAsync(reviewId);
      toast({
        title: "הביקורת נמחקה",
        description: "הביקורת הוסרה בהצלחה"
      });
    } catch (error) {
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה במחיקת הביקורת",
        variant: "destructive"
      });
    }
  };

  // ====== Render Section ====== //
  return (
    <section className="w-full max-w-3xl mx-auto my-8 p-5 bg-gradient-to-br from-indigo-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 rounded-3xl shadow-xl border relative overflow-visible" dir="rtl">
      {/* Header with summary */}
      <Card className="border-none shadow-none bg-transparent mb-3">
        <CardContent className="px-0 pb-2">
          <div className="flex flex-col items-center justify-center gap-1">
            <span className="text-4xl font-black text-indigo-700 dark:text-yellow-400 flex items-center gap-2">
              {ratingData?.average?.toFixed(1) || 0}
              <Star className="w-8 h-8 text-yellow-400" />
            </span>
            <span className="text-sm text-gray-700 dark:text-gray-200 mb-2">
              {ratingData?.count || 0} חוות דעת
            </span>
            <div className="w-full max-w-sm mx-auto mb-2">
              <RatingBarChart reviews={reviews} />
            </div>
            <Button
              className="font-bold rounded-full h-10 px-5 shadow bg-gradient-to-r from-yellow-200 via-pink-200 to-green-200 dark:from-indigo-900 dark:to-blue-800 mt-1"
              variant="secondary"
              onClick={() => setIsDialogOpen(true)}
            >
              <Plus className="w-5 h-5 mr-2" />
              {myReview ? "עדכן ביקורת" : "הוסף ביקורת"}
            </Button>
            {myReview && (
              <span className="bg-green-50 text-green-700 px-4 py-1 rounded-full text-xs font-semibold border border-green-200 shadow mt-2">
                כבר כתבת ביקורת על קורס זה!
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Review Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          {/* כבר יש כפתור למעלה */}
          <span />
        </DialogTrigger>
        <DialogContent className="max-w-lg bg-white dark:bg-gray-900 rounded-xl shadow-2xl border py-7 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-center text-xl font-bold mb-2">
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
            onSubmit={handleSubmitReview}
            onCancel={() => setIsDialogOpen(false)}
            existingReview={!!myReview}
          />
        </DialogContent>
      </Dialog>

      {/* Reviews List */}
      <div className="space-y-4 mt-2">
        {isLoading ? (
          <div className="flex flex-col gap-4 pt-8 pb-12">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="rounded-2xl bg-gradient-to-r from-gray-200 to-gray-100 dark:from-gray-800 dark:to-gray-900 h-24 animate-pulse shadow-inner" />
            ))}
          </div>
        ) : reviews.length === 0 ? (
          <motion.div
            className="text-center py-12 flex flex-col items-center gap-3"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Smile className="w-16 h-16 text-yellow-400 mb-2 animate-bounce" />
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
              />
            ))}
          </AnimatePresence>
        )}
      </div>
      {/* Show More/Less Button */}
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
