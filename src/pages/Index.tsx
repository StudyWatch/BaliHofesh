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
  const { user, loading } = useAuth();

  // --- Tutor check ---
  useEffect(() => {
    const checkTutor = async () => {
      if (user && user.id) {
        // בדוק אם קיים בטבלת tutors
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
    if (e.key === 'Enter') {
      setShouldScroll(true);
    }
  };

  const handleCourseClick = (courseId: string) => {
    navigate(`/course/${courseId}`);
  };

  // --- כפתור לאזור מורה ---
  const TutorDashboardButton = () =>
    isTutor ? (
      <div className="flex justify-center mt-8 mb-3">
        <Button
          className="flex gap-2 text-lg px-8 py-4 bg-gradient-to-r from-purple-700 to-blue-600 hover:from-purple-800 hover:to-blue-700 text-white font-bold shadow-2xl border-2 border-white/40 rounded-2xl animate-bounce"
          onClick={() => navigate('/tutor-dashboard')}
        >
          <GraduationCap className="w-6 h-6" />
          כניסה לאזור מורה
        </Button>
      </div>
    ) : null;

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden relative">
      {/* Enhanced Dynamic Animated Background */}
      <div className="fixed inset-0 z-0">
        {/* ... כל הרקעים בדיוק כמו בקוד שלך ... */}
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
              )
            `,
            backgroundSize: '400% 400%'
          }}
        ></div>
        <div 
          className="absolute inset-0 opacity-30 animate-mesh-float"
          style={{
            background: `
              radial-gradient(circle at 20% 50%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
              radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.3) 0%, transparent 50%),
              radial-gradient(circle at 40% 80%, rgba(79, 172, 254, 0.3) 0%, transparent 50%)
            `,
            backgroundSize: '100% 100%'
          }}
        ></div>
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-2 h-2 bg-white/40 rounded-full animate-float-1"></div>
          <div className="absolute top-20 right-20 w-3 h-3 bg-blue-300/40 rounded-full animate-float-2"></div>
          <div className="absolute bottom-32 left-16 w-4 h-4 bg-purple-300/40 rounded-full animate-float-3"></div>
          <div className="absolute bottom-20 right-32 w-2 h-2 bg-pink-300/40 rounded-full animate-float-4"></div>
          <div className="absolute top-1/2 left-1/4 w-6 h-6 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full animate-pulse-slow"></div>
          <div className="absolute top-1/3 right-1/3 w-8 h-8 bg-gradient-to-r from-pink-400/20 to-blue-400/20 rounded-full animate-pulse-slower"></div>
        </div>
        <div className="absolute inset-0 opacity-10">
          <div 
            className="w-full h-full"
            style={{
              backgroundImage: `
                linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)
              `,
              backgroundSize: '50px 50px'
            }}
          ></div>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        <Header />
        {/* באנר הרשמה ייחודי */}
        {!user && <WelcomeBanner />}
        <main className="flex-1">
          {/* Hero Section */}
          <section className="py-20 bg-white/10 backdrop-blur-sm">
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
                  <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-blue-500 transition-colors" />
                  <Input
                    type="text"
                    placeholder="חפש קורס לפי שם או מספר קורס..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    onKeyDown={handleSearchKeyDown}
                    className="pl-4 pr-12 py-4 text-lg text-right border-2 border-white/20 focus:border-white/40 rounded-xl shadow-lg backdrop-blur-md bg-white/90 hover:bg-white/95 transition-all duration-300"
                  />
                </div>
              </div>

              {/* כפתור אזור מורה */}
              {isTutor && <TutorDashboardButton />}
            </div>
          </section>

          {/* Courses Section */}
          <section className="py-16 bg-white/95 backdrop-blur-sm" ref={coursesSectionRef}>
            <div className="container mx-auto px-4">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  כל הקורסים ({filteredCourses.length})
                </h2>
                <p className="text-gray-600">
                  בחר קורס כדי לראות מועדי בחינות, קבוצות לימוד ושותפי למידה
                </p>
              </div>

              {isLoading ? (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                  <div className="text-xl text-gray-600">טוען קורסים...</div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {filteredCourses.map((course) => (
                    <Card 
                      key={course.id}
                      className="group hover:shadow-2xl transition-all duration-500 border-2 hover:border-blue-200 cursor-pointer hover:-translate-y-2 hover:scale-105 bg-white/95 backdrop-blur-sm"
                      onClick={() => handleCourseClick(course.id)}
                    >
                      <CardHeader className="pb-4">
                        <div className="flex items-start justify-between mb-3">
                          <CardTitle className="text-lg font-bold text-right flex-1 group-hover:text-blue-600 transition-colors duration-300 leading-tight">
                            {course.name_he}
                          </CardTitle>
                          {course.code && (
                            <Badge variant="secondary" className="mr-3 bg-blue-100 text-blue-800 font-semibold">
                              {course.code}
                            </Badge>
                          )}
                        </div>
                        {course.name_en && (
                          <p className="text-sm text-gray-500 text-right">
                            {course.name_en}
                          </p>
                        )}
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-4">
                          {course.semester && (
                            <div className="flex items-center gap-3 text-sm text-gray-600">
                              <BookOpen className="w-4 h-4" />
                              <span>סמסטר: {course.semester}</span>
                            </div>
                          )}
                          {course.exam_date && (
                            <div className="flex items-center gap-3 text-sm text-gray-600">
                              <Calendar className="w-4 h-4" />
                              <span>מועד בחינה: {new Date(course.exam_date).toLocaleDateString('he-IL')}</span>
                            </div>
                          )}
                          {course.enable_collaboration && (
                            <div className="flex items-center gap-3 text-sm text-green-600">
                              <Users className="w-4 h-4" />
                              <span>קבוצות ושיתוף פעולה זמינים</span>
                            </div>
                          )}
                        </div>
                        <Button
                          className="w-full mt-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
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
                  <div className="text-xl text-gray-600 mb-4">
                    {searchTerm ? 'לא נמצאו קורסים המתאימים לחיפוש' : 'אין קורסים זמינים כרגע'}
                  </div>
                  {searchTerm && (
                    <Button onClick={() => setSearchTerm('')} variant="outline" className="shadow-lg">
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

      <style>{`
        @keyframes gradient-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes mesh-float {
          0%, 100% { transform: translateX(0px) translateY(0px); }
          33% { transform: translateX(-20px) translateY(-10px); }
          66% { transform: translateX(20px) translateY(10px); }
        }
        @keyframes float-1 {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          50% { transform: translateY(-20px) translateX(10px); }
        }
        @keyframes float-2 {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          50% { transform: translateY(-15px) translateX(-5px); }
        }
        @keyframes float-3 {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          50% { transform: translateY(-25px) translateX(15px); }
        }
        @keyframes float-4 {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          50% { transform: translateY(-18px) translateX(-8px); }
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        @keyframes pulse-slower {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.1); }
        }
        .animate-gradient-shift {
          animation: gradient-shift 8s ease infinite;
        }
        .animate-mesh-float {
          animation: mesh-float 12s ease-in-out infinite;
        }
        .animate-float-1 {
          animation: float-1 6s ease-in-out infinite;
        }
        .animate-float-2 {
          animation: float-2 8s ease-in-out infinite;
          animation-delay: 1s;
        }
        .animate-float-3 {
          animation: float-3 7s ease-in-out infinite;
          animation-delay: 2s;
        }
        .animate-float-4 {
          animation: float-4 9s ease-in-out infinite;
          animation-delay: 3s;
        }
        .animate-pulse-slow {
          animation: pulse-slow 4s ease-in-out infinite;
        }
        .animate-pulse-slower {
          animation: pulse-slower 6s ease-in-out infinite;
          animation-delay: 1s;
        }
        .hero-title-enhanced {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(20px);
          padding: 2rem 3rem;
          border-radius: 2rem;
          border: 2px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
        }
      `}</style>
    </div>
  );
};

export default Index;
