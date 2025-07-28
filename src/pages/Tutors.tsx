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
  Clock, DollarSign, Search, Tag, X, Sparkles, Heart, CheckCircle2
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
  // ברירת מחדל
  "default": "from-blue-400 to-blue-700"
};
const DAY_SVG_BG = `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Crect x='0.5' y='0.5' width='79' height='79' rx='19.5' fill='rgba(255,255,255,0.05)' stroke='%2380c9ff' stroke-dasharray='4 6'/%3E%3C/svg%3E")`;
const NIGHT_SVG_BG = `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Crect x='0.5' y='0.5' width='79' height='79' rx='19.5' fill='rgba(0,0,0,0.08)' stroke='%2338bdf8' stroke-dasharray='2 7'/%3E%3C/svg%3E")`;
const DAY_GRAD = "linear-gradient(-45deg, #e0eafc 0%, #cfdef3 100%)";
const NIGHT_GRAD = "linear-gradient(-45deg, #181829 0%, #2c5364 100%)";

// ---- DATA LOGIC ----
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

// ---- UTILS ----
function getCategoryColor(category: string) {
  return CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS] || CATEGORY_COLORS["default"];
}

// ---- CATEGORY CHIP ----
const CategoryChip: React.FC<{ label: string; selected: boolean; onClick: () => void }> = ({ label, selected, onClick }) => (
  <motion.div
    whileHover={{ scale: 1.09 }}
    whileTap={{ scale: 0.98 }}
    transition={{ type: "spring", stiffness: 400, damping: 28 }}
    className={`
      flex items-center gap-2 px-5 py-2 rounded-full cursor-pointer select-none font-bold shadow-md border-2 border-transparent
      ${selected
        ? `bg-gradient-to-l ${getCategoryColor(label)} text-white border-blue-300`
        : "bg-gray-100 dark:bg-gray-900 text-blue-700 dark:text-blue-100 hover:bg-blue-100 dark:hover:bg-gray-700"}
      transition-all duration-200
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
    whileHover={{ scale: 1.07 }}
    transition={{ duration: 0.18 }}
    className={`
      px-3 py-1 rounded-lg cursor-pointer font-medium border
      ${selected
        ? "bg-gradient-to-r from-cyan-600 to-blue-700 text-white border-blue-400 shadow"
        : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-blue-100 border-gray-300 dark:border-gray-600 hover:bg-blue-100 dark:hover:bg-gray-600"}
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
    className="bg-white dark:bg-blue-950 rounded-2xl shadow-2xl p-6 flex flex-col md:flex-row items-center gap-5 border border-blue-100 dark:border-blue-900"
    style={{ direction: "rtl" }}
  >
    <div className="relative flex-1 w-full md:w-auto">
      <Input
        placeholder="חפש מורה לפי שם..."
        value={searchTerm}
        onChange={e => setSearchTerm(e.target.value)}
        className="w-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-blue-100 pr-10 rounded-xl"
        dir="rtl"
      />
      {searchTerm && (
        <X
          className="absolute left-3 top-1/2 transform -translate-y-1/2 cursor-pointer text-gray-400 hover:text-blue-500"
          onClick={() => setSearchTerm("")}
        />
      )}
    </div>
    <div className="flex items-center gap-4">
      <span className="text-blue-700 dark:text-blue-200 font-medium">מיין לפי:</span>
      <select
        value={sortKey}
        onChange={e => setSortKey(e.target.value as any)}
        className="bg-gray-100 dark:bg-gray-800 text-blue-900 dark:text-blue-100 rounded-xl px-3 py-1 border-none font-bold"
        dir="rtl"
      >
        <option value="rating">דירוג</option>
        <option value="price">מחיר</option>
        <option value="name">שם</option>
      </select>
      <button
        onClick={resetAll}
        className="ml-3 text-sm text-cyan-700 hover:underline font-bold"
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
      <Card className="relative h-full flex flex-col justify-between bg-white/95 dark:bg-blue-950/95 backdrop-blur-md rounded-2xl shadow-xl border-2 border-blue-50 dark:border-blue-800 hover:scale-[1.018] hover:shadow-2xl transition p-6 overflow-visible">
        {isTodayStar && (
          <span className="absolute top-0 right-0 m-2 bg-gradient-to-l from-amber-400 to-yellow-300 text-yellow-900 px-4 py-1 rounded-xl shadow font-black text-sm flex items-center gap-1">
            <Sparkles className="w-5 h-5 animate-bounce" />
            מורה היום
          </span>
        )}
        <Button
          variant="ghost"
          size="icon"
          className={`absolute left-3 top-3 z-10 ${isFavorite ? "text-pink-500" : "text-gray-300 dark:text-gray-500"}`}
          onClick={onToggleFav}
          aria-label={isFavorite ? "הסר ממועדפים" : "הוסף למועדפים"}
        >
          <Heart fill={isFavorite ? "#ec4899" : "none"} className="w-6 h-6 transition" />
        </Button>
        <div className="space-y-4 flex-1 flex flex-col">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full overflow-hidden bg-blue-100 dark:bg-blue-800 flex items-center justify-center shadow">
              <img
                src={tutor.avatar_url || defaultAvatar}
                alt={tutor.name}
                className="object-cover w-full h-full"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-blue-900 dark:text-blue-100 truncate">{tutor.name}</h3>
                {tutor.is_verified && <Badge className="bg-green-500 text-white text-xs">מאומת</Badge>}
                {tutor.is_online && <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" title="זמין עכשיו" />}
              </div>
              <div
                className="flex items-center gap-1 text-sm text-yellow-500 mt-1 relative group"
                onMouseEnter={() => setShowTip(true)} onMouseLeave={() => setShowTip(false)}
              >
                <Star className="w-4 h-4" />
                <span className="font-semibold">{tutor.rating} ({tutor.reviews_count})</span>
                {/* Tooltip */}
                {showTip && (
                  <span className="absolute top-7 right-0 bg-black/90 text-white px-3 py-1 rounded-xl shadow-lg text-xs z-50 whitespace-nowrap pointer-events-none">
                    דירוג מבוסס על {tutor.reviews_count} חוות דעת
                  </span>
                )}
              </div>
            </div>
          </div>
          <p className="text-blue-800 dark:text-blue-100 text-sm line-clamp-2 flex-1">{tutor.description}</p>
          <div className="flex flex-wrap gap-1 mb-2">
            {subjects.map((s: string, i: number) => (
              <Badge key={i} variant="secondary" className="text-xs bg-gradient-to-r from-blue-300 to-blue-600 text-white">{s}</Badge>
            ))}
          </div>
          <div className="space-y-1 text-sm">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-400 dark:text-blue-300" /><span>{tutor.location}</span>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-blue-400 dark:text-blue-300" /><span>₪{tutor.hourly_rate}/שעה</span>
            </div>
            {tutor.availability && (
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-400 dark:text-blue-300" /><span>{tutor.availability}</span>
              </div>
            )}
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <Button variant="outline" className="flex-1 font-bold" onClick={() => onProfile(tutor.id)}>
            <BookOpen className="w-4 h-4 ml-2" /> פרופיל
          </Button>
          <Button
            className="flex-1 bg-gradient-to-l from-cyan-500 to-blue-600 text-white font-bold hover:from-blue-600 hover:to-cyan-600"
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
  <Card className="min-h-[220px] relative flex flex-col items-center justify-center bg-white/90 dark:bg-blue-950/90 backdrop-blur-md rounded-2xl shadow-xl border-2 border-blue-100 dark:border-blue-800 overflow-hidden">
    <div className="absolute inset-0">
      <div className="w-full h-full bg-gradient-to-tr from-blue-100 to-cyan-200 dark:from-blue-900 dark:to-blue-950 opacity-25" />
    </div>
    <CardContent className="relative z-10 text-center px-6">
      <Sparkles className="w-10 h-10 mx-auto text-blue-500 animate-pulse mb-2" />
      <h3 className="text-2xl font-bold text-blue-700 dark:text-blue-100 mb-1">המקום הזה שמור בשבילך!</h3>
      <p className="text-blue-900 dark:text-blue-100 mb-4 font-medium line-clamp-3">
        למדת קורס והצטיינת? הזמן שלך ללוות תלמידים ולהעביר ידע!
      </p>
      <Button
        size="lg"
        className="bg-gradient-to-r from-cyan-600 to-blue-700 text-white font-bold px-8 py-2 rounded-xl shadow-lg hover:from-blue-700 hover:to-cyan-700 transition"
        onClick={onApply}
      >
        <BookOpen className="w-5 h-5 ml-2" /> הגש מועמדות
      </Button>
    </CardContent>
  </Card>
);

// ---- SKELETON CARD ----
const SkeletonCard: React.FC = () => (
  <Card className="h-full bg-gray-100 dark:bg-blue-950 rounded-2xl p-6 animate-pulse border-2 border-blue-100 dark:border-blue-800">
    <CardContent className="space-y-4">
      <div className="h-4 bg-blue-100 dark:bg-blue-800 rounded"></div>
      <div className="h-4 w-5/6 bg-blue-100 dark:bg-blue-800 rounded"></div>
      <div className="h-32 bg-blue-100 dark:bg-blue-800 rounded"></div>
      <div className="h-4 bg-blue-100 dark:bg-blue-800 rounded w-3/4"></div>
      <div className="flex gap-2">
        <div className="h-8 w-8 bg-blue-100 dark:bg-blue-800 rounded-full"></div>
        <div className="flex-1 h-8 bg-blue-100 dark:bg-blue-800 rounded"></div>
      </div>
    </CardContent>
  </Card>
);

// ---- MAIN PAGE ----
const TutorsPage: React.FC = () => {
  const navigate = useNavigate();
  const { dir } = useLanguage();
  const { data: tutors = [], isLoading } = useTutors();

  // --- FILTER STATES ---
  const [searchTerm, setSearchTerm] = useState("");
  const [sortKey, setSortKey] = useState<"rating" | "price" | "name">("rating");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const perPage = 9;

  // --- THEME DETECTION ---
  const [isDarkMode, setIsDarkMode] = useState(false);
  useEffect(() => {
    const update = () => setIsDarkMode(document.documentElement.classList.contains("dark"));
    update();
    const obs = new MutationObserver(update);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

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
    // "מורה היום" — אקראי לפי יום, תמיד אותו אחד לאותו יום
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

  // ---- RENDER ----
  return (
    <div
      dir="rtl"
      className="relative min-h-screen font-[Heebo,Arial,sans-serif] bg-none overflow-x-hidden"
      style={{ background: "none" }}
    >
      {/* Animated background with SVG grid */}
      <motion.div
        className="fixed inset-0 -z-10"
        style={{
          background: `${isDarkMode ? NIGHT_GRAD : DAY_GRAD}, ${isDarkMode ? NIGHT_SVG_BG : DAY_SVG_BG}`,
          backgroundSize: "cover, 90px 90px",
          animation: "move-bg 28s linear infinite alternate"
        }}
      />
      <style>{`
        @keyframes move-bg {
          0% { background-position: 0% 0%, 0% 0%; }
          100% { background-position: 150px 90px, 100px 60px; }
        }
        .line-clamp-2 { display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden }
      `}</style>

      {/* HEADER */}
      <header className="bg-white/90 dark:bg-blue-950/90 backdrop-blur-lg shadow-md px-8 py-6 mb-8 rounded-b-3xl border-b-2 border-blue-200 dark:border-blue-800" style={{ direction: "rtl" }}>
        <div className="flex flex-row-reverse items-center justify-between">
          <Button variant="ghost" onClick={() => navigate("/")}>
            <span className="flex items-center gap-2 font-bold">
              <ArrowRight className="w-5 h-5" /> חזרה
            </span>
          </Button>
          <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-l from-blue-700 to-cyan-400 bg-clip-text text-transparent drop-shadow">
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

        {/* קטגוריות (צד ימין) */}
        <section>
          <h2 className="text-xl font-bold text-blue-700 dark:text-blue-200 mb-2 text-right">בחר קטגוריה:</h2>
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
            <h2 className="text-xl font-bold text-blue-700 dark:text-blue-200 mb-2 text-right">בחר קורס:</h2>
            <div className="flex flex-wrap gap-2 items-center">
              <Search className="w-5 h-5 text-cyan-500" />
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
          <div className="flex justify-center items-center gap-4 mt-10 font-bold text-blue-800 dark:text-blue-100">
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

        {/* קריאה להצטרפות למורים */}
        <Card className="mt-16 bg-gradient-to-l from-blue-700 to-cyan-400 text-white rounded-3xl shadow-2xl border-none overflow-hidden">
          <CardContent className="p-10 text-center">
            <h2 className="text-3xl font-extrabold mb-2">רוצה להיות חלק מההצלחה?</h2>
            <p className="mb-6 opacity-90 text-lg font-bold">הגש מועמדות והצטרף לנבחרת המורים</p>
            <Button
              size="lg"
              variant="secondary"
              className="bg-white text-blue-700 hover:bg-cyan-50 shadow-xl"
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
    </div>
  );
};

export default TutorsPage;
