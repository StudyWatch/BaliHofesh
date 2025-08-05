import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Star, Send, Loader2, Users, Clock, Heart, Plus, CheckCircle } from "lucide-react";
import { useSubmitLecturerReview, useAddLecturer, useUserLecturerReview } from "@/hooks/useLecturerRatings";
import { useAuth } from '@/contexts/AuthProvider';
import { useToast } from "@/hooks/use-toast";
import { AnimatePresence, motion } from "framer-motion";

const RATING_PARAMS = [
  { key: "teaching_quality", label: "איכות הוראה והעברת חומר", icon: Users, color: "text-blue-600" },
  { key: "lecturer_availability", label: "זמינות המרצה", icon: Clock, color: "text-green-600" },
  { key: "personal_approach", label: "יחס אישי", icon: Heart, color: "text-purple-600" },
];

function getDescription(rating: number) {
  return ({
    1: "גרוע מאוד",
    2: "גרוע",
    3: "בסדר",
    4: "טוב",
    5: "מעולה",
  }[rating] || "");
}

interface LecturerReviewFormProps {
  lecturers: any[];
  courseId: string;
  onSuccess?: () => void;
  editData?: any;
  isRTL?: boolean;
}

const LecturerReviewForm = ({
  lecturers,
  courseId,
  onSuccess,
  editData,
  isRTL = true,
}: LecturerReviewFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);

  const [selectedLecturer, setSelectedLecturer] = useState(editData?.lecturer_id || "");
  const [ratings, setRatings] = useState<Record<string, number>>({
    teaching_quality: editData?.teaching_quality || 0,
    lecturer_availability: editData?.lecturer_availability || 0,
    personal_approach: editData?.personal_approach || 0,
  });
  const [hoveredRatings, setHoveredRatings] = useState<Record<string, number>>({});
  const [comment, setComment] = useState(editData?.comment || "");
  const [stage, setStage] = useState<0 | 1 | 2>(0);
  const [showAddLecturer, setShowAddLecturer] = useState(false);
  const [newLecturerName, setNewLecturerName] = useState("");
  const [suggestedLecturers, setSuggestedLecturers] = useState<any[]>([]);

  const submitReviewMutation = useSubmitLecturerReview();
  const addLecturerMutation = useAddLecturer();

  const { data: myReview, refetch: refetchMyReview } = useUserLecturerReview(selectedLecturer, courseId);

  useEffect(() => {
    if (myReview && selectedLecturer) {
      setRatings({
        teaching_quality: myReview.teaching_quality || 0,
        lecturer_availability: myReview.lecturer_availability || 0,
        personal_approach: myReview.personal_approach || 0,
      });
      setComment(myReview.comment || "");
    }
  }, [myReview, selectedLecturer]);

  // סטארים רספונסיביים במיוחד
  const renderStarRating = (paramKey: string, value: number, onRate: (r: number) => void) => (
    <div className="flex flex-row-reverse gap-0.5 justify-center items-center select-none">
      {[5, 4, 3, 2, 1].map((star) => (
        <button
          key={star}
          type="button"
          tabIndex={0}
          className="focus:outline-none focus:ring-2 focus:ring-blue-400 rounded hover:scale-110 transition-transform"
          onMouseEnter={() => setHoveredRatings((h) => ({ ...h, [paramKey]: star }))}
          onMouseLeave={() => setHoveredRatings((h) => ({ ...h, [paramKey]: 0 }))}
          onClick={() => onRate(star)}
          aria-label={`דרג ${star} מתוך 5`}
        >
          <Star
            className={`w-8 h-8 xs:w-7 xs:h-7 sm:w-8 sm:h-8 drop-shadow transition-colors ${
              star <= (hoveredRatings[paramKey] || value)
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300 hover:text-yellow-200"
            }`}
          />
        </button>
      ))}
    </div>
  );

  const renderAddLecturer = () => (
    <motion.div
      initial={{ opacity: 0, y: 25 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 25 }}
      className="p-5 bg-white border rounded-xl shadow-lg mx-auto w-full max-w-xs flex flex-col gap-3"
      dir="rtl"
    >
      <div className="font-bold text-lg text-blue-900 flex items-center gap-2">
        <Plus className="w-5 h-5" />
        הוסף מרצה חדש
      </div>
      <Input
        value={newLecturerName}
        onChange={e => setNewLecturerName(e.target.value)}
        placeholder="שם המרצה"
        autoFocus
      />
      {suggestedLecturers.length > 0 && (
        <div className="bg-blue-50 rounded-xl p-2 mt-2">
          <div className="text-xs mb-1 font-medium">מרצים דומים:</div>
          {suggestedLecturers.map(l => (
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
          onClick={async () => {
            if (!newLecturerName.trim()) return;
            try {
              const result = await addLecturerMutation.mutateAsync({
                name: newLecturerName.trim(),
                course_id: courseId,
              });
              if (result.existing) {
                setSuggestedLecturers(result.existing);
                toast({ title: "מרצים דומים נמצאו", description: "בחר מהרשימה, או המשך להוספה" });
              } else {
                toast({ title: "מרצה נוסף", description: "המרצה נוסף בהצלחה, אפשר לדרג" });
                setSelectedLecturer(result.new.id);
                setShowAddLecturer(false);
                setNewLecturerName("");
                setSuggestedLecturers([]);
                setTimeout(() => {
                  if (formRef.current) {
                    formRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
                  }
                }, 400);
              }
            } catch (error) {
              toast({ title: "שגיאה", description: "שגיאה בהוספת המרצה", variant: "destructive" });
            }
          }}
          disabled={!newLecturerName.trim() || addLecturerMutation.isPending}
        >
          {addLecturerMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
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
    </motion.div>
  );

  const allRatingsSet = Object.values(ratings).every((r) => r > 0);
  const averageRating = allRatingsSet
    ? Math.round((ratings.teaching_quality + ratings.lecturer_availability + ratings.personal_approach) / 3 * 10) / 10
    : 0;

  // --- Submit ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({ title: "שגיאה", description: "עליך להתחבר כדי להגיש דירוג", variant: "destructive" });
      return;
    }
    if (!selectedLecturer || !allRatingsSet) {
      toast({ title: "שגיאה", description: "אנא בחר מרצה ודרג בכל הפרמטרים", variant: "destructive" });
      return;
    }
    try {
      await submitReviewMutation.mutateAsync({
        lecturer_id: selectedLecturer,
        course_id: courseId,
        teaching_quality: ratings.teaching_quality,
        lecturer_availability: ratings.lecturer_availability,
        personal_approach: ratings.personal_approach,
        comment: comment.trim(),
      });
      toast({ title: "הדירוג נשלח!", description: "הדירוג שלך נשמר בהצלחה" });
      setStage(2);
      onSuccess?.();
      refetchMyReview?.();
      setTimeout(() => setStage(0), 1800);
    } catch {
      toast({ title: "שגיאה", description: "שגיאה בשליחת הדירוג", variant: "destructive" });
    }
  };

  return (
    <div
      className="
        relative w-full min-h-screen flex flex-col items-center justify-center py-2
        bg-gradient-to-br from-blue-50 via-purple-50 to-white
        sm:rounded-xl
      "
      dir="rtl"
    >
      <AnimatePresence mode="wait">
        {stage === 2 ? (
          <motion.div
            key="success"
            className="flex flex-col items-center justify-center py-16"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
          >
            <CheckCircle className="w-12 h-12 text-green-600 mb-4" />
            <div className="font-bold text-2xl text-green-900">הדירוג נשלח!</div>
          </motion.div>
        ) : showAddLecturer ? (
          <>{renderAddLecturer()}</>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 35 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 35 }}
            transition={{ type: "spring", bounce: 0.18 }}
            className={`
              w-full max-w-lg md:max-w-xl
              bg-white/95 border border-blue-200
              rounded-3xl shadow-xl mx-auto
              px-0 sm:px-2
            `}
          >
            <form
              ref={formRef}
              className={`
                flex flex-col gap-3 xs:gap-2 sm:gap-6
                max-h-[78vh] overflow-y-auto px-3 sm:px-8 py-4 sm:py-7
                text-base sm:text-lg
              `}
              onSubmit={handleSubmit}
              dir="rtl"
              tabIndex={0}
              style={{ minHeight: 300 }}
            >
              {/* בחירת מרצה */}
              <div className="flex flex-col gap-1">
                <label className="font-semibold text-blue-900 text-base sm:text-lg mb-2">
                  בחר מרצה או
                  <Button
                    size="sm"
                    variant="secondary"
                    type="button"
                    className="ml-2"
                    onClick={() => setShowAddLecturer(true)}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    הוסף חדש
                  </Button>
                </label>
                <Select
                  value={selectedLecturer}
                  onValueChange={val => setSelectedLecturer(val)}
                  disabled={addLecturerMutation.isPending}
                >
                  <SelectTrigger className="h-11 text-base bg-white rounded-lg shadow">
                    <SelectValue placeholder="בחר מרצה מהרשימה..." />
                  </SelectTrigger>
                  <SelectContent>
                    {lecturers.map(lecturer => (
                      <SelectItem key={lecturer.id} value={lecturer.id} className="text-base">
                        {lecturer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {/* דירוגים */}
              <div className="flex flex-col gap-2">
                {RATING_PARAMS.map(param => {
                  const IconComponent = param.icon;
                  return (
                    <div
                      key={param.key}
                      className={`
                        bg-gray-50 rounded-xl p-3 flex flex-col items-center gap-2 shadow border w-full
                        sm:flex-row sm:justify-between sm:gap-6
                      `}
                    >
                      <div className="flex items-center gap-2 mb-2 sm:mb-0">
                        <IconComponent className={`w-5 h-5 ${param.color}`} />
                        <span className="font-semibold text-base">{param.label}</span>
                      </div>
                      {renderStarRating(param.key, ratings[param.key], r => setRatings(s => ({ ...s, [param.key]: r })))}
                      {ratings[param.key] > 0 && (
                        <span className="text-xs text-gray-600 mt-1">{getDescription(ratings[param.key])}</span>
                      )}
                    </div>
                  );
                })}
              </div>
              {/* ממוצע */}
              {allRatingsSet && (
                <motion.div
                  key="avg"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-2 text-center mb-2"
                >
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    <span className="text-lg font-bold text-gray-800">{averageRating.toFixed(1)}</span>
                  </div>
                  <div className="text-xs text-gray-500">ממוצע כללי</div>
                </motion.div>
              )}
              {/* חוות דעת */}
              <div>
                <label className="font-semibold text-base mb-1 block">חוות דעת (לא חובה)</label>
                <Textarea
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  placeholder="איך המרצה מעביר את החומר? עזר לסטודנטים? מה אהבת/לא אהבת? כל דבר חשוב"
                  rows={3}
                  className="resize-none text-base rounded-xl"
                  maxLength={400}
                />
                <div className="text-xs text-gray-400 text-left mt-1">
                  {comment.length}/400 תווים
                </div>
              </div>
              {/* שליחה */}
              <Button
                type="submit"
                disabled={
                  submitReviewMutation.isPending ||
                  !selectedLecturer ||
                  !allRatingsSet
                }
                className="
                  w-full h-12 sm:h-14 text-base sm:text-lg font-bold rounded-full
                  bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-md
                  fixed left-0 right-0 bottom-0 mx-auto
                  z-20 sm:relative sm:z-auto
                  sm:mb-0
                "
                style={{ maxWidth: 600 }}
              >
                {submitReviewMutation.isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    שומר...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5 mr-2" />
                    {editData ? "עדכן דירוג" : "שלח דירוג"}
                  </>
                )}
              </Button>
              <div className="text-xs text-gray-500 text-center mt-2">
                הדירוג נשלח בעילום שם, ניתן לערוך בכל עת
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LecturerReviewForm;
