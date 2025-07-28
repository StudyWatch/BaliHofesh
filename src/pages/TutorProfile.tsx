import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  ArrowRight, ArrowLeft, Star, MapPin, Phone, Mail, BookOpen,
  Clock, DollarSign, GraduationCap, Award, Tag
} from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

// בדיקת UUID פשוטה (למניעת טעינת מזהה שגוי של קורס או אחר)
function isUUID(str: string | undefined) {
  return typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(str);
}

const TutorProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { dir } = useLanguage();

  // אם ה־id לא מזהה תקין (UUID), אל תנסה בכלל לטעון פרופיל מורה
  if (!isUUID(id)) {
    return (
      <div dir={dir} className="min-h-screen flex flex-col bg-gradient-to-br from-blue-100 via-white to-indigo-100">
        <Header />
        <div className="container mx-auto px-4 py-24 text-center">
          <div className="bg-red-200 rounded-full p-6 w-24 h-24 mb-6 flex items-center justify-center mx-auto">
            <GraduationCap className="w-12 h-12 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">שגיאה: מזהה מורה לא תקין</h1>
          <p className="text-gray-600">הגעת לעמוד שאינו קיים או למזהה שגוי.</p>
          <Button onClick={() => navigate('/tutors')} className="mt-8">
            חזור לכל המורים
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  // טוען את המורה לפי id
  const { data: tutor, isLoading, error } = useQuery({
    queryKey: ['tutor', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tutors')
        .select('*')
        .eq('id', id)
        .single();
      if (error || !data) throw error || new Error('מורה לא נמצא');
      return data;
    },
    enabled: !!id
  });

  // טוען קורסים של המורה דרך קשרי tutor_courses
  const { data: courses, isLoading: isCoursesLoading } = useQuery({
    queryKey: ['tutor-courses', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tutor_courses')
        .select(`
          id,
          course: courses (
            id,
            name_he,
            category
          )
        `)
        .eq('tutor_id', id);
      if (error) throw error;
      return (data || []).filter(tc => tc.course && tc.course.id);
    },
    enabled: !!id && !!tutor
  });

  // עיצוב תצוגת טעינה / שגיאה
  if (isLoading || isCoursesLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-indigo-100" dir={dir}>
        <Header />
        <div className="container mx-auto px-4 py-16 flex flex-col items-center">
          <div className="animate-spin rounded-full h-14 w-14 border-b-2 border-blue-600 mb-8"></div>
          <h1 className="text-2xl font-bold text-gray-900">טוען פרופיל מורה...</h1>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !tutor) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50" dir={dir}>
        <Header />
        <div className="container mx-auto px-4 py-16 flex flex-col items-center">
          <div className="bg-red-100 rounded-full p-6 w-24 h-24 mb-6 flex items-center justify-center">
            <GraduationCap className="w-12 h-12 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">מורה לא נמצא</h1>
          <p className="text-gray-600">המורה שביקשת לא קיים במערכת</p>
          <Button onClick={() => navigate('/tutors')} className="mt-8">
            חזור לכל המורים
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  // --- דף פרופיל מורה ---
  const hasPhone = tutor?.phone && tutor.phone.length > 6;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-indigo-100" dir={dir}>
      <Header />
      <div className="container mx-auto px-4 py-10">
        {/* Back Button */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/tutors')}
            className="flex items-center gap-2"
          >
            {dir === 'rtl' ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
            חזור למורים פרטיים
          </Button>
        </div>

        {/* Main Profile Card */}
        <Card className="mb-8 bg-gradient-to-l from-blue-600 via-indigo-700 to-purple-600 shadow-2xl rounded-3xl">
          <CardContent className="p-8">
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Profile Info */}
              <div className="flex-1">
                <div className="flex items-center gap-5 mb-6">
                  <Avatar className="w-24 h-24 border-4 border-white/30 shadow-md">
                    <AvatarImage src={tutor.avatar_url || undefined} alt={tutor.name} />
                    <AvatarFallback className="text-3xl bg-white/40">
                      {tutor.name?.charAt(0).toUpperCase() || 'מ'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h1 className="text-4xl font-bold text-white">{tutor.name}</h1>
                    <div className="flex items-center gap-3 mt-2">
                      {tutor.is_verified && (
                        <Badge className="bg-green-500 text-white">
                          <Award className="w-3 h-3 mr-1" />
                          מאומת
                        </Badge>
                      )}
                      {tutor.is_online && (
                        <div className="flex items-center gap-1 text-white">
                          <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
                          <span className="text-sm">זמין כעת</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-6 text-white">
                  <div className="flex items-center gap-3">
                    <Star className="w-5 h-5 text-yellow-300" />
                    <span className="text-lg font-semibold">{tutor.rating || 5}</span>
                    <span className="opacity-90">({tutor.reviews_count || 0} ביקורות)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <DollarSign className="w-5 h-5" />
                    <span className="text-lg font-semibold">₪{tutor.hourly_rate} לשעה</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5" />
                    <span>{tutor.location}</span>
                  </div>
                  {tutor.availability && (
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5" />
                      <span>{tutor.availability}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Contact Actions */}
              <div className="flex flex-col gap-3 lg:min-w-[200px]">
                {hasPhone && (
                  <Button
                    size="lg"
                    className="bg-white text-blue-600 hover:bg-gray-100"
                    onClick={() => window.open(`tel:${tutor.phone}`)}
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    התקשר עכשיו
                  </Button>
                )}
                {tutor.email && (
                  <Button
                    variant="outline"
                    size="lg"
                    className="bg-white/10 border-white text-white hover:bg-white/20"
                    onClick={() => window.open(`mailto:${tutor.email}`)}
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    שלח מייל
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Courses */}
          <div className="lg:col-span-2">
            <Card className="bg-gradient-to-br from-white to-blue-50/70 shadow-lg border-2 border-blue-100 rounded-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-700 text-2xl font-bold">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                  קורסים שמלמד
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!courses || courses.length === 0 ? (
                  <div className="text-gray-500 py-6 text-center">אין קורסים להצגה</div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-4">
                    {courses.map((tc) => (
                      <div
                        key={tc.course.id}
                        className="flex flex-col gap-2 border rounded-xl bg-gradient-to-tr from-blue-50 via-white to-indigo-50 shadow hover:shadow-xl p-5 transition-all duration-150 hover:border-blue-400"
                      >
                        <div className="flex items-center gap-3">
                          <BookOpen className="w-6 h-6 text-blue-500" />
                          <h3 className="font-semibold text-xl text-gray-900">{tc.course.name_he}</h3>
                        </div>
                        {tc.course.category && (
                          <div className="flex items-center gap-1 mt-1">
                            <Tag className="w-4 h-4 text-blue-400" />
                            <span className="text-xs text-blue-500 bg-blue-100 px-2 py-0.5 rounded">
                              {tc.course.category}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* About / Experience */}
          <div className="space-y-6">
            {tutor.description && (
              <Card className="bg-white/80 backdrop-blur-sm shadow-lg">
                <CardHeader>
                  <CardTitle>על המורה</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 leading-relaxed">{tutor.description}</p>
                </CardContent>
              </Card>
            )}

            {tutor.experience && (
              <Card className="bg-white/80 backdrop-blur-sm shadow-lg">
                <CardHeader>
                  <CardTitle>ניסיון והכשרה</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 leading-relaxed">{tutor.experience}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default TutorProfile;
