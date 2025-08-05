import React, { useEffect, useState, useRef } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Star,
  Send,
  Loader2,
  Plus,
  CheckCircle,
  Users,
  Clock,
  Heart,
  Pencil,
  AlertCircle
} from "lucide-react";
import {
  useSubmitLecturerReview,
  useAddLecturer,
  useUserLecturerReview,
  type LecturerRating,
  type SubmitReviewData
} from "@/hooks/useLecturerRatings";
import { useAuth } from '@/contexts/AuthProvider';
import { useToast } from "@/hooks/use-toast";
import { AnimatePresence, motion } from "framer-motion";

// פרטי פרמטרים לדירוג
const RATING_PARAMETERS = [
  {
    key: "teaching_quality",
    labelHe: "איכות הוראה והעברת חומר",
    icon: Users,
    color: "text-blue-600"
  },
  {
    key: "lecturer_availability",
    labelHe: "זמינות המרצה",
    icon: Clock,
    color: "text-green-600"
  },
  {
    key: "personal_approach",
    labelHe: "יחס אישי",
    icon: Heart,
    color: "text-purple-600"
  }
] as const;

type RatingKey = typeof RATING_PARAMETERS[number]["key"];

const getRatingDescription = (rating: number) => {
  return (
    {
      1: "גרוע מאוד",
      2: "גרוע",
      3: "בסדר",
      4: "טוב",
      5: "מעולה"
    }[rating] || ""
  );
};

interface EnhancedLecturerReviewFormProps {
  lecturers: LecturerRating[];
  courseId: string;
  onSuccess?: () => void;
  // אפשר גם לשים פה editData אם רוצים תמיכה בעריכה ממקום אחר
}

