import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTutors } from '@/hooks/useTutors';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ArrowRight, ArrowLeft, Star, MapPin, Phone, BookOpen,
  Clock, DollarSign, Search, Sparkles
} from 'lucide-react';
import TutorApplicationForm from '@/components/forms/TutorApplicationForm';

const defaultAvatar = "https://cdn-icons-png.flaticon.com/512/3135/3135789.png";

// טיפוס קורס
type CourseType = { id: string; name_he: string; category?: string };

// אוסף קורסים מכל המורים להצגה
function extractAllCourses(tutors: any[]): CourseType[] {
  const allCourses: CourseType[] = [];
  tutors.forEach((tutor) => {
    // tutor_courses
    if (Array.isArray(tutor.tutor_courses)) {
      tutor.tutor_courses.forEach((tc: any) => {
        if (tc.course && tc.course.id && tc.course.name_he) {
          allCourses.push({
            id: String(tc.course.id),
            name_he: String(tc.course.name_he),
            category: tc.course.category ? String(tc.course.category) : '',
          });
        }
      });
    }
    // subjects (טקסט)
    if (Array.isArray(tutor.subjects)) {
      tutor.subjects.forEach((subject: string) => {
        const codeMatch = subject.match(/\(([^)]+)\)/);
        const name_he = subject.replace(/ \([^)]+\)/, '').replace(/ - ציון: \d+/, '');
        allCourses.push({
          id: codeMatch ? String(codeMatch[1]) : name_he,
          name_he: name_he,
          category: '',
        });
      });
    }
  });
  // סינון כפולים
  const unique = new Map<string, CourseType>();
  allCourses.forEach(course => {
    if (course.id && !unique.has(course.id)) unique.set(course.id, course);
  });
  return Array.from(unique.values()).sort((a, b) => a.name_he.localeCompare(b.name_he, 'he'));
}

