import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTutors } from "@/hooks/useTutors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import TutorApplicationForm from "@/components/forms/TutorApplicationForm";
import {
  ArrowRight, ArrowLeft, Star, MapPin, Phone, BookOpen,
  Clock, DollarSign, Search, Tag, X, Sparkles, Heart
} from "lucide-react";
import { motion } from "framer-motion";

// ---- CONSTANTS & HELPERS ----
const defaultAvatar = "https://cdn-icons-png.flaticon.com/512/3135/3135789.png";
const CATEGORY_COLORS: Record<string, string> = {
  "מתמטיקה": "from-green-400 to-blue-600",
  "סטטיסטיקה": "from-purple-400 to-pink-500",
  "מחשבים": "from-cyan-500 to-blue-800",
  "כלכלה": "from-orange-400 to-pink-600",
  "הנדסה": "from-blue-700 to-gray-800",
  "מדעי החיים": "from-teal-400 to-lime-500",
  "אנגלית": "from-yellow-400 to-red-400",
  "default": "from-blue-400 to-blue-700"
};
const NIGHT_BLOBS = (
  <>
    <div className="fixed top-[-120px] left-[-90px] w-[350px] h-[350px] bg-gradient-to-br from-blue-700 via-indigo-700 to-purple-700 opacity-25 blur-2xl rounded-full animate-blob" />
    <div className="fixed right-[-60px] bottom-[-70px] w-[250px] h-[250px] bg-gradient-to-br from-cyan-400 via-sky-500 to-blue-700 opacity-20 blur-2xl rounded-full animate-blob animation-delay-3000" />
    <div className="fixed top-1/3 left-1/3 w-[170px] h-[170px] bg-gradient-to-br from-fuchsia-600 via-pink-400 to-blue-400 opacity-15 blur-3xl rounded-full animate-blob animation-delay-1000" />
    <style>{`
      @keyframes blob { 0%,100%{transform:scale(1) translate(0,0);} 50%{transform:scale(1.11) translate(18px,28px);} }
      .animate-blob { animation: blob 16s infinite cubic-bezier(.8,0,.2,1); }
      .animation-delay-1000 { animation-delay: 1s; }
      .animation-delay-3000 { animation-delay: 3s; }
    `}</style>
  </>
);
function getCategoryColor(category: string) {
  return CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS] || CATEGORY_COLORS["default"];
}
type CourseType = { id: string; name_he: string; category?: string; };
function extractAllCourses(tutors: any[]): CourseType[] {
  const all: CourseType[] = [];
  tutors.forEach((tutor) => {
    tutor.tutor_courses?.forEach((tc: any) => {
      if (tc.course?.id && tc.course?.name_he) {
        all.push({ id: String(tc.course.id), name_he: tc.course.name_he, category: tc.course.category });
      }
    });
    tutor.subjects?.forEach((s: string) => {
      const code = s.match(/\(([^)]+)\)/)?.[1] ?? s;
      const name = s.replace(/ \([^)]+\)/, "").replace(/ - ציון: \d+/, "");
      all.push({ id: code, name_he: name, category: "" });
    });
  });
  const unique = new Map<string, CourseType>();
  all.forEach((c) => { if (!unique.has(c.id)) unique.set(c.id, c); });
  return Array.from(unique.values()).sort((a, b) => a.name_he.localeCompare(b.name_he, "he"));
}

// ---- CATEGORY CHIP ----
const CategoryChip: React.FC<{ label: string; selected: boolean; onClick: () => void }> = ({ label, selected, onClick }) => (
  <motion.div
    whileHover={{ scale: 1.09 }}
    whileTap={{ scale: 0.98 }}
    transition={{ type: "spring", stiffness: 400, damping: 28 }}
    className={`
      flex items-center gap-2 px-5 py-2 rounded-full cursor-pointer select-none font-bold shadow-lg border-2 border-transparent
      transition-all duration-200
      ${selected
        ? `bg-gradient-to-l ${getCategoryColor(label)} text-white border-cyan-400 shadow-lg drop-shadow-neon`
        : "bg-zinc-900/90 text-blue-100 hover:bg-blue-900/60 border-blue-800"}
    `}
    onClick={onClick}
    style={{ direction: "rtl" }}
  >
    <Tag className="w-4 h-4" />
    <span className="truncate">{label}</span>
  </motion.div>
);

