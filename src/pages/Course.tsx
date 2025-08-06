import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { BookOpen, Calendar, Star, MessageCircle, Users } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ExamDatesSection from '@/components/course/ExamDatesSection';
import SharedSessionsSection from '@/components/course/SharedSessionsSection';
import StudyPartnersListSection from '@/components/course/StudyPartnersListSection';
import RelevantTutors from '@/components/course/RelevantTutors';
import SaveToAccountButton from '@/components/course/SaveToAccountButton';
import CourseAssignmentsSection from '@/components/course/CourseAssignmentsSection';
import ComingSoonSection from '@/components/course/ComingSoonSection';
import CourseReviewsSection from '@/components/course/CourseReviewsSection';
import EnhancedLecturerRatingsSection from '@/components/course/EnhancedLecturerRatingsSection';
import CourseNavigationSidebar from '@/components/course/CourseNavigationSidebar';

const sectionBox = "rounded-2xl shadow-lg bg-white/80 dark:bg-gray-900/80 border border-gray-200 p-4 sm:p-5 lg:p-8";
const compactSectionBox = "rounded-xl shadow bg-white/80 dark:bg-gray-900/80 border border-gray-200 p-2 sm:p-3";
const gradientBox = "bg-gradient-to-l from-blue-600 via-indigo-700 to-purple-600 shadow-2xl";
const mainText = "text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight drop-shadow break-words";
const subtitleText = "text-base sm:text-xl text-blue-100 mb-3 sm:mb-4 font-medium";
const pill = "rounded-full px-4 py-2 text-sm font-semibold shadow";

const sectionTitle = "text-lg sm:text-xl font-bold mb-3 sm:mb-5 text-blue-700 dark:text-blue-100";

