import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTutors } from '@/hooks/useTutors';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, ArrowLeft, Star, MapPin, Phone, BookOpen, Clock, DollarSign, Search } from 'lucide-react';
import TutorApplicationForm from '@/components/forms/TutorApplicationForm';

const defaultAvatar = "https://cdn-icons-png.flaticon.com/512/3135/3135789.png";

const Tutors = () => {
  const navigate = useNavigate();
  const { dir } = useLanguage();
  const { data: tutors = [], isLoading } = useTutors();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [showApplicationForm, setShowApplicationForm] = useState(false);

  // כל הקטגוריות האפשריות – לוקח מהקורסים של כל מורה
  const categories = useMemo(() => {
    const set = new Set<string>();
    tutors.forEach(tutor => {
      tutor.tutor_courses?.forEach(tc => {
        if (tc.course?.category) set.add(tc.course.category);
      });
    });
    return ['all', ...Array.from(set).sort((a, b) => a.localeCompare(b, 'he'))];
  }, [tutors]);

  // קורסים רלוונטיים לקטגוריה הנבחרת
  const coursesInCategory = useMemo(() => {
    let relevantCourses: { id: string; name_he: string }[] = [];
    tutors.forEach(tutor => {
      tutor.tutor_courses?.forEach(tc => {
        if (
          tc.course &&
          (selectedCategory === 'all' || tc.course.category === selectedCategory)
        ) {
          relevantCourses.push({
            id: tc.course.id,
            name_he: tc.course.name_he,
          });
        }
      });
    });
    // מסנן כפולים
    const unique = new Map<string, string>();
    relevantCourses.forEach(({ id, name_he }) => {
      if (!unique.has(id)) unique.set(id, name_he);
    });
    return Array.from(unique.entries()).map(([id, name_he]) => ({ id, name_he }))
      .sort((a, b) => a.name_he.localeCompare(b.name_he, 'he'));
  }, [tutors, selectedCategory]);

  // סינון ראשי – קודם לפי קטגוריה, אחר כך לפי קורס
  const filteredTutors = useMemo(() => {
    let result = tutors;
    if (selectedCategory !== 'all') {
      result = result.filter(tutor =>
        tutor.tutor_courses?.some(tc => tc.course?.category === selectedCategory)
      );
    }
    if (selectedCourse) {
      result = result.filter(tutor =>
        tutor.tutor_courses?.some(tc => tc.course?.id === selectedCourse)
      );
    }
    return result;
  }, [tutors, selectedCategory, selectedCourse]);

  return (
    <>
      <div className="min-h-screen relative overflow-hidden" dir={dir}
        style={{
          background: `
            linear-gradient(-45deg, #667eea, #764ba2, #f093fb, #f5576c, #4facfe, #00f2fe),
            linear-gradient(45deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1), rgba(240, 147, 251, 0.1))
          `,
          backgroundSize: '400% 400%, 100% 100%',
          animation: 'gradientShift 15s ease infinite'
        }}
      >
        {/* Header */}
        <div className="bg-white/90 backdrop-blur-md border-b relative z-10">
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
                <h1 className="text-4xl font-bold text-gray-900">
                  <span className="bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                    מורים פרטיים 👨‍🏫
                  </span>
                </h1>
              </div>
              <p className="text-xl text-gray-700 max-w-2xl mx-auto">
                מצאו את המורה הפרטי המושלם עבורכם - מומחים מנוסים בכל התחומים
              </p>
            </div>
          </div>
        </div>

        {/* --- סינון לפי קטגוריה --- */}
        <div className="container mx-auto px-4 py-8 relative z-10">
          <Card className="mb-4 bg-white/80 backdrop-blur-sm shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                קטגוריות / פקולטות
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {categories.map(category => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setSelectedCategory(category);
                      setSelectedCourse('');
                    }}
                    className="mb-2 transition-all duration-200 hover:scale-105"
                  >
                    {category === 'all' ? 'כל הקטגוריות' : category}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* --- סינון לפי קורס --- */}
          <Card className="mb-8 bg-white/90 backdrop-blur-sm shadow-md">
            <CardContent>
              <div className="flex flex-col md:flex-row gap-3 items-center">
                <Search className="w-5 h-5 text-blue-500" />
                <div className="flex flex-wrap gap-2 flex-1">
                  {coursesInCategory.map(course => (
                    <Badge
                      key={course.id}
                      variant={selectedCourse === course.id ? "default" : "outline"}
                      className={`cursor-pointer ${selectedCourse === course.id ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-800'}`}
                      onClick={() => setSelectedCourse(course.id)}
                    >
                      {course.name_he}
                    </Badge>
                  ))}
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-gray-500"
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

          {/* ---- תצוגת מורים ---- */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTutors.map((tutor, index) => (
              <Card
                key={tutor.id}
                className="hover:shadow-xl transition-all duration-300 bg-white/90 backdrop-blur-sm hover:-translate-y-2 hover:scale-105 border-2 hover:border-blue-200"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100 border flex items-center justify-center shadow">
                      <img
                        src={tutor.avatar_url ? tutor.avatar_url : defaultAvatar}
                        alt={tutor.name}
                        className="w-full h-full object-cover"
                        style={{objectPosition: "center"}}
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
                        {/* קטגוריות של המורה */}
                        {tutor.tutor_courses?.map((tc, i) =>
                          tc.course?.category ? (
                            <Badge key={i} variant="outline" className="text-xs bg-purple-100 text-purple-800">
                              {tc.course.category}
                            </Badge>
                          ) : null
                        )}
                      </div>
                    </div>
                  </div>

                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {tutor.description}
                  </p>

                  <div className="flex flex-wrap gap-1 mb-2">
                    {(tutor.tutor_courses || []).map((tc, i) =>
                      tc.course ? (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {tc.course.name_he}
                        </Badge>
                      ) : null
                    )}
                  </div>

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
            ))}
          </div>

          {filteredTutors.length === 0 && !isLoading && (
            <Card className="p-8 text-center bg-white/80 backdrop-blur-sm">
              <BookOpen className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold mb-2">אין מורים בקטגוריה או קורס זה</h3>
              <p className="text-gray-600">נסה לבחור קטגוריה או קורס אחר, או חזור מאוחר יותר</p>
            </Card>
          )}

          <Card className="mt-12 bg-gradient-to-r from-blue-500 to-purple-500 text-white overflow-hidden relative">
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
