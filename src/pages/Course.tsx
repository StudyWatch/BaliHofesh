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

// עיצוב סקשן רגיל
const sectionBox = "rounded-2xl shadow-lg bg-white/80 dark:bg-gray-900/80 border border-gray-200 p-5 lg:p-8";
// עיצוב קומפקטי במיוחד לסקשן המטלות
const compactSectionBox = "rounded-xl shadow bg-white/80 dark:bg-gray-900/80 border border-gray-200 p-2";

const gradientBox = "bg-gradient-to-l from-blue-600 via-indigo-700 to-purple-600 shadow-2xl";
const mainText = "text-3xl lg:text-4xl font-bold leading-tight drop-shadow";
const subtitleText = "text-xl text-blue-100 mb-4 font-medium";
const pill = "rounded-full px-4 py-2 text-sm font-semibold shadow";

const Course = () => {
  const { id } = useParams();
  const { t, dir } = useLanguage();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // בדיקת התחברות וסטטוס אדמין
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
        setIsAdmin(session.user.user_metadata.role === 'admin');
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // טעינת פרטי הקורס
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
          <h1 className="text-2xl font-bold text-gray-900">טוען את פרטי הקורס...</h1>
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
          <h1 className="text-2xl font-bold text-gray-900 mb-2">קורס לא נמצא</h1>
          <p className="text-gray-600">הקורס שביקשת לא קיים במערכת</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-indigo-100" dir={dir}>
      <Header />
      <div className="container mx-auto px-2 md:px-4 py-8 md:py-10 space-y-7 md:space-y-10">
        {/* כותרת קורס עליונה */}
        <Card className={`${gradientBox} rounded-3xl mb-0`}>
          <CardContent className="p-5 md:p-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-5">
                  <div className="bg-white/30 p-4 rounded-full">
                    <BookOpen className="w-8 h-8 text-white" />
                  </div>
                  <Badge className={pill} style={{ backgroundColor: course.institutions?.color || '#3b82f6', color: 'white' }}>
                    {course.institutions?.type || 'אוניברסיטה'}
                  </Badge>
                </div>
                <h1 className={mainText}>{course.name_he}</h1>
                {course.name_en && <p className={subtitleText}>{course.name_en}</p>}
                <p className="text-lg text-blue-100 mb-4">{course.institutions?.name_he}</p>
                <div className="flex flex-wrap items-center gap-6 text-blue-100">
                  {course.code && (
                    <div className="flex items-center gap-2">
                      <Star className="w-5 h-5" />
                      <span className="font-medium">קוד: {course.code}</span>
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
              {/* כפתור שמירה וקבוצות */}
              <div className="flex flex-col gap-3">
                <SaveToAccountButton courseId={course.id} courseName={course.name_he} />
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
                        <TooltipContent>
                          קבוצת WhatsApp של הקורס
                        </TooltipContent>
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
                        <TooltipContent>
                          שרת Discord של הקורס
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* מועדי בחינות */}
        <div className={sectionBox}>
          <ExamDatesSection courseId={course.id} examDate={course.exam_date} />
        </div>

        {/* מטלות הגשה - עיצוב קומפקטי */}
        <div className={compactSectionBox}>
          <CourseAssignmentsSection courseId={course.id} courseName={course.name_he} compact />
        </div>

        {/* מפגשי לימוד משותפים */}
        <div className={sectionBox}>
          <SharedSessionsSection courseId={course.id} isLoggedIn={isLoggedIn || isAdmin} />
        </div>

        {/* שותפי לימוד */}
        <div className={sectionBox}>
          <StudyPartnersListSection courseId={course.id} isLoggedIn={isLoggedIn} />
        </div>

        {/* מורים פרטיים */}
        <div className={sectionBox}>
          <RelevantTutors
            courseId={course.id}
            courseName={course.name_he}
          />
        </div>

        {/* מרתון */}
        <div className={`${sectionBox} text-center text-lg font-semibold text-purple-700`}>
          📣 מרתונים ייפתחו לקראת הבחינות – נעדכן בהמשך!
        </div>

        {/* בקרוב */}
        <div className={sectionBox}>
          <ComingSoonSection isLoggedIn={isLoggedIn} />
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Course;
