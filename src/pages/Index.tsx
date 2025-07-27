import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/App';
import { usePublicInstitution, usePublicCourses } from '@/hooks/usePublicData';
import { BookOpen, Calendar, Users, Search, GraduationCap } from 'lucide-react';
import WelcomeBanner from '@/components/WelcomeBanner';
import { supabase } from '@/integrations/supabase/client';

const Index = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [shouldScroll, setShouldScroll] = useState(false);
  const [isTutor, setIsTutor] = useState(false);
  const coursesSectionRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  // --- Tutor check ---
  useEffect(() => {
    const checkTutor = async () => {
      if (user && user.id) {
        const { data, error } = await supabase
          .from('tutors')
          .select('id')
          .eq('id', user.id)
          .single();
        setIsTutor(!!data && !error);
      } else {
        setIsTutor(false);
      }
    };
    checkTutor();
  }, [user]);

  // Hooks to get university and courses data
  const { data: openUniversity, isLoading: isLoadingInstitution } = usePublicInstitution();
  const { data: courses = [], isLoading: isLoadingCourses } = usePublicCourses(openUniversity?.id);

  const isLoading = isLoadingInstitution || isLoadingCourses;

  // Filter courses
  const filteredCourses = courses.filter(course =>
    course.name_he.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.name_en?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // גלילה אוטומטית לקורסים אחרי חיפוש/אנטר
  useEffect(() => {
    if (shouldScroll && coursesSectionRef.current) {
      coursesSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setShouldScroll(false);
    }
  }, [shouldScroll]);

  // הפעלת גלילה כאשר יש שינוי בחיפוש
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    if (e.target.value.length > 0) setShouldScroll(true);
  };

  // קפיצה גם כאשר לוחצים אנטר
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') setShouldScroll(true);
  };

  const handleCourseClick = (courseId: string) => {
    navigate(`/course/${courseId}`);
  };

  // --- כפתור לאזור מורה ---
  const TutorDashboardButton = () =>
    isTutor ? (
      <div className="flex justify-center mt-8 mb-3">
        <Button
          className="flex gap-2 text-lg px-8 py-4 bg-gradient-to-r from-purple-700 to-blue-600 hover:from-purple-800 hover:to-blue-700 text-white font-bold shadow-2xl border-2 border-white/40 rounded-2xl animate-bounce
          dark:bg-gradient-to-r dark:from-pink-600 dark:to-purple-700 dark:hover:from-pink-500 dark:hover:to-purple-800 dark:shadow-pink-900/30"
          onClick={() => navigate('/tutor-dashboard')}
        >
          <GraduationCap className="w-6 h-6" />
          כניסה לאזור מורה
        </Button>
      </div>
    ) : null;

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden relative">
      {/* רקע ראשי יפהפה לא נוגע */}
      <div className="fixed inset-0 z-0 pointer-events-none select-none">
        <div
          className="absolute inset-0 animate-gradient-shift"
          style={{
            background: `
              linear-gradient(-45deg, 
                #667eea 0%, 
                #764ba2 25%, 
                #f093fb 50%, 
                #f5576c 75%, 
                #4facfe 100%
              )`,
            backgroundSize: '400% 400%',
            transition: 'background 1s'
          }}
        />
        {/* ... עננים, רשת, בועות – לא חובה אבל אפשר להוסיף ... */}
      </div>

      {/* Content */}
      <div className="relative z-10">
        <Header />
        {!user && <WelcomeBanner />}
        <main className="flex-1">
          {/* Hero Section */}
          <section className="py-20 bg-white/10 dark:bg-white/10 backdrop-blur-sm">
            <div className="container mx-auto px-4 text-center">
              <div className="hero-title-enhanced mb-8">
                <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 drop-shadow-lg">
                  קורסי האוניברסיטה הפתוחה
                </h1>
                <p className="text-xl text-white/90 max-w-3xl mx-auto leading-relaxed drop-shadow-md">
                  מצא קורסים, מועדי בחינות, קבוצות לימוד ושותפי למידה באוניברסיטה הפתוחה
                </p>
              </div>
              {/* Enhanced Search Bar */}
              <div className="max-w-2xl mx-auto mb-8">
                <div className="relative group">
                  <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-pink-200 w-5 h-5 group-focus-within:text-blue-500 transition-colors" />
                  <Input
                    type="text"
                    placeholder="חפש קורס לפי שם או מספר קורס..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    onKeyDown={handleSearchKeyDown}
                    className="
                      pl-4 pr-12 py-4 text-lg text-right border-2 border-white/20 focus:border-blue-400 
                      rounded-xl shadow-lg backdrop-blur-md bg-white/90 hover:bg-white/95 transition-all duration-300
                      dark:bg-[#23213a]/90 dark:backdrop-blur-xl dark:text-pink-100 dark:placeholder-pink-300
                      dark:border-pink-700 dark:focus:border-pink-400
                    "
                  />
                </div>
              </div>
              {isTutor && <TutorDashboardButton />}
            </div>
          </section>

          {/* Courses Section */}
          <section className="py-16 bg-white/95 backdrop-blur-sm dark:bg-[#251e35]/90 dark:backdrop-blur-2xl transition-all duration-500" ref={coursesSectionRef}>
            <div className="container mx-auto px-4">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-4 dark:text-pink-200 drop-shadow">
                  כל הקורסים ({filteredCourses.length})
                </h2>
                <p className="text-gray-600 dark:text-pink-200/80">
                  בחר קורס כדי לראות מועדי בחינות, קבוצות לימוד ושותפי למידה
                </p>
              </div>
              {isLoading ? (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4 dark:border-pink-900 dark:border-t-pink-400"></div>
                  <div className="text-xl text-gray-600 dark:text-pink-200">טוען קורסים...</div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {filteredCourses.map((course) => (
                    <Card 
                      key={course.id}
                      className={`
                        group transition-all duration-500 cursor-pointer hover:-translate-y-2 hover:scale-105
                        bg-white/95 backdrop-blur-md border-2 hover:border-blue-200 shadow-xl
                        dark:bg-gradient-to-br dark:from-[#292346]/90 dark:to-[#3b235a]/90 dark:backdrop-blur-2xl dark:border-pink-500/40
                        dark:shadow-[0_2px_32px_0_rgba(255,90,190,0.13)]
                        relative overflow-hidden
                      `}
                      onClick={() => handleCourseClick(course.id)}
                    >
                      {/* זוהר / Glass למעלה */}
                      <div className="absolute -top-10 right-0 w-1/2 h-20 bg-gradient-to-l from-pink-400/30 to-purple-700/0 blur-2xl dark:block hidden pointer-events-none"></div>
                      <CardHeader className="pb-4">
                        <div className="flex items-start justify-between mb-3">
                          <CardTitle className="
                            text-lg font-bold text-right flex-1 
                            group-hover:text-blue-600 dark:group-hover:text-pink-300
                            transition-colors duration-300 leading-tight 
                            dark:text-pink-100
                          ">
                            {course.name_he}
                          </CardTitle>
                          {course.code && (
                            <Badge 
                              variant="secondary"
                              className="
                                mr-3 bg-blue-100 text-blue-800 font-semibold
                                dark:bg-pink-500/30 dark:text-pink-100 dark:border dark:border-pink-400/40
                              "
                            >
                              {course.code}
                            </Badge>
                          )}
                        </div>
                        {course.name_en && (
                          <p className="text-sm text-gray-500 text-right dark:text-pink-200">
                            {course.name_en}
                          </p>
                        )}
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-4">
                          {course.semester && (
                            <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-pink-200">
                              <BookOpen className="w-4 h-4 dark:text-pink-300" />
                              <span>סמסטר: {course.semester}</span>
                            </div>
                          )}
                          {course.exam_date && (
                            <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-purple-200">
                              <Calendar className="w-4 h-4 dark:text-pink-300" />
                              <span>מועד בחינה: {new Date(course.exam_date).toLocaleDateString('he-IL')}</span>
                            </div>
                          )}
                          {course.enable_collaboration && (
                            <div className="flex items-center gap-3 text-sm text-green-600 dark:text-pink-400">
                              <Users className="w-4 h-4 dark:text-pink-400" />
                              <span>קבוצות ושיתוף פעולה זמינים</span>
                            </div>
                          )}
                        </div>
                        <Button
                          className="
                            w-full mt-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700
                            shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105
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
              {!isLoading && filteredCourses.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-xl text-gray-600 mb-4 dark:text-pink-200">
                    {searchTerm ? 'לא נמצאו קורסים המתאימים לחיפוש' : 'אין קורסים זמינים כרגע'}
                  </div>
                  {searchTerm && (
                    <Button onClick={() => setSearchTerm('')} variant="outline" className="shadow-lg dark:border-pink-400 dark:text-pink-200">
                      נקה חיפוש
                    </Button>
                  )}
                </div>
              )}
            </div>
          </section>
        </main>
        <Footer />
      </div>
      {/* אפקטים דינמיים נשארים אותו דבר */}
      <style>{`
        @keyframes gradient-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient-shift { animation: gradient-shift 8s ease infinite; }
        .hero-title-enhanced {
          background: rgba(255,255,255,0.12);
          backdrop-filter: blur(20px);
          padding: 2rem 3rem;
          border-radius: 2rem;
          border: 2px solid rgba(255,255,255,0.18);
          box-shadow: 0 20px 60px rgba(0,0,0,0.09);
        }
      `}</style>
    </div>
  );
};

export default Index;
