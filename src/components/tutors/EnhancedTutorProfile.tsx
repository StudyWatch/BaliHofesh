import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Star,
  MapPin,
  Clock,
  Phone,
  Mail,
  Award,
  BookOpen,
  GraduationCap,
  DollarSign,
  Trophy,
  Users,
  Calendar
} from 'lucide-react';
// import { useTutorCourses } from '@/hooks/useTutorCourses';
// import { useTutorReviews, useTutorRatingStats } from '@/hooks/useTutorReviews';
// import TutorReviewSystem from './TutorReviewSystem'; // Will be added later

interface EnhancedTutorProfileProps {
  tutor: any;
  onContact: () => void;
  onBookLesson: () => void;
}

const EnhancedTutorProfile = ({
  tutor,
  onContact,
  onBookLesson
}: EnhancedTutorProfileProps) => {
  // עדכון: תוכל להעביר לפה את הקורסים והביקורות מהשרת
  const tutorCourses: any[] = tutor.courses || [];
  const reviews: any[] = tutor.reviews || [];
  const ratingStats = tutor.ratingStats || null;

  const outstandingCourses = tutorCourses.filter(tc => tc.is_outstanding_student);
  const expertCourses = tutorCourses.filter(tc => tc.experience_level === 'expert');

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
            {/* תמונת פרופיל */}
            <Avatar className="w-24 h-24 border-4 border-white/20 shadow-lg">
              <AvatarImage
                src={tutor.avatar_url || undefined}
                alt={tutor.name || 'Avatar'}
              />
              <AvatarFallback className="text-2xl bg-white/20">
                {tutor.name?.charAt(0).toUpperCase() || 'M'}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <h1 className="text-3xl font-bold">{tutor.name}</h1>
                {tutor.is_verified && (
                  <Badge className="bg-green-500 text-white">
                    <Award className="w-3 h-3 mr-1" />
                    מאומת
                  </Badge>
                )}
                {tutor.is_online && (
                  <Badge className="bg-yellow-500 text-white animate-pulse">
                    <div className="w-2 h-2 bg-green-400 rounded-full mr-1" />
                    זמין עכשיו
                  </Badge>
                )}
              </div>

              <div className="grid md:grid-cols-3 gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-300" />
                  <span className="font-semibold">
                    {ratingStats?.average_rating || tutor.rating}/5
                  </span>
                  <span className="opacity-90">
                    ({ratingStats?.total_reviews || tutor.reviews_count} ביקורות)
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

              {/* Special Achievements */}
              <div className="flex flex-wrap gap-2 mb-4">
                {outstandingCourses.length > 0 && (
                  <Badge className="bg-yellow-500 text-white">
                    <Trophy className="w-3 h-3 mr-1" />
                    סטודנט מצטיין ({outstandingCourses.length} קורסים)
                  </Badge>
                )}
                {expertCourses.length > 0 && (
                  <Badge className="bg-purple-500 text-white">
                    <GraduationCap className="w-3 h-3 mr-1" />
                    מומחה ({expertCourses.length} קורסים)
                  </Badge>
                )}
                {reviews.length >= 10 && (
                  <Badge className="bg-blue-500 text-white">
                    <Users className="w-3 h-3 mr-1" />
                    מורה פופולרי
                  </Badge>
                )}
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
                <Calendar className="w-4 h-4 mr-2" />
                הזמן שיעור
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="bg-white/10 border-white text-white hover:bg-white/20"
                onClick={onContact}
              >
                <Phone className="w-4 h-4 mr-2" />
                צור קשר
              </Button>
              {tutor.email && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/10"
                  onClick={() => window.open(`mailto:${tutor.email}`, '_blank')}
                >
                  <Mail className="w-4 h-4 mr-2" />
                  שלח מייל
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
                <BookOpen className="w-5 h-5" />
                התמחויות
              </CardTitle>
            </CardHeader>
            <CardContent>
              {tutorCourses.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  המורה לא הגדיר קורסים עדיין
                </p>
              ) : (
                <div className="grid gap-4">
                  {tutorCourses.map((tutorCourse) => (
                    <div
                      key={tutorCourse.id}
                      className="p-4 border rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-lg">
                            {tutorCourse.course?.name_he}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {tutorCourse.course?.code} • {tutorCourse.course?.institutions?.name_he}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {getExperienceBadge(tutorCourse.experience_level)}
                          {tutorCourse.grade && (
                            <Badge variant="secondary" className="bg-green-100 text-green-800">
                              ציון: {tutorCourse.grade}
                            </Badge>
                          )}
                          {tutorCourse.is_outstanding_student && (
                            <Badge className="bg-yellow-500 text-white">
                              <Trophy className="w-3 h-3 mr-1" />
                              מצטיין
                            </Badge>
                          )}
                        </div>
                      </div>

                      {tutorCourse.description && (
                        <p className="text-gray-700 text-sm">{tutorCourse.description}</p>
                      )}
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
          {/* <TutorReviewSystem tutorId={tutor.id} tutorName={tutor.name} /> */}
          <div className="p-6 text-center text-gray-500">
            מערכת ביקורות תתווסף בקרוב
          </div>
        </TabsContent>

        {/* Schedule Tab */}
        <TabsContent value="schedule">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                זמינות
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
                      <Phone className="w-4 h-4 mr-2" />
                      צור קשר לתיאום
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
