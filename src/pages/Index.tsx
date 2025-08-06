import React, { useState, useRef, useEffect } from "react";
import { useKeenSlider } from "keen-slider/react";
import "keen-slider/keen-slider.min.css";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useAuth } from '@/contexts/AuthProvider';
import { usePublicInstitution, usePublicCourses } from "@/hooks/usePublicData";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  BookOpen, Calendar, Users, Search, Gift, Zap,
  HeartHandshake, ShoppingCart
} from "lucide-react";
import WelcomeBanner from "@/components/WelcomeBanner";
import SaveToAccountButton from "@/components/course/SaveToAccountButton";

const popularCoursesKeywords = [
  "בדידה", "אלגברה לינארית", "אינפי", "אינפי 1", "אינפיניטסמלי", "חשבון", "לוגיקה", "ממן", "מבוא", "סטטיסטיקה"
];
function isPopular(course) {
  const name = `${course.name_he} ${course.name_en || ""}`.toLowerCase();
  return popularCoursesKeywords.some((kw) => name.includes(kw.toLowerCase()));
}

const benefits = [
  { icon: <Gift size={22} />, label: "הטבות שוות" },
  { icon: <ShoppingCart size={22} />, label: "חנות סטודנט" },
  { icon: <Zap size={22} />, label: "לוח מבחנים חכם" },
  { icon: <HeartHandshake size={22} />, label: "קבוצות לימוד" },
  { icon: <Users size={22} />, label: "קהילה תומכת" },
];