const EnhancedLecturerReviewForm: React.FC<EnhancedLecturerReviewFormProps> = ({
  lecturers,
  courseId,
  onSuccess
}) => {
  const dir = "rtl";
  const { user } = useAuth();
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);

  // States
  const [selectedLecturer, setSelectedLecturer] = useState<string>("");
  const [ratings, setRatings] = useState<Record<RatingKey, number>>({
    teaching_quality: 0,
    lecturer_availability: 0,
    personal_approach: 0
  });
  const [hoveredRatings, setHoveredRatings] = useState<Record<RatingKey, number>>({
    teaching_quality: 0,
    lecturer_availability: 0,
    personal_approach: 0
  });
  const [comment, setComment] = useState<string>("");

  // מצב עריכה
  const [isEditMode, setIsEditMode] = useState(false);

  // הוספת מרצה
  const [showAddLecturer, setShowAddLecturer] = useState(false);
  const [newLecturerName, setNewLecturerName] = useState("");
  const [suggestedLecturers, setSuggestedLecturers] = useState<any[]>([]);

  // שליפה של דירוג קודם
  const { data: existingReview, refetch: refetchUserReview } = useUserLecturerReview(
    selectedLecturer,
    courseId
  );

  const submitReviewMutation = useSubmitLecturerReview();
  const addLecturerMutation = useAddLecturer();

  // מילוי אוטומטי של הדירוג הקיים (אם יש)
  useEffect(() => {
    if (existingReview && selectedLecturer) {
      setRatings({
        teaching_quality: existingReview.teaching_quality,
        lecturer_availability: existingReview.lecturer_availability,
        personal_approach: existingReview.personal_approach
      });
      setComment(existingReview.comment || "");
      setIsEditMode(true);
    } else {
      setRatings({
        teaching_quality: 0,
        lecturer_availability: 0,
        personal_approach: 0
      });
      setComment("");
      setIsEditMode(false);
    }
  }, [existingReview, selectedLecturer]);

  // גלילה אוטומטית לפתיחת הטופס
  useEffect(() => {
    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [showAddLecturer, isEditMode]);

  // פונקציה להצגת כוכבים RTL
  const renderStarRating = (
    parameter: RatingKey,
    value: number,
    onRate: (rating: number) => void
  ) => (
    <div className="flex flex-row-reverse gap-1 justify-center">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className="focus:outline-none focus:ring-2 focus:ring-primary rounded transition-all duration-200 hover:scale-110"
          onMouseEnter={() =>
            setHoveredRatings((prev) => ({ ...prev, [parameter]: star }))
          }
          onMouseLeave={() =>
            setHoveredRatings((prev) => ({ ...prev, [parameter]: 0 }))
          }
          onClick={() => onRate(star)}
          aria-label={`דרג ${star} מתוך 5`}
        >
          <Star
            className={`w-8 h-8 transition-all duration-300 ${
              star <= (hoveredRatings[parameter] || value)
                ? "fill-yellow-400 text-yellow-400 scale-110"
                : "text-gray-300 hover:text-yellow-200"
            }`}
          />
        </button>
      ))}
    </div>
  );

  // הוספת מרצה חדש
  const handleAddLecturer = async () => {
    if (!newLecturerName.trim()) return;
    try {
      const result = await addLecturerMutation.mutateAsync({
        name: newLecturerName.trim(),
        course_id: courseId
      });
      if (result.existing) {
        setSuggestedLecturers(result.existing);
        toast({
          title: "מרצים דומים נמצאו",
          description: "בחר מרצה מהרשימה או המשך להוספה"
        });
      } else {
        toast({
          title: "מרצה נוסף",
          description: "המרצה נוסף בהצלחה, ניתן לדרג כעת"
        });
        setSelectedLecturer(result.new.id);
        setShowAddLecturer(false);
        setNewLecturerName("");
        setSuggestedLecturers([]);
        setTimeout(() => {
          formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 400);
      }
    } catch {
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה בהוספת המרצה",
        variant: "destructive"
      });
    }
  };

  // שליחה/עדכון דירוג
  const allRatingsSet = Object.values(ratings).every((rating) => rating > 0);
  const averageRating = allRatingsSet
    ? Object.values(ratings).reduce((sum, rating) => sum + rating, 0) / 3
    : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({
        title: "שגיאה",
        description: "עליך להתחבר כדי להגיש דירוג",
        variant: "destructive"
      });
      return;
    }
    if (!selectedLecturer || !allRatingsSet) {
      toast({
        title: "שגיאה",
        description: "אנא מלא את כל הדירוגים ובחר מרצה",
        variant: "destructive"
      });
      return;
    }
    const reviewData: SubmitReviewData = {
      lecturer_id: selectedLecturer,
      course_id: courseId,
      teaching_quality: ratings.teaching_quality,
      lecturer_availability: ratings.lecturer_availability,
      personal_approach: ratings.personal_approach,
      comment: comment.trim()
    };
    try {
      await submitReviewMutation.mutateAsync(reviewData);
      toast({
        title: isEditMode ? "הדירוג עודכן!" : "נשלח בהצלחה",
        description: isEditMode
          ? "הדירוג שלך עודכן בהצלחה"
          : "הדירוג שלך נשמר בהצלחה"
      });
      if (!isEditMode) {
        setSelectedLecturer("");
        setRatings({
          teaching_quality: 0,
          lecturer_availability: 0,
          personal_approach: 0
        });
        setComment("");
      }
      await refetchUserReview();
      onSuccess?.();
    } catch {
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה בשליחת הדירוג, נסה שנית",
        variant: "destructive"
      });
    }
  };

  // אין משתמש
  if (!user) {
    return (
      <Card dir="rtl" className="border-2 border-dashed border-gray-200">
        <CardContent className="p-8 text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-lg text-muted-foreground mb-4">התחבר כדי לדרג מרצים</p>
          <p className="text-sm text-gray-500">
            רק סטודנטים רשומים יכולים להגיש דירוגים
          </p>
        </CardContent>
      </Card>
    );
  }

  // עיצוב ראשי - כולל גלילה ו־Dialog להוספת מרצה
  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="w-full max-w-2xl mx-auto max-h-[90vh] overflow-y-auto py-4 px-1 md:px-3"
      aria-label="טופס דירוג מרצה"
      dir="rtl"
    >
      <Card dir="rtl" className="bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200 shadow-xl">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            {isEditMode ? "עריכת דירוג מרצה" : "דירוג מרצה - מערכת מתקדמת"}
          </CardTitle>
          <p className="text-gray-600 mt-2">
            דרג את המרצה בשלושה פרמטרים עיקריים. ניתן לערוך בכל עת.
          </p>
        </CardHeader>
        <CardContent className="space-y-7 pb-1">
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
                <DialogContent dir="rtl" className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>הוסף מרצה חדש</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Input
                      placeholder="שם המרצה..."
                      value={newLecturerName}
                      onChange={(e) => setNewLecturerName(e.target.value)}
                      autoFocus
                    />
                    {suggestedLecturers.length > 0 && (
                      <div className="bg-blue-50 rounded-xl p-2 mt-2">
                        <div className="text-xs mb-1 font-medium">מרצים דומים:</div>
                        {suggestedLecturers.map((l: any) => (
                          <Button
                            key={l.id}
                            variant="secondary"
                            size="sm"
                            className="w-full mb-1"
                            onClick={() => {
                              setSelectedLecturer(l.id);
                              setShowAddLecturer(false);
                              setSuggestedLecturers([]);
                              setNewLecturerName("");
                            }}
                          >
                            {l.name}
                          </Button>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2 mt-4">
                      <Button
                        className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold"
                        onClick={handleAddLecturer}
                        disabled={
                          !newLecturerName.trim() || addLecturerMutation.isPending
                        }
                      >
                        {addLecturerMutation.isPending ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Plus className="w-4 h-4 mr-2" />
                        )}
                        הוסף
                      </Button>
                      <Button
                        variant="ghost"
                        className="flex-1"
                        onClick={() => setShowAddLecturer(false)}
                      >
                        ביטול
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <Select
              value={selectedLecturer}
              onValueChange={setSelectedLecturer}
              disabled={addLecturerMutation.isPending}
            >
              <SelectTrigger className="h-12 text-base bg-white rounded-lg shadow">
                <SelectValue placeholder="בחר מרצה מהרשימה..." />
              </SelectTrigger>
              <SelectContent>
                {lecturers.length === 0 ? (
                  <div className="text-center p-4 text-gray-500">אין עדיין מרצים בקורס</div>
                ) : (
                  lecturers.map((lecturer) => (
                    <SelectItem
                      key={lecturer.id}
                      value={lecturer.id}
                      className="text-base flex items-center gap-2"
                    >
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
                  ))
                )}
              </SelectContent>
            </Select>
            {isEditMode && (
              <div className="flex items-center gap-2 mt-2">
                <Pencil className="w-4 h-4 text-blue-500" />
                <span className="text-sm text-blue-700 font-medium">
                  אתה עורך דירוג קודם. תוכל לשנות ולשמור מחדש.
                </span>
              </div>
            )}
          </div>

          {/* דירוגים לפי פרמטרים */}
          <div className="space-y-7">
            {RATING_PARAMETERS.map((param) => {
              const IconComponent = param.icon;
              return (
                <section
                  key={param.key}
                  className="bg-white rounded-xl p-6 flex flex-col items-center gap-2 shadow border"
                >
                  <div className="flex flex-row-reverse items-center gap-2 mb-2">
                    <IconComponent className={`w-6 h-6 ${param.color}`} />
                    <span className="font-semibold text-base">{param.labelHe}</span>
                  </div>
                  {renderStarRating(
                    param.key,
                    ratings[param.key],
                    (r) =>
                      setRatings((prev) => ({
                        ...prev,
                        [param.key]: r
                      }))
                  )}
                  {ratings[param.key] > 0 && (
                    <span className="text-xs text-gray-600 mt-1">
                      {getRatingDescription(ratings[param.key])}
                    </span>
                  )}
                </section>
              );
            })}
          </div>

          {/* ממוצע כללי */}
          {allRatingsSet && (
            <motion.div
              key="avg"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-4 text-center mb-2"
            >
              <div className="flex items-center justify-center gap-2 mb-1">
                <Star className="w-6 h-6 fill-yellow-400 text-yellow-400" />
                <span className="text-xl font-bold text-gray-800">
                  {averageRating.toFixed(1)}
                </span>
              </div>
              <div className="text-xs text-gray-500">ממוצע כללי</div>
            </motion.div>
          )}

          {/* חוות דעת */}
          <div>
            <label className="font-semibold text-base mb-1 block">
              חוות דעת (לא חובה)
            </label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="איך המרצה מעביר את החומר? עזר לסטודנטים? מה אהבת/לא אהבת? כל דבר חשוב"
              rows={3}
              className="resize-none text-base"
              maxLength={400}
            />
            <div className="text-xs text-gray-400 text-left mt-1">
              {comment.length}/400 תווים
            </div>
          </div>
        </CardContent>
      </Card>
      {/* כפתור שליחה דביק ודינמי */}
      <div className="sticky bottom-0 z-10 bg-white/95 backdrop-blur px-4 py-4 mt-3 shadow-inner" dir="rtl">
        <Button
          type="submit"
          disabled={submitReviewMutation.isPending || !selectedLecturer || !allRatingsSet}
          className="w-full h-14 text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-md hover:scale-[1.03] transition-all duration-300"
        >
          {submitReviewMutation.isPending ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              {isEditMode ? "מעדכן..." : "שולח..."}
            </>
          ) : (
            <>
              <Send className="w-5 h-5 mr-2" />
              {isEditMode ? "עדכן דירוג" : "שלח דירוג מתקדם"}
            </>
          )}
        </Button>
        <p className="text-xs text-gray-500 text-center mt-2">
          הדירוג נשלח בעילום שם, ניתן לערוך בכל עת
        </p>
      </div>
    </form>
  );
};

export default EnhancedLecturerReviewForm;
