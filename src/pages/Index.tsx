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
import { useAuth } from "@/contexts/AuthProvider";
import { usePublicInstitution, usePublicCourses } from "@/hooks/usePublicData";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  BookOpen,
  Calendar,
  Users,
  Search,
  Gift,
  Zap,
  HeartHandshake,
  ShoppingCart,
} from "lucide-react";
import WelcomeBanner from "@/components/WelcomeBanner";
import SaveToAccountButton from "@/components/course/SaveToAccountButton";
import { useLanguage } from "@/contexts/LanguageContext";

const popularCoursesKeywords = [
  "בדידה",
  "אלגברה לינארית",
  "אינפי",
  "אינפי 1",
  "אינפיניטסמלי",
  "חשבון",
  "לוגיקה",
  "ממן",
  "מבוא",
  "סטטיסטיקה",
];

function isPopular(course: any) {
  const name = `${course.name_he} ${course.name_en || ""}`.toLowerCase();
  return popularCoursesKeywords.some((kw) => name.includes(kw.toLowerCase()));
}

const Index: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sliderLoaded, setSliderLoaded] = useState(false);
  const [pauseCarousel, setPauseCarousel] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, language, dir, isRTL, getLocalizedText, formatLocalizedDate } =
    useLanguage();

  // יתרונות (מתורגם)
  const benefits = [
    { icon: <Gift size={22} />, label: t("home.benefits.discounts") },
    { icon: <ShoppingCart size={22} />, label: t("home.benefits.store") },
    { icon: <Zap size={22} />, label: t("home.benefits.smart_board") },
    { icon: <HeartHandshake size={22} />, label: t("home.benefits.study_groups") },
    { icon: <Users size={22} />, label: t("home.benefits.community") },
  ];

  // מוסד וקורסים
  const { data: openUniversity, isLoading: isLoadingInstitution } =
    usePublicInstitution();
  const { data: courses = [], isLoading: isLoadingCourses } =
    usePublicCourses(openUniversity?.id);
  const isLoading = isLoadingInstitution || isLoadingCourses;

  // קורסים ששמר המשתמש
  const { data: savedCoursesData = [] } = useQuery({
    queryKey: ["user-saved-courses", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("user_course_progress")
        .select("course_id")
        .eq("user_id", user!.id);
      return data?.map((row) => row.course_id) ?? [];
    },
  });

  const savedCourseIds = new Set(savedCoursesData);
  const savedCourses = courses.filter((c: any) => savedCourseIds.has(c.id));
  const popularCourses = courses.filter(
    (c: any) => isPopular(c) && !savedCourseIds.has(c.id)
  );
  const otherCourses = courses.filter(
    (c: any) => !savedCourseIds.has(c.id) && !isPopular(c)
  );
  const carouselCourses = [...savedCourses, ...popularCourses, ...otherCourses].slice(
    0,
    12
  );

  // חיפוש
  const isSearch = searchTerm.trim() !== "";
  const filteredCourses = isSearch
    ? courses.filter(
        (course: any) =>
          getLocalizedText(course)
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          course.code?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : courses;

  // קרוסלה
  const [sliderRef, instanceRef] = useKeenSlider({
    loop: true,
    rtl: isRTL,
    slides: { perView: 1, spacing: 12 },
    breakpoints: {
      "(min-width: 480px)": { slides: { perView: 2, spacing: 16 } },
      "(min-width: 768px)": { slides: { perView: 3, spacing: 22 } },
      "(min-width: 1100px)": { slides: { perView: 4, spacing: 30 } },
    },
    created: () => setSliderLoaded(true),
    slideChanged(s) {
      setCurrentSlide(s.track.details.rel);
    },
  });

  useEffect(() => {
    if (!sliderLoaded || !instanceRef.current || isSearch) return;
    if (pauseCarousel) return;
    const interval = setInterval(() => {
      instanceRef.current?.next();
    }, 3400);
    return () => clearInterval(interval);
  }, [sliderLoaded, instanceRef, isSearch, pauseCarousel]);

  const handleCourseClick = (courseId: string) => navigate(`/course/${courseId}`);

  // קפיצה לסקשן "כל הקורסים"
  const coursesSectionRef = useRef<HTMLDivElement | null>(null);
  const scrollToCourses = () => {
    coursesSectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  // חיפוש sticky
  const searchRef = useRef<HTMLDivElement | null>(null);
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
    if (!searchTerm && window.innerWidth < 768)
      window.scrollTo({ top: 0, behavior: "smooth" });
  }, [searchTerm]);

  return (
    <div
      className="min-h-screen flex flex-col overflow-x-hidden relative font-[Assistant] bg-gradient-to-b from-[#efc9f4]/70 to-[#f8dbec] dark:from-[#181026] dark:to-[#28193e]"
      dir={dir}
      lang={language}
    >
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
        <svg
          className="absolute left-0 bottom-0 w-full z-1"
          style={{ opacity: 0.14 }}
          height="90"
          viewBox="0 0 1728 90"
          fill="none"
        >
          <path
            d="M0 46C263 126 514 38 872 49C1230 60 1512 104 1728 42V90H0V46Z"
            fill="#fff"
          />
        </svg>
      </div>

      <div className="relative z-10">
        {/* Header */}
        <div className="main-header-override">
          <Header />
        </div>

        {!user && <WelcomeBanner />}

        <main className="flex-1 flex flex-col justify-between">
          {/* HERO */}
          <section className="hero-wrap pt-4 md:pt-6 bg-transparent">
            {/* תוכן ה־Hero */}
            <div className="container mx-auto px-2 text-center flex-1">
              <div className="hero-stack max-w-3xl mx-auto">
                {/* כותרת + תיאור + יתרונות */}
                <div className="hero-title-enhanced">
                  <h1
                    className="text-[1.35rem] sm:text-2xl md:text-5xl font-extrabold text-white mb-1 drop-shadow-2xl dark:text-pink-100"
                    style={{ lineHeight: "1.13" }}
                  >
                    {t("home.hero.title")}
                  </h1>
                  <p className="text-[0.96rem] md:text-xl text-white/90 mb-2 drop-shadow dark:text-pink-50/90">
                    {t("home.hero.subtitle")}
                  </p>

                  {/* יתרונות – דסקטופ */}
                  <div className="hidden md:flex flex-wrap gap-3 justify-center mt-6 mb-1">
                    {benefits.map((b, i) => (
                      <span
                        key={i}
                        className="flex items-center gap-2 rounded-full bg-white/30 dark:bg-pink-500/20 px-4 py-2 font-bold text-base md:text-lg text-blue-900 dark:text-pink-50 shadow backdrop-blur-sm border border-white/30"
                      >
                        {b.icon}
                        {b.label}
                      </span>
                    ))}
                  </div>
                </div>

                {/* חיפוש – sticky במובייל */}
                <div ref={searchRef} className="max-w-xl w-full mx-auto sticky-search">
                  <div className="relative group">
                    <Search
                      className={`absolute ${
                        isRTL ? "right-4" : "left-4"
                      } top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-pink-200 w-6 h-6 group-focus-within:text-blue-500 transition-colors`}
                    />
                    <Input
                      type="text"
                      placeholder={t("home.search.course_placeholder")}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className={`pl-4 pr-12 py-3 text-base md:text-lg ${
                        isRTL ? "text-right" : "text-left"
                      } border-2 border-white/20 focus:border-blue-400 
                      rounded-xl shadow-lg backdrop-blur-md bg-white/95 hover:bg-white transition-all duration-300
                      dark:bg-[#23213a]/90 dark:backdrop-blur-xl dark:text-pink-100 dark:placeholder-pink-300
                      dark:border-pink-700 dark:focus:border-pink-400`}
                    />
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm("")}
                        aria-label={t("home.search.clear_search")}
                        className={`absolute ${
                          isRTL ? "left-3" : "right-3"
                        } top-1/2 transform -translate-y-1/2 text-2xl text-gray-400 hover:text-blue-600 transition`}
                      >
                        ×
                      </button>
                    )}
                  </div>
                </div>

                {/* צ'יפים – מובייל */}
                <div className="md:hidden">
                  <div className="hero-row gap-2">
                    <span className="chip">{t("home.benefits.free_access")}</span>
                    <span className="chip">{t("home.benefits.no_payment")}</span>
                    <span className="chip">{t("home.benefits.by_students")}</span>
                  </div>
                </div>

                {/* קרוסלה */}
                {!isLoading && !isSearch && carouselCourses.length > 0 && (
                  <>
                    <div className="w-full mt-2 mb-1 max-w-7xl mx-auto flex items-center relative">
                      {sliderLoaded && carouselCourses.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={t("common.previous")}
                          className={`absolute top-1/2 ${
                            isRTL ? "-right-3 md:-right-8" : "-left-3 md:-left-8"
                          } -translate-y-1/2 z-20 bg-white/85 dark:bg-pink-500/20 text-blue-700 dark:text-pink-200 shadow`}
                          onClick={() => instanceRef.current?.prev()}
                        >
                          <svg width="30" height="30" fill="none" viewBox="0 0 24 24">
                            {isRTL ? (
                              <path
                                d="M9 18l6-6-6-6"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            ) : (
                              <path
                                d="M15 6l-6 6 6 6"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            )}
                          </svg>
                        </Button>
                      )}

                      <div ref={sliderRef} className="keen-slider flex-1 px-0 sm:px-4">
                        {carouselCourses.map((course: any) => (
                          <div
                            className="keen-slider__slide flex justify-center"
                            key={course.id}
                            aria-label={getLocalizedText(course)}
                            onMouseEnter={() => setPauseCarousel(true)}
                            onMouseLeave={() => setPauseCarousel(false)}
                          >
                            <Card
                              className={`card w-[95vw] xs:w-[89vw] max-w-[350px] md:w-[210px] lg:w-[240px]
                              rounded-2xl bg-white/95 dark:bg-gradient-to-br dark:from-[#292346]/90 dark:to-[#3b235a]/90
                              hover:shadow-xl hover:scale-[1.04] cursor-pointer transition-all duration-300
                              shadow group flex-shrink-0 relative border-2 border-white/50 dark:border-pink-400/40`}
                              style={{ minHeight: 152 }}
                              onClick={() => handleCourseClick(course.id)}
                            >
                              <CardHeader className="pb-2 pt-4 px-5">
                                <CardTitle className="text-base md:text-lg font-bold truncate dark:text-pink-100 group-hover:text-blue-600 dark:group-hover:text-pink-300">
                                  {getLocalizedText(course)}
                                </CardTitle>
                                {course.code && (
                                  <Badge className="bg-blue-100 text-blue-800 dark:bg-pink-500/30 dark:text-pink-100 text-xs font-bold px-2 py-1 mt-1">
                                    {course.code}
                                  </Badge>
                                )}
                                {isPopular(course) && !savedCourseIds.has(course.id) && (
                                  <span className="absolute left-3 top-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white text-xs px-3 py-1 rounded-full font-bold shadow drop-shadow-md border border-white/70">
                                    {t("home.course.popular")}
                                  </span>
                                )}
                              </CardHeader>

                              <CardContent className="pt-0 pb-4 px-5 space-y-2">
                                {course.semester && (
                                  <div className="flex items-center gap-2 text-xs md:text-sm text-gray-600 dark:text-pink-200">
                                    <BookOpen className="w-5 h-5 dark:text-pink-300" />
                                    <span>
                                      {t("home.course.semester_label")} {course.semester}
                                    </span>
                                  </div>
                                )}
                                {course.exam_date && (
                                  <div className="flex items-center gap-2 text-xs md:text-sm text-gray-600 dark:text-purple-200">
                                    <Calendar className="w-5 h-5 dark:text-pink-300" />
                                    <span>
                                      {t("home.course.exam_date_label")}{" "}
                                      {formatLocalizedDate(course.exam_date)}
                                    </span>
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
                                  <SaveToAccountButton
                                    courseId={course.id}
                                    courseName={getLocalizedText(course)}
                                    compact
                                  />
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
                          aria-label={t("common.next")}
                          className={`absolute top-1/2 ${
                            isRTL ? "-left-3 md:-left-8" : "-right-3 md:-right-8"
                          } -translate-y-1/2 z-20 bg-white/85 dark:bg-pink-500/20 text-blue-700 dark:text-pink-200 shadow`}
                          onClick={() => instanceRef.current?.next()}
                        >
                          <svg width="30" height="30" fill="none" viewBox="0 0 24 24">
                            {isRTL ? (
                              <path
                                d="M15 6l-6 6 6 6"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            ) : (
                              <path
                                d="M9 18l6-6-6-6"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            )}
                          </svg>
                        </Button>
                      )}
                    </div>

                    {/* דוטים + טקסט הנחיה – קומפקטי במובייל */}
                    <div className="flex flex-col items-center md:hidden dots">
                      <div className="swipe-hint text-gray-600 dark:text-pink-200 select-none">
                        {t("home.carousel.swipe_hint")}
                      </div>
                      <div className="flex justify-center gap-1">
                        {carouselCourses.map((_: any, idx: number) => (
                          <span
                            key={idx}
                            className={`inline-block w-2.5 h-2.5 rounded-full transition-all ${
                              currentSlide === idx
                                ? "bg-pink-500 dark:bg-pink-300 shadow-md scale-110"
                                : "bg-pink-200/60 dark:bg-pink-900/60"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* תוצאות חיפוש */}
                {!isLoading && isSearch && filteredCourses.length > 0 && (
                  <div className="w-full mt-3 mb-3 grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                    {filteredCourses.map((course: any) => (
                      <Card
                        key={course.id}
                        className="rounded-2xl group hover:shadow-2xl hover:-translate-y-1.5 hover:scale-[1.02]
                        border-2 border-transparent hover:border-blue-200
                        bg-white/95 dark:bg-gradient-to-br 
                        dark:from-[#292346]/90 dark:to-[#3b235a]/90 dark:border-pink-500/30
                        shadow-md dark:shadow-[0_2px_40px_rgba(255,90,190,0.10)]
                        relative overflow-hidden
                        min-h-[170px]
                        cursor-pointer transition-all duration-300"
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
                          {course.name_en && language === "en" && (
                            <p className="text-xs md:text-sm text-gray-500 dark:text-pink-200 mt-1 font-medium">
                              {course.name_en}
                            </p>
                          )}
                        </CardHeader>

                        <CardContent className="pt-0 pb-4 px-6 space-y-2">
                          {course.semester && (
                            <div className="flex items-center gap-2 text-xs md:text-sm text-gray-600 dark:text-pink-200">
                              <BookOpen className="w-5 h-5 dark:text-pink-300" />
                              <span>
                                {t("home.course.semester_label")} {course.semester}
                              </span>
                            </div>
                          )}
                          {course.exam_date && (
                            <div className="flex items-center gap-2 text-xs md:text-sm text-gray-600 dark:text-purple-200">
                              <Calendar className="w-5 h-5 dark:text-pink-300" />
                              <span>
                                {t("home.course.exam_date_label")}{" "}
                                {formatLocalizedDate(course.exam_date)}
                              </span>
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
                            dark:from-pink-500 dark:to-purple-800 dark:hover:from-pink-400 dark:hover:to-purple-900
                            dark:text-white dark:font-bold dark:shadow-pink-700/40"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCourseClick(course.id);
                            }}
                          >
                            {t("home.course.view_details")}
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {/* אפס תוצאות */}
                {!isLoading && filteredCourses.length === 0 && (
                  <div className="text-center py-4">
                    <div className="text-lg text-gray-600 mb-2 dark:text-pink-200">
                      {isSearch ? t("home.courses.no_results") : t("home.courses.no_courses")}
                    </div>
                  </div>
                )}
              </div>

              {/* כפתור בתחתית ה־Hero (תמיד נראה במסך הפתיחה) */}
              {!isSearch && courses.length > 0 && (
                <div className="hero-cta">
                  <Button
                    className="rounded-xl px-8 py-3 text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg hover:scale-105 transition"
                    onClick={scrollToCourses}
                    style={{ width: "96%", maxWidth: 420 }}
                  >
                    {t("home.courses.all_courses_button")}
                  </Button>
                </div>
              )}
            </div>
          </section>

          {/* כל הקורסים */}
          <section
            ref={coursesSectionRef}
            className="py-8 md:py-16 bg-white/95 backdrop-blur-sm dark:bg-[#251e35]/90 dark:backdrop-blur-2xl transition-all duration-500"
          >
            <div className="container mx-auto px-2">
              <div className="text-center mb-8">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2 dark:text-pink-200 drop-shadow">
                  {t("home.course.all_courses_label", { count: courses.length })}
                </h2>
                <p className="text-base text-gray-600 dark:text-pink-200/80">
                  {t("home.course.all_courses_sub")}
                </p>
              </div>

              {isLoading ? (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-14 h-14 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4 dark:border-pink-900 dark:border-t-pink-400" />
                  <div className="text-lg text-gray-600 dark:text-pink-200">
                    {t("home.courses.loading")}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                  {courses.map((course: any) => (
                    <Card
                      key={course.id}
                      className="rounded-2xl group hover:shadow-2xl hover:-translate-y-1.5 hover:scale-[1.02]
                      border-2 border-transparent hover:border-blue-200
                      bg-white/95 dark:bg-gradient-to-br 
                      dark:from-[#292346]/90 dark:to-[#3b235a]/90 dark:border-pink-500/30
                      shadow-md dark:shadow-[0_2px_40px_rgba(255,90,190,0.10)]
                      relative overflow-hidden
                      min-h-[180px]
                      cursor-pointer transition-all duration-300"
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
                        {course.name_en && language === "en" && (
                          <p className="text-xs md:text-sm text-gray-500 dark:text-pink-200 mt-1 font-medium">
                            {course.name_en}
                          </p>
                        )}
                      </CardHeader>

                      <CardContent className="pt-0 pb-4 px-6 space-y-2">
                        {course.semester && (
                          <div className="flex items-center gap-2 text-xs md:text-sm text-gray-600 dark:text-pink-200">
                            <BookOpen className="w-5 h-5 dark:text-pink-300" />
                            <span>
                              {t("home.course.semester_label")} {course.semester}
                            </span>
                          </div>
                        )}
                        {course.exam_date && (
                          <div className="flex items-center gap-2 text-xs md:text-sm text-gray-600 dark:text-purple-200">
                            <Calendar className="w-5 h-5 dark:text-pink-300" />
                            <span>
                              {t("home.course.exam_date_label")}{" "}
                              {formatLocalizedDate(course.exam_date)}
                            </span>
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
                          dark:from-pink-500 dark:to-purple-800 dark:hover:from-pink-400 dark:hover:to-purple-900
                          dark:text-white dark:font-bold dark:shadow-pink-700/40"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCourseClick(course.id);
                          }}
                        >
                          {t("home.course.view_details")}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {!isLoading && courses.length === 0 && (
                <div className="text-center py-8">
                  <div className="text-lg text-gray-600 mb-2 dark:text-pink-200">
                    {t("home.courses.no_courses")}
                  </div>
                </div>
              )}
            </div>
          </section>
        </main>

        <Footer />
      </div>

      {/* CSS */}
      <style>{`
        @keyframes gradient-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient-shift { animation: gradient-shift 10s ease-in-out infinite; }

        .main-header-override .dark\\:bg-gradient-to-b { border-radius: 0 !important; }

        /* HERO height: תופס את כל המסך הפתיחה פחות קצת מרווח, כך שלא יראו את הסקשן הבא */
        .hero-wrap {
          min-height: calc(100dvh - 96px); /* הערכה לגובה ההדר; עובד מצוין ברוב המכשירים */
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding-bottom: 0;
        }

        /* קצב אנכי אחיד ונעים בתוך ה-Hero */
        .hero-stack > * + * { margin-top: clamp(10px, 1.8vh, 18px); }

        .hero-title-enhanced {
          background: rgba(255,255,255,0.13);
          backdrop-filter: blur(18px);
          padding: 1.1rem .9rem;
          border-radius: 1.45rem;
          border: 2px solid rgba(255,255,255,0.10);
          box-shadow: 0 8px 38px rgba(0,0,0,0.08);
        }
        @media (min-width: 768px) {
          .hero-title-enhanced { padding: 2.1rem 2.6rem; }
        }

        .sticky-search { position: static; transition: box-shadow .2s; }
        .sticky-search-active {
          position: sticky !important;
          top: 56px;
          background: rgba(245,245,255,0.92);
          box-shadow: 0 3px 12px 0 rgba(185,110,255,0.07);
          border-radius: 1rem;
          z-index: 20;
        }

        /* שורה אופקית קטנה לפריטים במובייל */
        .hero-row { display:flex; align-items:center; justify-content:center; flex-wrap:wrap; }
        .chip {
          display:inline-block; background:linear-gradient(90deg,#e9d7ff,#ffd6f0);
          color:#5b21b6; font-weight:700; border-radius:10px; padding:6px 10px;
          box-shadow:0 2px 8px rgba(0,0,0,.08); font-size:12px; margin:0 4px 6px;
        }

        /* הנחיית swipe + דוטים – קומפקטיים */
        .swipe-hint { margin-top: 6px; margin-bottom: 4px; font-size:12px; opacity:.9; }
        .dots { margin-top:4px; margin-bottom:8px; }

        /* הכפתור התחתון של ה-Hero: תמיד בתחתית, עם ריווח Safe Area במובייל */
        .hero-cta {
          margin-top: auto;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: clamp(10px, 2.5vh, 20px) 0 calc(env(safe-area-inset-bottom, 0px) + 10px);
        }

        /* כרטיסי קרוסלה במובייל */
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
          .keen-slider__slide > .card { margin-top: 2px; margin-bottom: 2px; }
        }

        /* תיקוני iOS */
        @supports (-webkit-touch-callout: none) {
          html, body, #root, .min-h-screen {
            min-height: -webkit-fill-available !important;
            height: -webkit-fill-available !important;
          }
        }

        /* מסכים קטנים מאוד */
        @media (max-width: 350px) {
          .keen-slider__slide > .card { min-width: 96vw !important; }
        }
      `}</style>
    </div>
  );
};

export default Index;