const Tutors = () => {
  const navigate = useNavigate();
  const { dir } = useLanguage();
  const { data: tutors = [], isLoading } = useTutors();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [showApplicationForm, setShowApplicationForm] = useState(false);

  // כל הקורסים מכל המורים
  const allCourses = useMemo<CourseType[]>(() => extractAllCourses(tutors), [tutors]);
  // קטגוריות מתוך כל הקורסים
  const categories = useMemo<string[]>(() => {
    const set = new Set<string>();
    allCourses.forEach(course => {
      if (course.category && course.category.length > 0) set.add(course.category);
    });
    return ['all', ...Array.from(set).sort((a, b) => a.localeCompare(b, 'he'))];
  }, [allCourses]);

  // קורסים רלוונטיים לקטגוריה
  const coursesInCategory = useMemo<CourseType[]>(() => {
    return selectedCategory === 'all'
      ? allCourses
      : allCourses.filter(course => course.category === selectedCategory);
  }, [allCourses, selectedCategory]);

  // מורים מסוננים
  const filteredTutors = useMemo(() => {
    return tutors.filter((tutor: any) => {
      let hasCategory = selectedCategory === 'all';
      let hasCourse = !selectedCourse;
      // tutor_courses
      if (Array.isArray(tutor.tutor_courses)) {
        if (selectedCategory !== 'all') {
          hasCategory = tutor.tutor_courses.some((tc: any) => tc.course?.category === selectedCategory);
        }
        if (selectedCourse) {
          hasCourse = tutor.tutor_courses.some((tc: any) =>
            String(tc.course?.id) === selectedCourse ||
            String(tc.course?.code) === selectedCourse
          );
        }
      }
      // subjects (טקסט)
      if (Array.isArray(tutor.subjects)) {
        if (selectedCourse && !hasCourse) {
          hasCourse = tutor.subjects.some((subj: string) => {
            const codeMatch = subj.match(/\(([^)]+)\)/);
            const id = codeMatch ? String(codeMatch[1]) : subj.replace(/ \([^)]+\)/, '').replace(/ - ציון: \d+/, '');
            return id === selectedCourse;
          });
        }
      }
      return hasCategory && hasCourse;
    });
  }, [tutors, selectedCategory, selectedCourse]);

  // -- ✨ ריבוע הצטרפות למורים --
  const JoinSquare = () => (
    <Card
      className="min-h-[200px] flex flex-col items-center justify-center relative bg-white/80 backdrop-blur border border-blue-100 shadow-md hover:shadow-xl hover:border-blue-300 transition-all duration-200 group"
      style={{ animationDelay: "0ms" }}
    >
      <CardContent className="flex flex-col items-center justify-center py-8 px-6 relative z-10">
        <div className="flex items-center gap-3 mb-2">
          <Sparkles className="w-7 h-7 text-blue-400 group-hover:rotate-6 transition" />
          <h3 className="text-xl md:text-2xl font-bold text-blue-700 tracking-tight text-center">
            המקום הזה שמור בשבילך!
          </h3>
        </div>
        <p className="text-gray-700 text-base md:text-lg mb-5 text-center max-w-xs">
          למדת קורס והצטיינת?  
          זה הזמן להצטרף לצוות המורים שלנו ולעזור לעוד סטודנטים להצליח!
        </p>
        <Button
          size="lg"
          className="bg-blue-600 text-white px-8 rounded-xl shadow hover:bg-blue-700 transition font-bold flex items-center gap-2"
          onClick={() => setShowApplicationForm(true)}
        >
          <BookOpen className="w-5 h-5" />
          הגש מועמדות כמורה
        </Button>
      </CardContent>
      {/* אייקון דקורטיבי רקע */}
      <div className="absolute -left-4 -top-4 opacity-20 blur-[2px]">
        <Sparkles className="w-16 h-16 text-blue-200" />
      </div>
    </Card>
  );

  return (
    <>
      <div
        className="min-h-screen relative overflow-x-hidden"
        dir={dir}
        style={{
          background: `
            linear-gradient(-45deg, #667eea, #764ba2, #f093fb, #f5576c, #4facfe, #00f2fe),
            linear-gradient(45deg, rgba(102, 126, 234, 0.10), rgba(118, 75, 162, 0.10), rgba(240, 147, 251, 0.07))
          `,
          backgroundSize: '400% 400%, 100% 100%',
          animation: 'gradientShift 15s ease infinite'
        }}
      >
        {/* Header */}
        <div className="bg-white/90 backdrop-blur-md border-b shadow z-20">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center gap-4 mb-4">
              <Button variant="ghost" onClick={() => navigate('/')} className="flex items-center gap-2">
                {dir === 'rtl' ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
                חזור לדף הבית
              </Button>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-3 mb-4">
                <BookOpen className="w-8 h-8 text-blue-600" />
                <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight">
                  <span className="bg-gradient-to-r from-blue-600 to-green-400 bg-clip-text text-transparent">
                    מורים פרטיים 👨‍🏫
                  </span>
                </h1>
              </div>
              <p className="text-xl md:text-2xl text-gray-700 max-w-2xl mx-auto font-medium">
                מצאו את המורה הפרטי המושלם עבורכם, או הצטרפו להצלחה!
              </p>
            </div>
          </div>
        </div>

        {/* --- סינון לפי קטגוריה --- */}
        <div className="container mx-auto px-4 py-8 relative z-10">
          <Card className="mb-4 bg-white/85 backdrop-blur-sm shadow-lg rounded-2xl border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                קטגוריות / פקולטות
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {categories.map((category) => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setSelectedCategory(category);
                      setSelectedCourse('');
                    }}
                    className="mb-2 transition-all duration-200 hover:scale-105 font-semibold rounded-xl"
                  >
                    {category === 'all' ? 'כל הקטגוריות' : category}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* --- סינון לפי קורס --- */}
          <Card className="mb-8 bg-white/95 backdrop-blur-sm shadow-md rounded-2xl border-0">
            <CardContent>
              <div className="flex flex-col md:flex-row gap-3 items-center">
                <Search className="w-5 h-5 text-blue-500" />
                <div className="flex flex-wrap gap-2 flex-1">
                  {coursesInCategory.map((course) => (
                    <Badge
                      key={course.id}
                      variant={selectedCourse === course.id ? "default" : "outline"}
                      className={`cursor-pointer font-bold ${selectedCourse === course.id ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-800'}`}
                      onClick={() => setSelectedCourse(course.id)}
                    >
                      {course.name_he}
                    </Badge>
                  ))}
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-gray-500 font-medium"
                  onClick={() => setSelectedCourse('')}
                >
                  איפוס סינון קורס
                </Button>
              </div>
            </CardContent>
          </Card>

          {isLoading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">טוען מורים...</p>
            </div>
          )}

          {/* ---- גריד מורים ---- */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-7">
            <JoinSquare />
            {filteredTutors.map((tutor: any, index: number) => {
              let displayCourses: string[] = [];
              if (Array.isArray(tutor.tutor_courses) && tutor.tutor_courses.length > 0) {
                displayCourses = tutor.tutor_courses
                  .map((tc: any) => tc.course?.name_he)
                  .filter((x: string | undefined): x is string => !!x);
              } else if (Array.isArray(tutor.subjects) && tutor.subjects.length > 0) {
                displayCourses = tutor.subjects.map((subj: string) =>
                  subj.replace(/ \([^)]+\)/, '').replace(/ - ציון: \d+/, '')
                );
              }
              return (
                <Card
                  key={tutor.id}
                  className="hover:shadow-2xl transition-all duration-300 bg-white/95 backdrop-blur-sm hover:-translate-y-2 hover:scale-105 border-2 border-blue-50 rounded-2xl"
                  style={{ animationDelay: `${(index + 1) * 100}ms` }}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100 border flex items-center justify-center shadow">
                        <img
                          src={tutor.avatar_url ? tutor.avatar_url : defaultAvatar}
                          alt={tutor.name}
                          className="w-full h-full object-cover"
                          style={{ objectPosition: "center" }}
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-lg text-gray-900">{tutor.name}</h3>
                          {tutor.is_verified && (
                            <Badge className="bg-green-500 text-white text-xs">
                              מאומת
                            </Badge>
                          )}
                          {tutor.is_online && (
                            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" title="זמין כעת" />
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-500 fill-current" />
                          <span className="font-semibold">{tutor.rating}</span>
                          <span className="text-gray-600 text-sm">({tutor.reviews_count} ביקורות)</span>
                        </div>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {displayCourses.map((cname, i) =>
                            <Badge key={i} variant="secondary" className="text-xs">
                              {cname}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {tutor.description}
                    </p>
                    <div className="space-y-2 mb-4 text-sm">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-500" />
                        <span>{tutor.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-gray-500" />
                        <span>₪{tutor.hourly_rate} לשעה</span>
                      </div>
                      {tutor.availability && (
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-500" />
                          <span>{tutor.availability}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => navigate(`/tutor/${tutor.id}`)}
                        variant="outline"
                        className="flex-1"
                      >
                        <BookOpen className="w-4 h-4 mr-2" />
                        פרופיל
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1 bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600"
                        onClick={() => window.open(`tel:${tutor.phone || ''}`)}
                      >
                        <Phone className="w-4 h-4 mr-2" />
                        צור קשר
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {filteredTutors.length === 0 && !isLoading && (
            <Card className="p-8 text-center bg-white/80 backdrop-blur-sm mt-8 rounded-2xl shadow">
              <BookOpen className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold mb-2">אין מורים בקטגוריה או קורס זה</h3>
              <p className="text-gray-600">נסה לבחור קטגוריה או קורס אחר, או חזור מאוחר יותר</p>
            </Card>
          )}

          {/* כרטיס קריאה להצטרפות נוסף לסוף הדף */}
          <Card className="mt-12 bg-gradient-to-r from-blue-500 to-purple-500 text-white overflow-hidden relative rounded-2xl shadow-xl">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20"></div>
            <CardContent className="p-8 text-center relative z-10">
              <h2 className="text-2xl font-bold mb-4">רוצה להצטרף אלינו?</h2>
              <p className="text-lg mb-6 opacity-90">
                הצטרף לקהילת המורים שלנו ועזור לסטודנטים להצליח
              </p>
              <Button
                size="lg"
                variant="secondary"
                className="bg-white text-blue-600 hover:bg-gray-100"
                onClick={() => setShowApplicationForm(true)}
              >
                הגש מועמדות
              </Button>
            </CardContent>
          </Card>
        </div>

        <style>{`
          @keyframes gradientShift {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
        `}</style>
      </div>

      <TutorApplicationForm
        isOpen={showApplicationForm}
        onClose={() => setShowApplicationForm(false)}
      />
    </>
  );
};

export default Tutors;