// ---- COURSE CHIP ----
const CourseChip: React.FC<{ label: string; selected: boolean; onClick: () => void }> = ({ label, selected, onClick }) => (
  <motion.div
    whileHover={{ scale: 1.08 }}
    className={`
      px-3 py-1 rounded-lg cursor-pointer font-medium border
      ${selected
        ? "bg-gradient-to-r from-cyan-500 to-blue-700 text-white border-cyan-400 shadow"
        : "bg-zinc-800 text-blue-100 border-blue-800 hover:bg-blue-900/50"}
      transition
    `}
    onClick={onClick}
    style={{ direction: "rtl" }}
  >
    {label}
  </motion.div>
);

// ---- FILTER BAR ----
const FilterBar: React.FC<{
  searchTerm: string;
  setSearchTerm: (s: string) => void;
  sortKey: "rating" | "price" | "name";
  setSortKey: (k: "rating" | "price" | "name") => void;
  resetAll: () => void;
}> = ({ searchTerm, setSearchTerm, sortKey, setSortKey, resetAll }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
    className="bg-gradient-to-l from-[#181b36] via-[#202f4e] to-[#232a43] rounded-2xl shadow-2xl p-6 flex flex-col md:flex-row items-center gap-5 border border-blue-900/50"
    style={{ direction: "rtl" }}
  >
    <div className="relative flex-1 w-full md:w-auto">
      <Input
        placeholder="חפש מורה לפי שם..."
        value={searchTerm}
        onChange={e => setSearchTerm(e.target.value)}
        className="w-full bg-zinc-900/80 text-blue-100 pr-10 rounded-xl"
        dir="rtl"
      />
      {searchTerm && (
        <X
          className="absolute left-3 top-1/2 transform -translate-y-1/2 cursor-pointer text-blue-300 hover:text-cyan-400"
          onClick={() => setSearchTerm("")}
        />
      )}
    </div>
    <div className="flex items-center gap-4">
      <span className="text-cyan-200 font-bold">מיין לפי:</span>
      <select
        value={sortKey}
        onChange={e => setSortKey(e.target.value as any)}
        className="bg-zinc-900/80 text-cyan-200 rounded-xl px-3 py-1 border-none font-bold"
        dir="rtl"
      >
        <option value="rating">דירוג</option>
        <option value="price">מחיר</option>
        <option value="name">שם</option>
      </select>
      <button
        onClick={resetAll}
        className="ml-3 text-sm text-blue-300 hover:underline font-bold"
        dir="rtl"
      >
        איפוס סינון
      </button>
    </div>
  </motion.div>
);

// ---- FAVORITE HOOK ----
function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>(() =>
    JSON.parse(localStorage.getItem("tutor-favs") || "[]")
  );
  const toggleFav = (id: string) => {
    setFavorites((prev) => {
      const next = prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id];
      localStorage.setItem("tutor-favs", JSON.stringify(next));
      return next;
    });
  };
  return { favorites, toggleFav };
}