const Index = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sliderLoaded, setSliderLoaded] = useState(false);
  const [pauseCarousel, setPauseCarousel] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  const navigate = useNavigate();
  const { user } = useAuth();

  // מוסד וקורסים
  const { data: openUniversity, isLoading: isLoadingInstitution } = usePublicInstitution();
  const { data: courses = [], isLoading: isLoadingCourses } = usePublicCourses(openUniversity?.id);
  const isLoading = isLoadingInstitution || isLoadingCourses;

  // קורסים שמורים
  const { data: savedCoursesData = [] } = useQuery({
    queryKey: ["user-saved-courses", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("user_course_progress")
        .select("course_id")
        .eq("user_id", user.id);
      return data?.map((row) => row.course_id) ?? [];
    }
  });

  const savedCourseIds = new Set(savedCoursesData);
  const savedCourses = courses.filter((c) => savedCourseIds.has(c.id));
  const popularCourses = courses.filter(
    (c) => isPopular(c) && !savedCourseIds.has(c.id)
  );
  const otherCourses = courses.filter(
    (c) => !savedCourseIds.has(c.id) && !isPopular(c)
  );
  const carouselCourses = [...savedCourses, ...popularCourses, ...otherCourses].slice(0, 12);

  // תוצאות חיפוש
  const isSearch = searchTerm.trim() !== "";
  const filteredCourses = isSearch
    ? courses.filter(
        (course) =>
          course.name_he.toLowerCase().includes(searchTerm.toLowerCase()) ||
          course.name_en?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          course.code?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : courses;

  // קרוסלה - swipe ותמיכה בדוטים
  const [sliderRef, instanceRef] = useKeenSlider({
    loop: true,
    rtl: true,
    slides: { perView: 1, spacing: 12 },
    breakpoints: {
      "(min-width: 480px)": { slides: { perView: 2, spacing: 16 } },
      "(min-width: 768px)": { slides: { perView: 3, spacing: 22 } },
      "(min-width: 1100px)": { slides: { perView: 4, spacing: 30 } },
    },
    created: () => setSliderLoaded(true),
    slideChanged(s) { setCurrentSlide(s.track.details.rel); },
  });

  useEffect(() => {
    if (!sliderLoaded || !instanceRef.current || isSearch) return;
    if (pauseCarousel) return;
    const interval = setInterval(() => {
      instanceRef.current?.next();
    }, 3400);
    return () => clearInterval(interval);
  }, [sliderLoaded, instanceRef, isSearch, pauseCarousel]);

  const handleCourseClick = (courseId) => navigate(`/course/${courseId}`);
  const coursesSectionRef = useRef(null);
  const scrollToCourses = () => {
    if (coursesSectionRef.current) {
      coursesSectionRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };
  const handleClearSearch = () => setSearchTerm("");

  // חיפוש sticky
  const searchRef = useRef(null);

  useEffect(() => {
    if (window.innerWidth > 767) return;
    const el = searchRef.current;
    if (!el) return;
    const onScroll = () => {
      if (window.scrollY > 30) {
        el.classList.add("sticky-search-active");
      } else {
        el.classList.remove("sticky-search-active");
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!searchTerm && window.innerWidth < 768) window.scrollTo({ top: 0, behavior: "smooth" });
  }, [searchTerm]);

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden relative font-[Assistant] bg-gradient-to-b from-[#efc9f4]/70 to-[#f8dbec] dark:from-[#181026] dark:to-[#28193e]">
      {/* רקע דינאמי */}
      <div className="fixed inset-0 z-0 pointer-events-none select-none">
        <div
          className="absolute inset-0 animate-gradient-shift"
          style={{
            minHeight: "640px",
            background: `
              linear-gradient(120deg,
                #825ae8 0%,
                #a579e7 18%,
                #e8b5f5 38%,
                #fca4c0 56%,
                #f57bc5 75%,
                #7ecff2 100%
              )`,
            backgroundSize: "400% 400%",
            transition: "background 1s",
          }}
        />
        <svg className="absolute left-0 bottom-0 w-full z-1" style={{ opacity: 0.14 }} height="90" viewBox="0 0 1728 90" fill="none">
          <path d="M0 46C263 126 514 38 872 49C1230 60 1512 104 1728 42V90H0V46Z" fill="#fff" />
        </svg>
      </div>
      <div className="relative z-10">
        {/* Header */}
        <div className="main-header-override">
          <Header />
        </div>
        {!user && <WelcomeBanner />}
        <main className="flex-1 flex flex-col justify-between">
          {/* Hero */}
          <section className="pt-4 pb-2 md:py-14 bg-transparent">
            <div className="container mx-auto px-2 flex flex-col items-center text-center">
              <div className="hero-title-enhanced mb-3 w-full md:w-3/4">
                <h1 className="text-[1.35rem] sm:text-2xl md:text-5xl font-extrabold text-white mb-1 drop-shadow-2xl dark:text-pink-100" style={{ lineHeight: '1.13' }}>
                  קורסי האוניברסיטה הפתוחה
                </h1>
                <p className="text-[0.96rem] md:text-xl text-white/90 mb-2 drop-shadow dark:text-pink-50/90">
                  כל מה שסטודנט צריך – בלחיצה אחת. מערכת מתקדמת, הטבות לסטודנטים, חנות קמפוס, שותפים ועוד.
                </p>
                {/* פס יתרונות - מוסתר במובייל! */}
                <div className="hidden md:flex flex-wrap gap-3 justify-center mt-6 mb-1">
                  {benefits.map((b, i) => (
                    <span key={i}
                      className="flex items-center gap-2 rounded-full bg-white/30 dark:bg-pink-500/20 px-4 py-2 font-bold text-base md:text-lg text-blue-900 dark:text-pink-50 shadow backdrop-blur-sm border border-white/30"
                    >
                      {b.icon}
                      {b.label}
                    </span>
                  ))}
                </div>
              </div>
              {/* חיפוש - sticky במובייל */}
              <div ref={searchRef} className="max-w-xl w-full mx-auto mb-3 sticky-search z-20">
                <div className="relative group">
                  <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-pink-200 w-6 h-6 group-focus-within:text-blue-500 transition-colors" />
                  <Input
                    type="text"
                    placeholder="חפש קורס לפי שם או מספר קורס..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="
                      pl-4 pr-12 py-3 text-base md:text-lg text-right border-2 border-white/20 focus:border-blue-400 
                      rounded-xl shadow-lg backdrop-blur-md bg-white/95 hover:bg-white transition-all duration-300
                      dark:bg-[#23213a]/90 dark:backdrop-blur-xl dark:text-pink-100 dark:placeholder-pink-300
                      dark:border-pink-700 dark:focus:border-pink-400
                    "
                  />
                  {searchTerm && (
                    <button
                      onClick={handleClearSearch}
                      aria-label="נקה חיפוש"
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-2xl text-gray-400 hover:text-blue-600 transition"
                    >×</button>
                  )}
                </div>
              </div>
              {/* פס יתרונות קטן - רק במובייל */}
              <div className="flex md:hidden gap-2 flex-wrap justify-center items-center mb-3">
                <span className="bg-gradient-to-r from-blue-200 to-purple-200 text-blue-900 font-bold rounded-lg px-3 py-1.5 shadow-md text-xs">גישה חופשית</span>
                <span className="bg-gradient-to-r from-pink-100 to-purple-100 text-pink-700 font-bold rounded-lg px-3 py-1.5 shadow-md text-xs">ללא תשלום</span>
                <span className="bg-gradient-to-r from-blue-50 to-pink-100 text-violet-900 font-bold rounded-lg px-3 py-1.5 shadow-md text-xs">ע"י סטודנטים</span>
              </div>
              {/* קרוסלה */}
              {!isLoading && !isSearch && carouselCourses.length > 0 && (
                <>
                  <div className="w-full mt-1 mb-2 max-w-7xl mx-auto flex items-center relative">
                    {/* חיצים */}
                    {sliderLoaded && carouselCourses.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="הקודם"
                        className="absolute top-1/2 -right-3 md:-right-8 -translate-y-1/2 z-20 bg-white/85 dark:bg-pink-500/20 text-blue-700 dark:text-pink-200 shadow"
                        onClick={() => instanceRef.current?.prev()}
                      >
                        <svg width="30" height="30" fill="none" viewBox="0 0 24 24">
                          <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </Button>
                    )}
                    <div
                      ref={sliderRef}
                      className="keen-slider flex-1 px-0 sm:px-4"
                    >
                      {carouselCourses.map((course, idx) => (
                        <div
                          className="keen-slider__slide flex justify-center"
                          key={course.id}
                          aria-label={course.name_he}
                          onMouseEnter={() => setPauseCarousel(true)}
                          onMouseLeave={() => setPauseCarousel(false)}
                        >
                          <Card
                            className={`
                              card w-[95vw] xs:w-[89vw] max-w-[350px] md:w-[210px] lg:w-[240px]
                              rounded-2xl bg-white/95 dark:bg-gradient-to-br dark:from-[#292346]/90 dark:to-[#3b235a]/90
                              hover:shadow-xl hover:scale-[1.04] cursor-pointer transition-all duration-300
                              shadow group flex-shrink-0 relative border-2 border-white/50 dark:border-pink-400/40
                            `}
                            style={{ minHeight: 152 }}
                            onClick={() => handleCourseClick(course.id)}
                          >
                            <CardHeader className="pb-2 pt-4 px-5">
                              <CardTitle className="text-base md:text-lg font-bold text-right truncate dark:text-pink-100 group-hover:text-blue-600 dark:group-hover:text-pink-300">
                                {course.name_he}
                              </CardTitle>
                              {course.code && (
                                <Badge className="bg-blue-100 text-blue-800 dark:bg-pink-500/30 dark:text-pink-100 text-xs font-bold px-2 py-1 mt-1">
                                  {course.code}
                                </Badge>
                              )}
                              {isPopular(course) && !savedCourseIds.has(course.id) && (
                                <span className="absolute left-3 top-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white text-xs px-3 py-1 rounded-full font-bold shadow drop-shadow-md border border-white/70">
                                  פופולרי
                                </span>
                              )}
                            </CardHeader>
                            <CardContent className="pt-0 pb-4 px-5 space-y-2">
                              {course.semester && (
                                <div className="flex items-center gap-2 text-xs md:text-sm text-gray-600 dark:text-pink-200">
                                  <BookOpen className="w-5 h-5 dark:text-pink-300" />
                                  <span>סמסטר: {course.semester}</span>
                                </div>
                              )}
                              {course.exam_date && (
                                <div className="flex items-center gap-2 text-xs md:text-sm text-gray-600 dark:text-purple-200">
                                  <Calendar className="w-5 h-5 dark:text-pink-300" />
                                  <span>
                                    מועד בחינה: {new Date(course.exam_date).toLocaleDateString('he-IL')}
                                  </span>
                                </div>
                              )}
                              {course.enable_collaboration && (
                                <div className="flex items-center gap-2 text-xs md:text-sm text-green-600 dark:text-pink-400">
                                  <Users className="w-5 h-5 dark:text-pink-400" />
                                  <span>שיתוף פעולה זמין</span>
                                </div>
                              )}
                            </CardContent>
                            {!savedCourseIds.has(course.id) && (
                              <div className="absolute left-3 bottom-3 z-10">
                                <SaveToAccountButton courseId={course.id} courseName={course.name_he} compact />
                              </div>
                            )}
                          </Card>
                        </div>
                      ))}
                    </div>
                    {sliderLoaded && carouselCourses.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="הבא"
                        className="absolute top-1/2 -left-3 md:-left-8 -translate-y-1/2 z-20 bg-white/85 dark:bg-pink-500/20 text-blue-700 dark:text-pink-200 shadow"
                        onClick={() => instanceRef.current?.next()}
                      >
                        <svg width="30" height="30" fill="none" viewBox="0 0 24 24">
                          <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </Button>
                    )}
                  </div>
                  {/* paging dots & חיווי swipe במובייל */}
                  <div className="flex flex-col items-center md:hidden mb-4">
                    {carouselCourses.length > 1 && (
                      <>
                        <div className="text-xs text-gray-600 dark:text-pink-200 mb-1 select-none">
                          החלק ימינה ושמאלה כדי לגלול בין קורסים
                        </div>
                        <div className="flex justify-center gap-1">
                          {carouselCourses.map((_, idx) => (
                            <span
                              key={idx}
                              className={`
                                inline-block w-2.5 h-2.5 rounded-full transition-all
                                ${currentSlide === idx ? 'bg-pink-500 dark:bg-pink-300 shadow-md scale-110' : 'bg-pink-200/60 dark:bg-pink-900/60'}
                              `}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </>
              )}
              {/* תוצאות חיפוש */}
              {!isLoading && isSearch && filteredCourses.length > 0 && (
                <div className="w-full mt-5 mb-6 grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                  {filteredCourses.map((course) => (
                    <Card
                      key={course.id}
                      className="
                        rounded-2xl group hover:shadow-2xl hover:-translate-y-1.5 hover:scale-[1.02]
                        border-2 border-transparent hover:border-blue-200
                        bg-white/95 dark:bg-gradient-to-br 
                        dark:from-[#292346]/90 dark:to-[#3b235a]/90 dark:border-pink-500/30
                        shadow-md dark:shadow-[0_2px_40px_rgba(255,90,190,0.10)]
                        relative overflow-hidden
                        min-h-[170px]
                        cursor-pointer transition-all duration-300
                      "
                      onClick={() => handleCourseClick(course.id)}
                    >
                      <CardHeader className="pb-2 pt-4 px-6">
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-base md:text-lg font-bold dark:text-pink-100 text-right leading-tight group-hover:text-blue-600 dark:group-hover:text-pink-300 transition-colors duration-300">
                            {course.name_he}
                          </CardTitle>
                          {course.code && (
                            <Badge className="bg-blue-100 text-blue-800 dark:bg-pink-500/30 dark:text-pink-100 text-xs font-bold px-2 py-1 mt-1">
                              {course.code}
                            </Badge>
                          )}
                        </div>
                        {course.name_en && (
                          <p className="text-xs md:text-sm text-gray-500 dark:text-pink-200 text-right mt-1 font-medium">
                            {course.name_en}
                          </p>
                        )}
                      </CardHeader>
                      <CardContent className="pt-0 pb-4 px-6 space-y-2">
                        {course.semester && (
                          <div className="flex items-center gap-2 text-xs md:text-sm text-gray-600 dark:text-pink-200">
                            <BookOpen className="w-5 h-5 dark:text-pink-300" />
                            <span>סמסטר: {course.semester}</span>
                          </div>
                        )}
                        {course.exam_date && (
                          <div className="flex items-center gap-2 text-xs md:text-sm text-gray-600 dark:text-purple-200">
                            <Calendar className="w-5 h-5 dark:text-pink-300" />
                            <span>
                              מועד בחינה: {new Date(course.exam_date).toLocaleDateString("he-IL")}
                            </span>
                          </div>
                        )}
                        {course.enable_collaboration && (
                          <div className="flex items-center gap-2 text-xs md:text-sm text-green-600 dark:text-pink-400">
                            <Users className="w-5 h-5 dark:text-pink-400" />
                            <span>שיתוף פעולה זמין</span>
                          </div>
                        )}
                        <Button
                          className="
                            w-full mt-4 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-base font-bold py-2 shadow-md hover:shadow-xl hover:scale-105 transition-all
                            dark:from-pink-500 dark:to-purple-800 dark:hover:from-pink-400 dark:hover:to-purple-900
                            dark:text-white dark:font-bold dark:shadow-pink-700/40
                          "
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCourseClick(course.id);
                          }}
                        >
                          צפה בפרטי הקורס
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
              {/* אפס תוצאות */}
              {!isLoading && filteredCourses.length === 0 && (
                <div className="text-center py-6">
                  <div className="text-lg text-gray-600 mb-2 dark:text-pink-200">
                    {isSearch ? "לא נמצאו קורסים מתאימים" : "אין קורסים זמינים"}
                  </div>
                </div>
              )}
              {/* כפתור מעבר לכל הקורסים */}
              {!isSearch && courses.length > 0 && (
                <div className="flex justify-center mt-4 mb-3 w-full">
                  <Button
                    className="rounded-xl px-8 py-3 text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg hover:scale-105 transition"
                    onClick={scrollToCourses}
                    style={{ width: "96%", maxWidth: 380 }}
                  >
                    לכל הקורסים
                  </Button>
                </div>
              )}
            </div>
          </section>
          {/* Section כל הקורסים – מלא */}
          <section
            className="py-8 md:py-16 bg-white/95 backdrop-blur-sm dark:bg-[#251e35]/90 dark:backdrop-blur-2xl transition-all duration-500"
            ref={coursesSectionRef}
          >
            <div className="container mx-auto px-2">
              <div className="text-center mb-8">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2 dark:text-pink-200 drop-shadow">
                  כל הקורסים ({courses.length})
                </h2>
                <p className="text-base text-gray-600 dark:text-pink-200/80">
                  בחר קורס כדי לראות מועדי בחינות, קבוצות לימוד ושותפי למידה
                </p>
              </div>
              {isLoading ? (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-14 h-14 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4 dark:border-pink-900 dark:border-t-pink-400"></div>
                  <div className="text-lg text-gray-600 dark:text-pink-200">טוען קורסים...</div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                  {courses.map((course) => (
                    <Card
                      key={course.id}
                      className="
                        rounded-2xl group hover:shadow-2xl hover:-translate-y-1.5 hover:scale-[1.02]
                        border-2 border-transparent hover:border-blue-200
                        bg-white/95 dark:bg-gradient-to-br 
                        dark:from-[#292346]/90 dark:to-[#3b235a]/90 dark:border-pink-500/30
                        shadow-md dark:shadow-[0_2px_40px_rgba(255,90,190,0.10)]
                        relative overflow-hidden
                        min-h-[180px]
                        cursor-pointer transition-all duration-300
                      "
                      onClick={() => handleCourseClick(course.id)}
                    >
                      <CardHeader className="pb-2 pt-4 px-6">
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-base md:text-lg font-bold dark:text-pink-100 text-right leading-tight group-hover:text-blue-600 dark:group-hover:text-pink-300 transition-colors duration-300">
                            {course.name_he}
                          </CardTitle>
                          {course.code && (
                            <Badge className="bg-blue-100 text-blue-800 dark:bg-pink-500/30 dark:text-pink-100 text-xs font-bold px-2 py-1 mt-1">
                              {course.code}
                            </Badge>
                          )}
                        </div>
                        {course.name_en && (
                          <p className="text-xs md:text-sm text-gray-500 dark:text-pink-200 text-right mt-1 font-medium">
                            {course.name_en}
                          </p>
                        )}
                      </CardHeader>
                      <CardContent className="pt-0 pb-4 px-6 space-y-2">
                        {course.semester && (
                          <div className="flex items-center gap-2 text-xs md:text-sm text-gray-600 dark:text-pink-200">
                            <BookOpen className="w-5 h-5 dark:text-pink-300" />
                            <span>סמסטר: {course.semester}</span>
                          </div>
                        )}
                        {course.exam_date && (
                          <div className="flex items-center gap-2 text-xs md:text-sm text-gray-600 dark:text-purple-200">
                            <Calendar className="w-5 h-5 dark:text-pink-300" />
                            <span>
                              מועד בחינה: {new Date(course.exam_date).toLocaleDateString("he-IL")}
                            </span>
                          </div>
                        )}
                        {course.enable_collaboration && (
                          <div className="flex items-center gap-2 text-xs md:text-sm text-green-600 dark:text-pink-400">
                            <Users className="w-5 h-5 dark:text-pink-400" />
                            <span>שיתוף פעולה זמין</span>
                          </div>
                        )}
                        <Button
                          className="
                            w-full mt-4 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-base font-bold py-2 shadow-md hover:shadow-xl hover:scale-105 transition-all
                            dark:from-pink-500 dark:to-purple-800 dark:hover:from-pink-400 dark:hover:to-purple-900
                            dark:text-white dark:font-bold dark:shadow-pink-700/40
                          "
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCourseClick(course.id);
                          }}
                        >
                          צפה בפרטי הקורס
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
              {!isLoading && courses.length === 0 && (
                <div className="text-center py-8">
                  <div className="text-lg text-gray-600 mb-2 dark:text-pink-200">
                    לא נמצאו קורסים מתאימים
                  </div>
                </div>
              )}
            </div>
          </section>
        </main>
        <Footer />
      </div>
      {/* CSS מותאם לכל מובייל + תיקונים ספציפיים */}
      <style>{`
        @keyframes gradient-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient-shift { animation: gradient-shift 10s ease-in-out infinite; }
        .hero-title-enhanced {
          background: rgba(255,255,255,0.13);
          backdrop-filter: blur(18px);
          padding: 1.2rem 0.7rem 1.2rem 0.7rem;
          border-radius: 1.45rem;
          border: 2px solid rgba(255,255,255,0.10);
          box-shadow: 0 8px 38px rgba(0,0,0,0.08);
        }
        @media (min-width: 768px) {
          .hero-title-enhanced { padding: 2.2rem 2.8rem; }
        }
        .main-header-override .dark\\:bg-gradient-to-b {
          border-radius: 0 !important;
        }
        .sticky-search {
          position: static;
          top: 0;
          z-index: 20;
          transition: box-shadow 0.2s;
        }
        .sticky-search-active {
          position: sticky !important;
          top: 56px;
          background: rgba(245,245,255,0.92);
          box-shadow: 0 3px 12px 0 rgba(185,110,255,0.07);
          border-radius: 1rem;
        }
        /* --- מובייל: כרטיסים רחבים ומלאים בכל מכשיר --- */
        @media (max-width: 767px) {
          .keen-slider__slide > .card {
            min-width: 92vw !important;
            max-width: 99vw !important;
            margin-left: 1vw;
            margin-right: 1vw;
          }
          html, body, #root, .min-h-screen {
            min-height: 100vh !important;
            height: 100dvh !important;
            box-sizing: border-box;
            overscroll-behavior: none;
          }
        }
        /* תיקוני גובה לאייפון/סמסונג/ספארי */
        @supports (-webkit-touch-callout: none) {
          html, body, #root, .min-h-screen {
            min-height: -webkit-fill-available !important;
            height: -webkit-fill-available !important;
          }
        }
        /* פיקס קטן לתצוגת דפדפני ברירת מחדל */
        @media (max-width: 350px) {
          .keen-slider__slide > .card {
            min-width: 96vw !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Index;
