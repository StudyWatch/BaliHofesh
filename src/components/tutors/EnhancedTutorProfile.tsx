import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Star, MapPin, Clock, Phone, Mail, Award,
  BookOpen, GraduationCap, DollarSign, Trophy,
  Users, Calendar, Link as LinkIcon
} from 'lucide-react';

interface CourseType {
  id: string;
  name_he?: string;
  code?: string;
  institution_name?: string;
  grade?: number;
}

interface EnhancedTutorProfileProps {
  tutor: any;
  onContact: () => void;
  onBookLesson: () => void;
  allCourses?: CourseType[]; // אופציונלי – אם יש, מאפשר להשלים שמות קורסים לפי מזהה
}

const EnhancedTutorProfile = ({
  tutor,
  onContact,
  onBookLesson,
  allCourses = []
}: EnhancedTutorProfileProps) => {
  // --- עיבוד קורסים ---
  let tutorCourses: CourseType[] = [];
  if (Array.isArray(tutor.courses)) {
    // אם כל אובייקט הוא מזהה בלבד
    if (typeof tutor.courses[0] === 'string' && allCourses.length > 0) {
      tutorCourses = tutor.courses.map((courseId: string) =>
        allCourses.find(c => c.id === courseId)
      ).filter(Boolean) as CourseType[];
    }
    // אם כל אובייקט הוא אובייקט קורס מלא
    else if (typeof tutor.courses[0] === 'object') {
      tutorCourses = tutor.courses;
    }
  }

  const reviews: any[] = tutor.reviews || [];
  const ratingStats = tutor.ratingStats || null;

  const getExperienceBadge = (level: string) => {
    const colors = {
      beginner: 'bg-green-100 text-green-800',
      intermediate: 'bg-blue-100 text-blue-800',
      advanced: 'bg-purple-100 text-purple-800',
      expert: 'bg-orange-100 text-orange-800'
    };

    const labels = {
      beginner: 'מתחיל',
      intermediate: 'בינוני',
      advanced: 'מתקדם',
      expert: 'מומחה'
    };

    if (!level) return null;
    return (
      <Badge className={colors[level as keyof typeof colors]}>
        {labels[level as keyof typeof labels]}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white p-6">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <Avatar className="w-24 h-24 border-4 border-white/20 shadow-lg">
              <AvatarImage src={tutor.avatar_url || undefined} alt={tutor.name || 'Avatar'} />
              <AvatarFallback className="text-2xl bg-white/20">
                {tutor.name?.charAt(0).toUpperCase() || 'M'}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <h1 className="text-3xl font-bold">{tutor.name}</h1>
                {tutor.is_verified && (
                  <Badge className="bg-green-500 text-white">
                    <Award className="w-3 h-3 mr-1" /> מאומת
                  </Badge>
                )}
                {tutor.is_online && (
                  <Badge className="bg-yellow-500 text-white animate-pulse">
                    <div className="w-2 h-2 bg-green-400 rounded-full mr-1" /> זמין עכשיו
                  </Badge>
                )}
              </div>
              <div className="grid md:grid-cols-3 gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-300" />
                  <span className="font-semibold">
                    {ratingStats?.average_rating || tutor.rating || 5}/5
                  </span>
                  <span className="opacity-90">
                    ({ratingStats?.total_reviews || tutor.reviews_count || 0} ביקורות)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  <span className="font-semibold">₪{tutor.hourly_rate}/שעה</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  <span>{tutor.location}</span>
                </div>
              </div>

              {tutor.availability && (
                <div className="flex items-center gap-2 opacity-90">
                  <Clock className="w-4 h-4" />
                  <span>{tutor.availability}</span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 md:min-w-[200px]">
              <Button
                size="lg"
                className="bg-white text-blue-600 hover:bg-gray-100"
                onClick={onBookLesson}
              >
                <Calendar className="w-4 h-4 mr-2" /> הזמן שיעור
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="bg-white/10 border-white text-white hover:bg-white/20"
                onClick={onContact}
              >
                <Phone className="w-4 h-4 mr-2" /> צור קשר
              </Button>
              {tutor.email && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/10"
                  onClick={() => window.open(`mailto:${tutor.email}`, '_blank')}
                >
                  <Mail className="w-4 h-4 mr-2" /> שלח מייל
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Tabs section */}
      <Tabs defaultValue="courses" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="courses">קורסים</TabsTrigger>
          <TabsTrigger value="about">אודות</TabsTrigger>
          <TabsTrigger value="reviews">ביקורות</TabsTrigger>
          <TabsTrigger value="schedule">זמינות</TabsTrigger>
        </TabsList>

        {/* Courses Tab */}
        <TabsContent value="courses" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" /> התמחויות
              </CardTitle>
            </CardHeader>
            <CardContent>
              {tutorCourses.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  המורה לא הגדיר קורסים עדיין
                </p>
              ) : (
                <div className="grid gap-4">
                  {tutorCourses.map((tc) => (
                    <div
                      key={tc.id}
                      className="p-4 border rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 flex flex-col md:flex-row justify-between"
                    >
                      <div>
                        <h3 className="font-semibold text-lg flex items-center gap-2">
                          <BookOpen className="w-5 h-5 text-blue-500" />
                          {tc.name_he || 'קורס לא ידוע'}
                          {tc.code && (
                            <span className="text-xs text-gray-500">({tc.code})</span>
                          )}
                        </h3>
                        {tc.institution_name && (
                          <p className="text-xs text-gray-600">
                            <GraduationCap className="inline w-4 h-4" /> {tc.institution_name}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {tc.grade && (
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            ציון: {tc.grade}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* About Tab */}
        <TabsContent value="about" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>אודות המורה</CardTitle>
              </CardHeader>
              <CardContent>
                {tutor.description ? (
                  <p className="text-gray-700 leading-relaxed">{tutor.description}</p>
                ) : (
                  <p className="text-gray-500">המורה לא הוסיף תיאור עדיין</p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>ניסיון והכשרה</CardTitle>
              </CardHeader>
              <CardContent>
                {tutor.experience ? (
                  <p className="text-gray-700 leading-relaxed">{tutor.experience}</p>
                ) : (
                  <p className="text-gray-500">המורה לא הוסיף פרטי ניסיון עדיין</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Reviews Tab */}
        <TabsContent value="reviews">
          {/* מערכת ביקורות תתווסף בעתיד */}
          <div className="p-6 text-center text-gray-500">
            מערכת ביקורות תתווסף בקרוב
          </div>
        </TabsContent>

        {/* Schedule Tab */}
        <TabsContent value="schedule">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" /> זמינות
              </CardTitle>
            </CardHeader>
            <CardContent>
              {tutor.availability ? (
                <div className="space-y-4">
                  <p className="text-gray-700">{tutor.availability}</p>
                  <Separator />
                  <div className="text-center">
                    <p className="text-gray-600 mb-4">
                      לתיאום שיעור ספציפי, צרו קשר ישירות עם המורה
                    </p>
                    <Button onClick={onContact}>
                      <Phone className="w-4 h-4 mr-2" /> צור קשר לתיאום
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-500 mb-4">המורה לא הגדיר לוח זמנים עדיין</p>
                  <Button onClick={onContact}>
                    צור קשר לבדיקת זמינות
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EnhancedTutorProfile;