// ---- TUTOR CARD ----
const TutorCard: React.FC<{
  tutor: any;
  index: number;
  onProfile: (id: string) => void;
  onContact: (phone?: string) => void;
  isFavorite: boolean;
  onToggleFav: () => void;
  isTodayStar: boolean;
}> = ({ tutor, index, onProfile, onContact, isFavorite, onToggleFav, isTodayStar }) => {
  const [showTip, setShowTip] = useState(false);
  const subjects =
    tutor.tutor_courses?.map((tc: any) => tc.course?.name_he).filter(Boolean as any) ||
    tutor.subjects ||
    [];
  return (
    <motion.div
      className="h-full"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, type: "spring", stiffness: 220, damping: 25 }}
      style={{ direction: "rtl" }}
    >
      <Card className="relative h-full flex flex-col justify-between bg-gradient-to-br from-[#23264b] via-[#181b36ee] to-[#191a3b] dark:bg-[#181b32]/95 rounded-2xl shadow-2xl border border-blue-900 hover:scale-[1.019] hover:shadow-[0_0_44px_10px_#6a7bff44] transition p-6 overflow-visible">
        {isTodayStar && (
          <span className="absolute top-0 right-0 m-2 bg-gradient-to-l from-amber-400 to-yellow-300 text-yellow-900 px-4 py-1 rounded-xl shadow font-black text-sm flex items-center gap-1 z-30 drop-shadow-neon">
            <Sparkles className="w-5 h-5 animate-bounce" />
            מורה היום
          </span>
        )}
        <Button
          variant="ghost"
          size="icon"
          className={`absolute left-3 top-3 z-10 ${isFavorite ? "text-pink-400" : "text-blue-200"}`}
          onClick={onToggleFav}
          aria-label={isFavorite ? "הסר ממועדפים" : "הוסף למועדפים"}
        >
          <Heart fill={isFavorite ? "#f472b6" : "none"} className="w-6 h-6 transition" />
        </Button>
        <div className="space-y-4 flex-1 flex flex-col">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full overflow-hidden bg-blue-800 flex items-center justify-center shadow-xl ring-2 ring-cyan-400/70">
              <img
                src={tutor.avatar_url || defaultAvatar}
                alt={tutor.name}
                className="object-cover w-full h-full"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-blue-100 truncate">{tutor.name}</h3>
                {tutor.is_verified && <Badge className="bg-green-500 text-white text-xs">מאומת</Badge>}
                {tutor.is_online && <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" title="זמין עכשיו" />}
              </div>
              <div
                className="flex items-center gap-1 text-sm text-yellow-400 mt-1 relative group"
                onMouseEnter={() => setShowTip(true)} onMouseLeave={() => setShowTip(false)}
              >
                <Star className="w-4 h-4" />
                <span className="font-semibold">{tutor.rating} ({tutor.reviews_count})</span>
                {showTip && (
                  <span className="absolute top-7 right-0 bg-black/90 text-white px-3 py-1 rounded-xl shadow-lg text-xs z-50 whitespace-nowrap pointer-events-none">
                    דירוג מבוסס על {tutor.reviews_count} חוות דעת
                  </span>
                )}
              </div>
            </div>
          </div>
          <p className="text-blue-100/90 text-sm line-clamp-2 flex-1">{tutor.description}</p>
          <div className="flex flex-wrap gap-1 mb-2">
            {subjects.map((s: string, i: number) => (
              <Badge key={i} variant="secondary" className="text-xs bg-gradient-to-r from-blue-600 to-cyan-700 text-white shadow">{s}</Badge>
            ))}
          </div>
          <div className="space-y-1 text-sm">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-cyan-400" /><span className="text-blue-200">{tutor.location}</span>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-cyan-400" /><span className="text-blue-200">₪{tutor.hourly_rate}/שעה</span>
            </div>
            {tutor.availability && (
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-400" /><span className="text-blue-200">{tutor.availability}</span>
              </div>
            )}
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <Button variant="outline" className="flex-1 font-bold border-cyan-500 text-cyan-400 hover:bg-blue-900/40">
            <BookOpen className="w-4 h-4 ml-2" /> פרופיל
          </Button>
          <Button
            className="flex-1 bg-gradient-to-l from-cyan-500 to-blue-600 text-white font-bold hover:from-blue-700 hover:to-cyan-600 drop-shadow-neon"
            onClick={() => onContact(tutor.phone)}
          >
            <Phone className="w-4 h-4 ml-2" /> צור קשר
          </Button>
        </div>
      </Card>
    </motion.div>
  );
};

// ---- JOIN SQUARE ----
const JoinSquare: React.FC<{ onApply: () => void }> = ({ onApply }) => (
  <Card className="min-h-[220px] relative flex flex-col items-center justify-center bg-gradient-to-br from-blue-800 to-indigo-900 rounded-2xl shadow-2xl border border-blue-900/70 overflow-hidden">
    <div className="absolute inset-0 pointer-events-none">
      <div className="w-full h-full bg-gradient-to-tr from-blue-900/70 to-cyan-800/60 opacity-40" />
    </div>
    <CardContent className="relative z-10 text-center px-6">
      <Sparkles className="w-10 h-10 mx-auto text-cyan-400 animate-pulse mb-2" />
      <h3 className="text-2xl font-bold text-blue-100 mb-1 drop-shadow-neon">המקום הזה שמור בשבילך!</h3>
      <p className="text-blue-200 mb-4 font-medium line-clamp-3">למדת קורס והצטיינת? הזמן שלך ללוות תלמידים ולהעביר ידע!</p>
      <Button
        size="lg"
        className="bg-gradient-to-r from-cyan-600 to-blue-700 text-white font-bold px-8 py-2 rounded-xl shadow-lg hover:from-blue-700 hover:to-cyan-700 transition drop-shadow-neon"
        onClick={onApply}
      >
        <BookOpen className="w-5 h-5 ml-2" /> הגש מועמדות
      </Button>
    </CardContent>
  </Card>
);