const Course = () => {
  const { id } = useParams();
  const { t, dir, language } = useLanguage();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsLoggedIn(!!user);
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        setIsAdmin(profile?.role === 'admin');
      }
    };
    checkAuth();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsLoggedIn(!!session);
      if (session?.user) {
        setIsAdmin(session.user.user_metadata?.role === 'admin');
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const { data: course, isLoading, error } = useQuery({
    queryKey: ['course', id],
    queryFn: async () => {
      if (!id) throw new Error('Course ID is required');
      const { data, error } = await supabase
        .from('courses')
        .select(`
          *,
          institutions(id, name_he, name_en, color, type),
          course_groups(whatsapp_link, discord_link)
        `)
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-indigo-100" dir={dir}>
        <Header />
        <div className="container mx-auto px-4 py-16 flex flex-col items-center">
          <div className="animate-spin rounded-full h-14 w-14 border-b-2 border-blue-600 mb-8"></div>
          <h1 className="text-2xl font-bold text-gray-900">{t('course.loading')}</h1>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50" dir={dir}>
        <Header />
        <div className="container mx-auto px-4 py-16 flex flex-col items-center">
          <div className="bg-red-100 rounded-full p-6 w-24 h-24 mb-6 flex items-center justify-center">
            <BookOpen className="w-12 h-12 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('course.not_found')}</h1>
          <p className="text-gray-600">{t('course.not_found_description')}</p>
        </div>
        <Footer />
      </div>
    );
  }

  // עזר לוקליזציה לשם מוסד וקורס
  const getCourseName = () =>
    language === 'en' && course.name_en ? course.name_en : course.name_he;
  const getInstitutionName = () =>
    language === 'en' && course.institutions?.name_en ? course.institutions.name_en : course.institutions?.name_he;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-indigo-100" dir={dir}>
      <Header />
      <CourseNavigationSidebar />
      <div className="container mx-auto px-2 sm:px-4 py-6 sm:py-8 space-y-5 sm:space-y-7 md:space-y-10">
        {/* Header */}
        <Card id="course-header" className={`${gradientBox} rounded-2xl sm:rounded-3xl mb-0`}>
          <CardContent className="p-3 sm:p-5 md:p-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 sm:gap-6">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-5">
                  <div className="bg-white/30 p-3 sm:p-4 rounded-full">
                    <BookOpen className="w-8 h-8 text-white" />
                  </div>
                  {course.institutions &&
                    <Badge className={pill} style={{ backgroundColor: course.institutions.color || '#3b82f6', color: 'white' }}>
                      {t(`institution.types.${course.institutions.type || 'university'}`)}
                    </Badge>
                  }
                </div>
                <h1 className={mainText}>{getCourseName()}</h1>
                {/* Subtitle באנגלית או תיאור נוסף */}
                {language === 'he' && course.name_en && <p className={subtitleText}>{course.name_en}</p>}
                {language === 'en' && course.name_he && <p className={subtitleText}>{course.name_he}</p>}
                <p className="text-base sm:text-lg text-blue-100 mb-2 sm:mb-4">{getInstitutionName()}</p>
                <div className="flex flex-wrap items-center gap-5 sm:gap-6 text-blue-100">
                  {course.code && (
                    <div className="flex items-center gap-2">
                      <Star className="w-5 h-5" />
                      <span className="font-medium">{t('course.code')}: {course.code}</span>
                    </div>
                  )}
                  {course.semester && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-5 h-5" />
                      <span>{course.semester}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-3 items-start sm:items-end pt-2 sm:pt-0">
                <SaveToAccountButton courseId={course.id} courseName={getCourseName()} />
                <div className="flex gap-2">
                  {course.course_groups?.[0]?.whatsapp_link && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button size="icon" className="bg-green-500 text-white rounded-full hover:bg-green-600"
                            onClick={() => window.open(course.course_groups[0].whatsapp_link, "_blank")}>
                            <MessageCircle className="w-5 h-5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>{t('course.whatsapp_group')}</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                  {course.course_groups?.[0]?.discord_link && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button size="icon" className="bg-purple-600 text-white rounded-full hover:bg-purple-700"
                            onClick={() => window.open(course.course_groups[0].discord_link, "_blank")}>
                            <Users className="w-5 h-5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>{t('course.discord_server')}</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Exam dates */}
        <div className={sectionBox}>
          <div className={sectionTitle}>{t('course.exam_dates')}</div>
          <ExamDatesSection courseId={course.id} examDate={course.exam_date} />
        </div>

        {/* Assignments */}
        <div className={compactSectionBox}>
          <div className={sectionTitle}>{t('course.assignments')}</div>
          <CourseAssignmentsSection courseId={course.id} courseName={getCourseName()} />
        </div>

        {/* Shared sessions */}
        <div id="shared-sessions" className={sectionBox}>
          <div className={sectionTitle}>{t('course.shared_sessions')}</div>
          <SharedSessionsSection courseId={course.id} isLoggedIn={isLoggedIn || isAdmin} />
        </div>

        {/* Study partners */}
        <div id="study-partners" className={sectionBox}>
          <div className={sectionTitle}>{t('course.study_partners')}</div>
          <StudyPartnersListSection courseId={course.id} isLoggedIn={isLoggedIn} />
        </div>

        {/* Tutors */}
        <div id="tutors-section" className={sectionBox}>
          <div className={sectionTitle}>{t('course.tutors')}</div>
          <RelevantTutors courseId={course.id} courseName={getCourseName()} />
        </div>

        {/* Reviews */}
        <div id="course-reviews" className={sectionBox}>
          <div className={sectionTitle}>{t('course.reviews')}</div>
          <CourseReviewsSection courseId={course.id} courseName={getCourseName()} isLoggedIn={isLoggedIn} />
        </div>

        {/* Lecturer Ratings */}
        <div className={sectionBox}>
          <div className={sectionTitle}>{t('course.lecturer_ratings')}</div>
          <EnhancedLecturerRatingsSection courseId={course.id} courseName={getCourseName()} />
        </div>

        {/* Marathon */}
        <div id="marathon-section" className={`${sectionBox} text-center text-lg font-semibold text-purple-700`}>
          {t('course.marathon_notice')}
        </div>

        {/* Coming soon */}
        <div className={sectionBox}>
          <ComingSoonSection isLoggedIn={isLoggedIn} />
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Course;
