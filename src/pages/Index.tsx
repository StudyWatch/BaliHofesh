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
import { BookOpen, Calendar, Users, Search, Gift, Zap, HeartHandshake, ShoppingCart } from "lucide-react";
import WelcomeBanner from "@/components/WelcomeBanner";
import SaveToAccountButton from "@/components/course/SaveToAccountButton";
import { useLanguage } from '@/contexts/LanguageContext';

const popularCoursesKeywords = [
  "בדידה","אלגברה לינארית","אינפי","אינפי 1","אינפיניטסמלי","חשבון","לוגיקה","ממן","מבוא","סטטיסטיקה"
];
function isPopular(course:any) {
  const name = `${course.name_he} ${course.name_en || ""}`.toLowerCase();
  return popularCoursesKeywords.some((kw) => name.includes(kw.toLowerCase()));
}
// זיהוי "קיץ" גם באנגלית (ליתר ביטחון)
const isSummer = (semester?: string | null) =>
  !!semester && /קיץ|summer/i.test(semester);

const Index = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sliderLoaded, setSliderLoaded] = useState(false);
  const [pauseCarousel, setPauseCarousel] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  // פילטר קורסים בסקשן התחתון (מובייל/דסקטופ OK, ברירת מחדל – קיץ)
  const [coursesFilter, setCoursesFilter] = useState<"summer" | "all">("summer");

  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, language, dir, isRTL, getLocalizedText, formatLocalizedDate } = useLanguage();

  const benefits = [
    { icon: <Gift size={22} />, label: t("home.benefits.discounts") },
    { icon: <ShoppingCart size={22} />, label: t("home.benefits.store") },
    { icon: <Zap size={22} />, label: t("home.benefits.smart_board") },
    { icon: <HeartHandshake size={22} />, label: t("home.benefits.study_groups") },
    { icon: <Users size={22} />, label: t("home.benefits.community") },
  ];

  const { data: openUniversity, isLoading: isLoadingInstitution } = usePublicInstitution();
  const { data: courses = [], isLoading: isLoadingCourses } = usePublicCourses(openUniversity?.id);
  const isLoading = isLoadingInstitution || isLoadingCourses;

  const { data: savedCoursesData = [] } = useQuery({
    queryKey: ["user-saved-courses", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("user_course_progress").select("course_id").eq("user_id", user.id);
      return (data?.map((row) => row.course_id) ?? []);
    }
  });

  const savedCourseIds = new Set(savedCoursesData);
  const savedCourses   = courses.filter((c:any) => savedCourseIds.has(c.id));
  const popularCourses = courses.filter((c:any) => isPopular(c) && !savedCourseIds.has(c.id));
  const otherCourses   = courses.filter((c:any) => !savedCourseIds.has(c.id) && !isPopular(c));
  const carouselCourses = [...savedCourses, ...popularCourses, ...otherCourses].slice(0, 12);

  const isSearch = searchTerm.trim() !== "";
  const filteredCourses = isSearch
    ? courses.filter((course:any) =>
        getLocalizedText(course).toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.code?.toLowerCase().includes(searchTerm.toLowerCase()))
    : courses;

  const [sliderRef, instanceRef] = useKeenSlider({
    loop: true,
    rtl: isRTL,
    slides: { perView: 1, spacing: 12 },
    breakpoints: {
      "(min-width: 480px)": { slides: { perView: 2, spacing: 16 } },
      "(min-width: 768px)": { slides: { perView: 3, spacing: 22 } }, // דסקטופ כמו שאהבת
      "(min-width: 1100px)": { slides: { perView: 4, spacing: 30 } },
    },
    created: () => setSliderLoaded(true),
    slideChanged(s) { setCurrentSlide(s.track.details.rel); },
  });

  useEffect(() => {
    if (!sliderLoaded || !instanceRef.current || isSearch || pauseCarousel) return;
    const interval = setInterval(() => instanceRef.current?.next(), 3400);
    return () => clearInterval(interval);
  }, [sliderLoaded, instanceRef, isSearch, pauseCarousel]);

  const handleCourseClick = (courseId:string) => navigate(`/course/${courseId}`);

  const coursesSectionRef = useRef<HTMLDivElement|null>(null);
  const scrollToCourses = () => coursesSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  const handleClearSearch = () => setSearchTerm("");

  const searchRef = useRef<HTMLDivElement|null>(null);

  useEffect(() => {
    if (window.innerWidth > 767) return;
    const el = searchRef.current;
    if (!el) return;
    const onScroll = () => {
      if (window.scrollY > 30) el.classList.add("sticky-search-active");
      else el.classList.remove("sticky-search-active");
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!searchTerm && window.innerWidth < 768) window.scrollTo({ top: 0, behavior: "smooth" });
  }, [searchTerm]);

  // קורסים לסקשן התחתון לפי פילטר
  const coursesForGrid = coursesFilter === "summer"
    ? courses.filter((c:any) => isSummer(c.semester))
    : courses;

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden relative font-[Assistant] bg-transparent" dir={dir} lang={language}>
      {/* רקע מונפש */}
      <div className="bg-scene fixed inset-0 z-0 pointer-events-none select-none overflow-hidden">
        <div className="bg-gradient animate-gradient-shift" />
        <span className="blob blob1" />
        <span className="blob blob2" />
        <span className="blob blob3" />
        <svg className="wave absolute left-0 bottom-0 w-full z-[1]" height="90" viewBox="0 0 1728 90" fill="none" style={{opacity:0.14}}>
          <path d="M0 46C263 126 514 38 872 49C1230 60 1512 104 1728 42V90H0V46Z" fill="#fff" />
        </svg>
        {/* שכבת ורוד חזקה יותר במובייל בלבד */}
        <div className="mobile-pink-overlay" />
      </div>

      <div className="relative z-10">
        <div className="main-header-override">
          <Header />
        </div>
        {!user && <WelcomeBanner />}

        <main className="flex-1 flex flex-col justify-between">
          {/* Hero */}
          <section className="hero-section pt-4 pb-2 md:py-14 bg-transparent flex flex-col justify-between">
            <div className="mx-auto px-2 flex flex-col items-center text-center flex-1 w-full max-w-[1320px]">
              <div className="hero-title-enhanced mb-3 w-full md:w-3/4">
                <h1 className="text-[1.35rem] sm:text-2xl md:text-5xl font-extrabold text-white mb-1 drop-shadow-2xl dark:text-pink-100" style={{ lineHeight: '1.13' }}>
                  {t("home.hero.title")}
                </h1>
                <p className="text-[0.96rem] md:text-xl text-white/90 mb-2 drop-shadow dark:text-pink-50/90">
                  {t("home.hero.subtitle")}
                </p>
                <div className="hidden md:flex flex-wrap gap-3 justify-center mt-6 mb-1">
                  {benefits.map((b, i) => (
                    <span key={i} className="flex items-center gap-2 rounded-full bg-white/30 dark:bg-pink-500/20 px-4 py-2 font-bold text-base md:text-lg text-blue-900 dark:text-pink-50 shadow backdrop-blur-sm border border-white/30">
                      {b.icon}{b.label}
                    </span>
                  ))}
                </div>
              </div>

              {/* חיפוש */}
              <div ref={searchRef} className="max-w-xl w-full mx-auto mb-4 sticky-search z-20">{/* ↑ ריווח מוגדל במובייל */}
                <div className="relative group">
                  <Search className={`absolute ${isRTL ? "right-4" : "left-4"} top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-pink-200 w-6 h-6 group-focus-within:text-blue-500 transition-colors`} />
                  <Input
                    type="text"
                    placeholder={t("home.search.course_placeholder")}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`pl-4 pr-12 py-3 text-base md:text-lg ${isRTL ? "text-right" : "text-left"} border-2 border-white/20 focus:border-blue-400 rounded-xl shadow-lg backdrop-blur-md bg-white/95 hover:bg-white transition-all duration-300 dark:bg-[#23213a]/90 dark:backdrop-blur-xl dark:text-pink-100 dark:placeholder-pink-300 dark:border-pink-700 dark:focus:border-pink-400`}
                  />
                  {searchTerm && (
                    <button onClick={handleClearSearch} aria-label={t("home.search.clear_search")} className={`absolute ${isRTL ? "left-3" : "right-3"} top-1/2 -translate-y-1/2 text-2xl text-gray-400 hover:text-blue-600 transition`}>×</button>
                  )}
                </div>
              </div>

              {/* שבבי יתרונות – מובייל */}
              <div className="flex md:hidden gap-2 flex-wrap justify-center items-center mb-4">
                <span className="bg-gradient-to-r from-blue-200 to-purple-200 text-blue-900 font-bold rounded-lg px-3 py-1.5 shadow-md text-xs">{t("home.benefits.free_access")}</span>
                <span className="bg-gradient-to-r from-pink-100 to-purple-100 text-pink-700 font-bold rounded-lg px-3 py-1.5 shadow-md text-xs">{t("home.benefits.no_payment")}</span>
                <span className="bg-gradient-to-r from-blue-50 to-pink-100 text-violet-900 font-bold rounded-lg px-3 py-1.5 shadow-md text-xs">{t("home.benefits.by_students")}</span>
              </div>

              {/* קרוסלה */}
              {!isLoading && !isSearch && carouselCourses.length > 0 && (
                <>
                  <div className="w-full mt-2 mb-3 mx-auto flex items-center relative">{/* ↑ ריווח גם לפני וגם אחרי במובייל */}
                    {sliderLoaded && carouselCourses.length > 1 && (
                      <Button variant="ghost" size="icon" aria-label={t("common.previous")} className={`carousel-arrow ${isRTL ? "right-1 md:-right-8" : "left-1 md:-left-8"}`} onClick={() => instanceRef.current?.prev()}>
                        <svg width="28" height="28" fill="none" viewBox="0 0 24 24">
                          {isRTL ? <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /> : <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />}
                        </svg>
                      </Button>
                    )}

                    <div ref={sliderRef} className="keen-slider flex-1 px-0 sm:px-4">
                      {carouselCourses.map((course:any) => (
                        <div
                          className="keen-slider__slide flex justify-center"
                          key={course.id}
                          aria-label={getLocalizedText(course)}
                          onMouseEnter={() => setPauseCarousel(true)}
                          onMouseLeave={() => setPauseCarousel(false)}
                          onTouchStart={() => setPauseCarousel(true)}
                          onTouchEnd={() => setPauseCarousel(false)}
                        >
                          <Card
                            className="card w-[95vw] xs:w-[89vw] max-w-[350px] md:w-[210px] lg:w-[240px]
                                       rounded-2xl bg-white/95 dark:bg-gradient-to-br dark:from-[#292346]/90 dark:to-[#3b235a]/90
                                       hover:shadow-xl hover:scale-[1.04] cursor-pointer transition-all duration-300
                                       shadow group flex-shrink-0 relative border-2 border-white/50 dark:border-pink-400/40 overflow-visible"
                            style={{ minHeight: 158 }}
                            onClick={() => handleCourseClick(course.id)}
                          >
                            <CardHeader className="pb-2 pt-6 md:pt-4 px-5">
                              <CardTitle className="text-base md:text-lg font-bold truncate dark:text-pink-100 group-hover:text-blue-600 dark:group-hover:text-pink-300">
                                {getLocalizedText(course)}
                              </CardTitle>

                              {/* מספר קורס – ממורכז במובייל, רגיל בדסקטופ */}
                              {course.code && (
                                <>
                                  <Badge className="course-code-badge-mobile md:hidden block w-full justify-center bg-blue-100 text-blue-800 dark:bg-pink-500/30 dark:text-pink-100 text-xs font-bold px-2 py-[2px] mt-1">
                                    {course.code}
                                  </Badge>
                                  <Badge className="hidden md:inline-flex bg-blue-100 text-blue-800 dark:bg-pink-500/30 dark:text-pink-100 text-xs font-bold px-2 py-[2px] mt-1">
                                    {course.code}
                                  </Badge>
                                </>
                              )}

                              {/* פופולרי – מוגבה, לא מכסה טקסט */}
                              {isPopular(course) && !savedCourseIds.has(course.id) && (
                                <span className="popular-badge">{t("home.course.popular")}</span>
                              )}
                            </CardHeader>

                            <CardContent className="pt-0 pb-4 px-5 space-y-2">
                              {/* סמסטר – תמיד מופיע גם אם ריק */}
                              <div className="flex items-center gap-2 text-xs md:text-sm text-gray-600 dark:text-pink-200">
                                <BookOpen className="w-5 h-5 dark:text-pink-300" />
                                <span>{t("home.course.semester_label")} {course.semester ? course.semester : "."}</span>
                              </div>

                              {course.exam_date && (
                                <div className="flex items-center gap-2 text-xs md:text-sm text-gray-600 dark:text-purple-200">
                                  <Calendar className="w-5 h-5 dark:text-pink-300" />
                                  <span>{t("home.course.exam_date_label")} {formatLocalizedDate(course.exam_date)}</span>
                                </div>
                              )}

                              {course.enable_collaboration && (
                                <div className="flex items-center gap-2 text-xs md:text-sm text-green-600 dark:text-pink-400">
                                  <Users className="w-5 h-5 dark:text-pink-400" />
                                  <span>{t("home.course.collaboration_available")}</span>
                                </div>
                              )}
                            </CardContent>

                            {!savedCourseIds.has(course.id) && (
                              <div className="absolute left-3 bottom-3 z-10">
                                <SaveToAccountButton courseId={course.id} courseName={getLocalizedText(course)} compact />
                              </div>
                            )}
                          </Card>
                        </div>
                      ))}
                    </div>

                    {sliderLoaded && carouselCourses.length > 1 && (
                      <Button variant="ghost" size="icon" aria-label={t("common.next")} className={`carousel-arrow ${isRTL ? "left-1 md:-left-8" : "right-1 md:-right-8"}`} onClick={() => instanceRef.current?.next()}>
                        <svg width="28" height="28" fill="none" viewBox="0 0 24 24">
                          {isRTL ? <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /> : <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />}
                        </svg>
                      </Button>
                    )}
                  </div>

                  {/* דוטים – מובייל בלבד */}
                  <div className="flex flex-col items-center md:hidden mb-4">
                    {carouselCourses.length > 1 && (
                      <>
                        <div className="text-xs text-gray-600 dark:text-pink-200 mb-1 select-none">{t("home.carousel.swipe_hint")}</div>
                        <div className="flex justify-center gap-1">
                          {carouselCourses.map((_, idx) => (
                            <span key={idx} className={`inline-block w-2.5 h-2.5 rounded-full transition-all ${currentSlide === idx ? 'bg-pink-500 dark:bg-pink-300 shadow-md scale-110' : 'bg-pink-200/60 dark:bg-pink-900/60'}`} />
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </>
              )}

              {/* כפתור – בקצה המסך במובייל, גדול בדסקטופ; דואג שלא "יציץ" הסקשן הבא */}
              {!isSearch && courses.length > 0 && (
                <div className="flex justify-center mt-4 mb-3 w-full sticky bottom-0 z-30">
                  <Button className="rounded-xl px-8 md:px-10 py-3 text-lg md:text-xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg hover:scale-105 transition" onClick={scrollToCourses} style={{ width: "96%", maxWidth: 520 }}>
                    {t("home.courses.all_courses_button")}
                  </Button>
                </div>
              )}
              <div className="block md:hidden" style={{ minHeight: 36 }} />
            </div>
          </section>

          {/* כל הקורסים */}
          <section className="py-8 md:py-16 bg-white/95 backdrop-blur-sm dark:bg-[#251e35]/90 dark:backdrop-blur-2xl transition-all duration-500" ref={coursesSectionRef}>
            <div className="container mx-auto px-2">
              <div className="text-center mb-5 md:mb-8">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2 dark:text-pink-200 drop-shadow">
                  {t("home.course.all_courses_label", { count: courses.length })}
                </h2>
                <p className="text-base text-gray-600 dark:text-pink-200/80">{t("home.course.all_courses_sub")}</p>
              </div>

              {/* פילטרים – קיץ (ברירת מחדל) / כל הקורסים */}
              <div className="w-full flex justify-center mb-6">
                <div className="inline-flex rounded-xl overflow-hidden border border-blue-200/60 dark:border-pink-500/30 bg-white/70 dark:bg-white/5 backdrop-blur">
                  <button
                    className={`px-4 py-2 text-sm font-bold ${coursesFilter === "summer" ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white" : "text-blue-800 dark:text-pink-200"}`}
                    onClick={() => setCoursesFilter("summer")}
                  >
                    סמסטר קיץ
                  </button>
                  <button
                    className={`px-4 py-2 text-sm font-bold ${coursesFilter === "all" ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white" : "text-blue-800 dark:text-pink-200"}`}
                    onClick={() => setCoursesFilter("all")}
                  >
                    כל הקורסים
                  </button>
                </div>
              </div>

              {isLoading ? (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-14 h-14 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4 dark:border-pink-900 dark:border-t-pink-400"></div>
                  <div className="text-lg text-gray-600 dark:text-pink-200">{t("home.courses.loading")}</div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                  {coursesForGrid.map((course:any) => (
                    <Card
                      key={course.id}
                      className="rounded-2xl group hover:shadow-2xl hover:-translate-y-1.5 hover:scale-[1.02]
                                 border-2 border-transparent hover:border-blue-200
                                 bg-white/95 dark:bg-gradient-to-br dark:from-[#292346]/90 dark:to-[#3b235a]/90 dark:border-pink-500/30
                                 shadow-md dark:shadow-[0_2px_40px_rgba(255,90,190,0.10)]
                                 relative overflow-hidden min-h-[180px] cursor-pointer transition-all duration-300"
                      onClick={() => handleCourseClick(course.id)}
                    >
                      <CardHeader className="pb-2 pt-4 px-6">
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-base md:text-lg font-bold dark:text-pink-100 leading-tight group-hover:text-blue-600 dark:group-hover:text-pink-300 transition-colors duration-300">
                            {getLocalizedText(course)}
                          </CardTitle>
                          {course.code && (
                            <Badge className="bg-blue-100 text-blue-800 dark:bg-pink-500/30 dark:text-pink-100 text-xs font-bold px-2 py-1 mt-1">
                              {course.code}
                            </Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0 pb-4 px-6 space-y-2">
                        {/* סמסטר – תמיד מופיע גם אם ריק */}
                        <div className="flex items-center gap-2 text-xs md:text-sm text-gray-600 dark:text-pink-200">
                          <BookOpen className="w-5 h-5 dark:text-pink-300" />
                          <span>{t("home.course.semester_label")} {course.semester ? course.semester : "."}</span>
                        </div>
                        {course.exam_date && (
                          <div className="flex items-center gap-2 text-xs md:text-sm text-gray-600 dark:text-purple-200">
                            <Calendar className="w-5 h-5 dark:text-pink-300" />
                            <span>{t("home.course.exam_date_label")} {formatLocalizedDate(course.exam_date)}</span>
                          </div>
                        )}
                        {course.enable_collaboration && (
                          <div className="flex items-center gap-2 text-xs md:text-sm text-green-600 dark:text-pink-400">
                            <Users className="w-5 h-5 dark:text-pink-400" />
                            <span>{t("home.course.collaboration_available")}</span>
                          </div>
                        )}
                        <Button
                          className="w-full mt-4 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-base font-bold py-2 shadow-md hover:shadow-xl hover:scale-105 transition-all
                                     dark:from-pink-500 dark:to-purple-800 dark:hover:from-pink-400 dark:hover:to-purple-900 dark:text-white dark:font-bold dark:shadow-pink-700/40"
                          onClick={(e) => { e.stopPropagation(); handleCourseClick(course.id); }}
                        >
                          {t("home.course.view_details")}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {!isLoading && coursesForGrid.length === 0 && (
                <div className="text-center py-8">
                  <div className="text-lg text-gray-600 mb-2 dark:text-pink-200">{t("home.courses.no_courses")}</div>
                </div>
              )}
            </div>
          </section>
        </main>
        <Footer />
      </div>

      {/* ===== CSS – רק מובייל משתנה, דסקטופ נשאר ===== */}
      <style>{`
        /* רקע מונפש */
        .bg-gradient{ position:absolute; inset:0;
          background: linear-gradient(120deg,#825ae8 0%,#a579e7 18%,#e8b5f5 38%,#fca4c0 56%,#f57bc5 75%,#7ecff2 100%);
          background-size:400% 400%;
        }
        @keyframes gradient-shift{ 0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%} }
        .animate-gradient-shift{ animation: gradient-shift 14s ease-in-out infinite; will-change: background-position; }
        .blob{ position:absolute; border-radius:9999px; filter:blur(60px); opacity:.35; mix-blend-mode:screen; will-change:transform; }
        .blob1{ width:480px;height:480px;top:-120px;right:-80px;background:radial-gradient(circle at 30% 30%,#ff7ad1 0%,#8b5cf6 70%);animation:blobFloat1 26s ease-in-out infinite; }
        .blob2{ width:520px;height:520px;bottom:-160px;left:-120px;background:radial-gradient(circle at 70% 40%,#60a5fa 0%,#f472b6 65%);animation:blobFloat2 32s ease-in-out infinite; }
        .blob3{ width:360px;height:360px;top:42%;left:55%;background:radial-gradient(circle at 50% 50%,#fbbf24 0%,#fb7185 70%);animation:blobFloat3 30s ease-in-out infinite; }
        @keyframes blobFloat1{0%{transform:translate(0,0) scale(1)}50%{transform:translate(-40px,30px) scale(1.08)}100%{transform:translate(0,0) scale(1)}}
        @keyframes blobFloat2{0%{transform:translate(0,0) scale(1)}50%{transform:translate(50px,-30px) scale(1.12)}100%{transform:translate(0,0) scale(1)}}
        @keyframes blobFloat3{0%{transform:translate(0,0) scale(1)}50%{transform:translate(-30px,15px) scale(1.06)}100%{transform:translate(0,0) scale(1)}}
        .dark .blob{ opacity:.25; filter:blur(70px); }
        @media (prefers-reduced-motion: reduce){ .animate-gradient-shift,.blob{ animation:none !important } }

        .hero-title-enhanced{
          background: rgba(255,255,255,0.13); backdrop-filter: blur(18px);
          padding:1.2rem .7rem; border-radius:1.45rem; border:2px solid rgba(255,255,255,0.10); box-shadow:0 8px 38px rgba(0,0,0,0.08);
        }
        @media (min-width:768px){ .hero-title-enhanced{ padding:2.2rem 2.8rem } }
        .main-header-override .dark\\:bg-gradient-to-b{ border-radius:0 !important }

        .sticky-search{ position:static; top:0; z-index:20; transition:box-shadow .2s }
        .sticky-search-active{ position:sticky !important; top:56px; background:rgba(245,245,255,0.92); box-shadow:0 3px 12px rgba(185,110,255,0.07); border-radius:1rem }

        /* חיצים – מובייל עדין */
        .carousel-arrow{ position:absolute; top:50%; transform:translateY(-50%); z-index:20; backdrop-filter:blur(8px);
          background:rgba(255,255,255,0.88); color:#1e3a8a; border:1px solid rgba(255,255,255,0.6); border-radius:9999px; width:44px; height:44px; box-shadow:0 6px 16px rgba(0,0,0,0.12); }
        .carousel-arrow:hover{ transform:translateY(-50%) scale(1.06) }
        @media (max-width:767px){ .carousel-arrow{ width:30px;height:30px;opacity:.45;background:rgba(255,255,255,.6);border:none;box-shadow:0 4px 10px rgba(0,0,0,.10) } }

        /* ===== מובייל בלבד – כל העדכונים שביקשת ===== */
        @media (max-width:767px){
          /* עושה שההרו יתפוס מסך פתיחה מלא כדי שלא יציץ הסקשן הבא */
          .hero-section{ min-height: 100svh; }
          /* שכבת ורוד חזקה יותר */
          .mobile-pink-overlay{ position:absolute; inset:0; background: linear-gradient(180deg, rgba(255,192,203,0.28) 0%, rgba(255,178,216,0.38) 35%, rgba(255,192,203,0.28) 100%); }
          /* קרוסלה צרה ונוחה */
          .keen-slider__slide > .card{
            min-width: 82vw !important;  /* היה רחב מדי */
            max-width: 86vw !important;
            margin-left: 4vw; margin-right: 4vw;
          }
          /* ריווח לפני ואחרי הקרוסלה */
          .hero-section .keen-slider{ margin-top: .2rem; margin-bottom: .2rem }
          /* מספר קורס – ממורכז כבר דרך המחלקה course-code-badge-mobile */
        }

        @supports (-webkit-touch-callout: none){
          html, body, #root, .min-h-screen { min-height: -webkit-fill-available !important; height: -webkit-fill-available !important; }
        }
        @media (max-width:350px){ .keen-slider__slide > .card{ min-width: 88vw !important } }

        /* תגית פופולרי */
        .popular-badge{
          position:absolute; left:.9rem; top:-10px; font-size:10px; line-height:1; padding:4px 8px; border-radius:9999px;
          background:linear-gradient(90deg,#ec4899,#8b5cf6); color:#fff; font-weight:800; box-shadow:0 10px 18px rgba(0,0,0,.18); border:1px solid rgba(255,255,255,.65); pointer-events:none;
        }
      `}</style>
    </div>
  );
};

export default Index;