// ---- SKELETON CARD ----
const SkeletonCard: React.FC = () => (
  <Card className="h-full bg-gradient-to-br from-blue-900/80 via-[#23264b] to-blue-900/60 rounded-2xl p-6 animate-pulse border border-blue-900">
    <CardContent className="space-y-4">
      <div className="h-4 bg-blue-900 rounded"></div>
      <div className="h-4 w-5/6 bg-blue-900 rounded"></div>
      <div className="h-32 bg-blue-900 rounded"></div>
      <div className="h-4 bg-blue-900 rounded w-3/4"></div>
      <div className="flex gap-2">
        <div className="h-8 w-8 bg-blue-900 rounded-full"></div>
        <div className="flex-1 h-8 bg-blue-900 rounded"></div>
      </div>
    </CardContent>
  </Card>
);

// ---- MAIN PAGE ----
const TutorsPage: React.FC = () => {
  const navigate = useNavigate();
  const { dir } = useLanguage();
  const { data: tutors = [], isLoading } = useTutors();

  const [searchTerm, setSearchTerm] = useState("");
  const [sortKey, setSortKey] = useState<"rating" | "price" | "name">("rating");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const perPage = 9;

  // --- DATA DERIVATION ---
  const allCourses = useMemo(() => extractAllCourses(tutors), [tutors]);
  const categories = useMemo(() => {
    const set = new Set<string>();
    allCourses.forEach((c) => c.category && set.add(c.category));
    return ["all", ...Array.from(set).sort((a, b) => a.localeCompare(b, "he"))];
  }, [allCourses]);
  const coursesInCategory = useMemo(() =>
    selectedCategory === "all" ? [] : allCourses.filter((c) => c.category === selectedCategory),
    [allCourses, selectedCategory]
  );
  const bySearch = useMemo(
    () =>
      !searchTerm
        ? tutors
        : tutors.filter((t) => t.name.toLowerCase().includes(searchTerm.toLowerCase())),
    [tutors, searchTerm]
  );
  const filteredTutors = useMemo(
    () =>
      bySearch
        .filter((tutor) => {
          let okCat = selectedCategory === "all";
          let okCourse = !selectedCourse;
          if (Array.isArray(tutor.tutor_courses)) {
            if (selectedCategory !== "all")
              okCat = tutor.tutor_courses.some(
                (tc: any) => tc.course?.category === selectedCategory
              );
            if (selectedCourse)
              okCourse = tutor.tutor_courses.some(
                (tc: any) => String(tc.course?.id) === selectedCourse
              );
          }
          if (Array.isArray(tutor.subjects) && selectedCourse && !okCourse) {
            okCourse = tutor.subjects.some(
              (s: string) =>
                (s.match(/\(([^)]+)\)/)?.[1] ?? s.replace(/ \([^)]+\)/, "")).toString() ===
                selectedCourse
            );
          }
          return okCat && okCourse;
        })
        .sort((a, b) => {
          if (sortKey === "rating") return b.rating - a.rating;
          if (sortKey === "price") return a.hourly_rate - b.hourly_rate;
          return a.name.localeCompare(b.name);
        }),
    [bySearch, selectedCategory, selectedCourse, sortKey]
  );
  const pages = Math.ceil(filteredTutors.length / perPage);
  const paginated = filteredTutors.slice((currentPage - 1) * perPage, currentPage * perPage);

  // ---- FAVORITES + "STAR OF THE DAY" ----
  const { favorites, toggleFav } = useFavorites();
  const [starOfDay, setStarOfDay] = useState<string | null>(null);
  useEffect(() => {
    if (filteredTutors.length) {
      const idx = new Date().getDate() % filteredTutors.length;
      setStarOfDay(filteredTutors[idx]?.id);
    }
  }, [filteredTutors.length]);

  // ---- RESET ALL FILTERS ----
  const resetAll = () => {
    setSearchTerm("");
    setSortKey("rating");
    setCurrentPage(1);
    setSelectedCategory("all");
    setSelectedCourse("");
  };

  return (
    <div
      dir="rtl"
      className="relative min-h-screen font-[Heebo,Arial,sans-serif] overflow-x-hidden"
      style={{
        background:
          "linear-gradient(135deg, #171c2b 0%, #232441 75%, #171c2b 100%)",
      }}
    >
      {NIGHT_BLOBS}

      {/* HEADER */}
      <header className="bg-gradient-to-l from-[#19213c] via-[#21294a] to-[#161b2b] backdrop-blur-xl shadow-lg px-8 py-7 mb-10 rounded-b-3xl border-b-2 border-blue-900" style={{ direction: "rtl" }}>
        <div className="flex flex-row-reverse items-center justify-between">
          <Button variant="ghost" onClick={() => navigate("/")}>
            <span className="flex items-center gap-2 font-bold text-blue-200 hover:text-white">
              <ArrowRight className="w-5 h-5" /> חזרה
            </span>
          </Button>
          <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-l from-blue-500 via-cyan-400 to-blue-300 bg-clip-text text-transparent drop-shadow-neon">
            מורים פרטיים <span aria-label="מורה" className="ml-1">👨‍🏫</span>
          </h1>
        </div>
      </header>

      <div className="container mx-auto px-6 max-w-screen-2xl space-y-12 pb-20">
        {/* FILTER BAR */}
        <FilterBar
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          sortKey={sortKey}
          setSortKey={setSortKey}
          resetAll={resetAll}
        />

        {/* קטגוריות */}
        <section>
          <h2 className="text-xl font-bold text-cyan-200 mb-2 text-right drop-shadow-neon">בחר קטגוריה:</h2>
          <div className="flex flex-wrap gap-3 justify-start md:justify-start">
            {categories.map((cat) => (
              <CategoryChip
                key={cat}
                label={cat === "all" ? "כל הקטגוריות" : cat}
                selected={selectedCategory === cat}
                onClick={() => {
                  setSelectedCategory(cat);
                  setSelectedCourse("");
                  setCurrentPage(1);
                }}
              />
            ))}
          </div>
        </section>

        {/* בחירת קורסים */}
        {selectedCategory !== "all" && (
          <section>
            <h2 className="text-xl font-bold text-cyan-200 mb-2 text-right drop-shadow-neon">בחר קורס:</h2>
            <div className="flex flex-wrap gap-2 items-center">
              <Search className="w-5 h-5 text-cyan-400" />
              {coursesInCategory.map((course) => (
                <CourseChip
                  key={course.id}
                  label={course.name_he}
                  selected={selectedCourse === course.id}
                  onClick={() => {
                    setSelectedCourse(course.id);
                    setCurrentPage(1);
                  }}
                />
              ))}
              <Button variant="ghost" size="sm" onClick={() => setSelectedCourse("")}>
                איפוס קורס
              </Button>
            </div>
          </section>
        )}

        {/* רשימת מורים */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-9">
          <JoinSquare onApply={() => setShowApplicationForm(true)} />
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
            : paginated.map((t, idx) => (
                <TutorCard
                  key={t.id}
                  tutor={t}
                  index={idx}
                  isFavorite={favorites.includes(t.id)}
                  onToggleFav={() => toggleFav(t.id)}
                  isTodayStar={t.id === starOfDay}
                  onProfile={(id) => navigate(`/tutor/${id}`)}
                  onContact={(phone) => window.open(`tel:${phone || ""}`)}
                />
              ))}
        </div>

        {/* עמודים */}
        {pages > 1 && (
          <div className="flex justify-center items-center gap-4 mt-10 font-bold text-cyan-200">
            <Button
              variant="ghost"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            >
              <ArrowRight className="w-5 h-5" /> הקודם
            </Button>
            <span>עמוד {currentPage} מתוך {pages}</span>
            <Button
              variant="ghost"
              disabled={currentPage === pages}
              onClick={() => setCurrentPage((p) => Math.min(p + 1, pages))}
            >
              הבא <ArrowLeft className="w-5 h-5" />
            </Button>
          </div>
        )}

        {/* קריאה להצטרפות */}
        <Card className="mt-16 bg-gradient-to-l from-cyan-700 via-blue-600 to-indigo-800 text-white rounded-3xl shadow-2xl border-none overflow-hidden drop-shadow-neon">
          <CardContent className="p-10 text-center">
            <h2 className="text-3xl font-extrabold mb-2 drop-shadow-neon">רוצה להיות חלק מההצלחה?</h2>
            <p className="mb-6 opacity-90 text-lg font-bold">הגש מועמדות והצטרף לנבחרת המורים</p>
            <Button
              size="lg"
              variant="secondary"
              className="bg-white text-blue-800 hover:bg-cyan-50 shadow-xl"
              onClick={() => setShowApplicationForm(true)}
            >
              הגש מועמדות
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* מודל הצטרפות */}
      <TutorApplicationForm
        isOpen={showApplicationForm}
        onClose={() => setShowApplicationForm(false)}
      />

      {/* ניאון גלובלי */}
      <style>{`
        .drop-shadow-neon {
          filter: drop-shadow(0 0 10px #63e0ff) drop-shadow(0 0 2px #00fff4) drop-shadow(0 0 1px #0003);
        }
        .line-clamp-2 { display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden }
      `}</style>
    </div>
  );
};

export default TutorsPage;
