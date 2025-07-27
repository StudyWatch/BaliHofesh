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
  Clock, DollarSign, GraduationCap, Award
} from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const TutorProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { dir } = useLanguage();

  const { data: tutor, isLoading, error } = useQuery({
    queryKey: ['tutor', id],
    queryFn: async () => {
      if (!id) throw new Error('Tutor ID is required');
      const { data, error } = await supabase
        .from('tutors')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id
  });

  // Parse subjects to extract course information
  const parseCourses = (subjects: string[]) => {
    return subjects.map(subject => {
      const gradeMatch = subject.match(/- ציון: (\d+)/);
      const codeMatch = subject.match(/\(([^)]+)\)/);
      const courseName = subject.replace(/ \([^)]+\)/, '').replace(/ - ציון: \d+/, '');
      return {
        name: courseName,
        code: codeMatch ? codeMatch[1] : null,
        grade: gradeMatch ? parseInt(gradeMatch[1]) : null
      };
    });
  };

  if (isLoading) {
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
        </div>
        <Footer />
      </div>
    );
  }

  const courses = parseCourses(tutor.subjects || []);
  const hasPhone = tutor.phone && tutor.phone.length > 6;

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
            <Card className="bg-white/80 backdrop-blur-sm shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                  קורסים שמלמד
                </CardTitle>
              </CardHeader>
              <CardContent>
                {courses.length === 0 ? (
                  <div className="text-gray-500 py-6 text-center">אין קורסים להצגה</div>
                ) : (
                  <div className="grid gap-4">
                    {courses.map((course, index) => (
                      <div key={index} className="p-4 border rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold text-gray-900">{course.name}</h3>
                            {course.code && (
                              <p className="text-sm text-gray-600">קוד: {course.code}</p>
                            )}
                          </div>
                          {course.grade && (
                            <Badge variant="secondary" className="bg-green-100 text-green-800">
                              <GraduationCap className="w-3 h-3 mr-1" />
                              ציון: {course.grade}
                            </Badge>
                          )}
                        </div>
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
