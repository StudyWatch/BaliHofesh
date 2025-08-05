
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthProvider';
import { useFavoriteCourses } from '@/hooks/useFavorites';
import { usePersonalizedExamCalendar } from '@/hooks/usePersonalizedExamCalendar';
import { useUserActiveSessions } from '@/hooks/useProfile';
import { useStudyPartners } from '@/hooks/useStudyPartners';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, ArrowLeft, BookOpen, Calendar, Bell, Settings, User, LogOut, Star, Users, Clock, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import Header from '@/components/Header';
import NotificationSettings from '@/components/profile/NotificationSettings';
import CalendarIntegration from '@/components/profile/CalendarIntegration';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';

const MyCourses = () => {
  const navigate = useNavigate();
  const { t, dir } = useLanguage();
  const { user, loading } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const [showCalendarIntegration, setShowCalendarIntegration] = useState(false);

  // Real data hooks
  const { data: favoriteCourses = [], isLoading: loadingFavorites } = useFavoriteCourses();
  const { data: upcomingExams = [], isLoading: loadingExams } = usePersonalizedExamCalendar();
  const { data: activeSessions = [], isLoading: loadingSessions } = useUserActiveSessions();
  const { data: studyPartners = [], isLoading: loadingPartners } = useStudyPartners('');

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    toast.success('התנתקת בהצלחה');
    navigate('/');
  };

  const removeFavorite = async (courseId: string) => {
    // TODO: Implement real favorite removal
    toast.success('הקורס הוסר מהמועדפים');
  };

  if (loading || loadingFavorites || loadingExams || loadingSessions || loadingPartners) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-xl text-gray-600">טוען את הפרופיל שלך...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50" dir={dir}>
      <Header />

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <Card className="mb-8 bg-gradient-to-r from-blue-500 to-purple-500 text-white">
          <CardContent className="p-8">
            <h1 className="text-3xl font-bold mb-2">שלום, {user.user_metadata?.name || user.email}!</h1>
            <p className="text-lg opacity-90">
              ברוך הבא לאזור האישי שלך. כאן תוכל לעקוב אחרי הקורסים והבחינות שלך
            </p>
            <div className="flex gap-4 mt-6">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="secondary" className="bg-white text-blue-600 hover:bg-gray-100">
                    <Settings className="w-4 h-4 mr-2" />
                    הגדרות חשבון
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <NotificationSettings onClose={() => setShowNotificationSettings(false)} />
                </DialogContent>
              </Dialog>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="secondary" className="bg-white/10 border border-white/20 text-white hover:bg-white/20">
                    <Bell className="w-4 h-4 mr-2" />
                    הגדרות התראות
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <NotificationSettings onClose={() => setShowNotificationSettings(false)} />
                </DialogContent>
              </Dialog>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="secondary" className="bg-white/10 border border-white/20 text-white hover:bg-white/20">
                    <Calendar className="w-4 h-4 mr-2" />
                    יומן
                  </Button>
                </DialogTrigger>
                 <DialogContent className="max-w-3xl">
                   <CalendarIntegration 
                     userCourses={favoriteCourses} 
                     upcomingExams={upcomingExams} 
                   />
                 </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Favorite Courses */}
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500" />
                הקורסים שלי ({favoriteCourses.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {favoriteCourses.length === 0 ? (
                <div className="text-center py-8">
                  <BookOpen className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">אין קורסים מועדפים</h3>
                  <p className="text-gray-600 mb-4">התחל לעקוב אחרי קורסים כדי לראות אותם כאן</p>
                  <Button onClick={() => navigate('/')}>חפש קורסים</Button>
                </div>
              ) : (
                 <div className="space-y-4">
                   {favoriteCourses.map((course: any) => (
                     <Card key={course.course_id || 'temp'} className="border-l-4 border-blue-500">
                       <CardContent className="p-4">
                         <div className="flex items-start justify-between">
                           <div className="flex-1">
                             <div className="flex items-center gap-2 mb-2">
                               <Badge className="bg-blue-500 text-white">
                                 קורס
                               </Badge>
                               <span className="text-sm text-gray-600">מוסד</span>
                             </div>
                             <h3 className="font-semibold text-gray-900 mb-1">קורס מועדף</h3>
                             <p className="text-sm text-gray-600">סמסטר: לא מוגדר</p>
                           </div>
                           <div className="flex gap-2">
                             <Button 
                               size="sm" 
                               variant="outline"
                               onClick={() => navigate(`/course/1`)}
                             >
                               צפה במועדים
                             </Button>
                             <Button 
                               size="sm" 
                               variant="ghost"
                               onClick={() => removeFavorite('1')}
                               className="text-red-600 hover:text-red-700 hover:bg-red-50"
                             >
                               הסר מועדפים
                             </Button>
                           </div>
                         </div>
                       </CardContent>
                     </Card>
                   ))}
                 </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Exams */}
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-500" />
                בחינות קרובות ({upcomingExams.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingExams.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">אין בחינות קרובות</h3>
                  <p className="text-gray-600">כל הבחינות שלך עדיין רחוקות או שלא הוספת קורסים</p>
                </div>
              ) : (
                 <div className="space-y-4">
                   {upcomingExams.slice(0, 5).map(exam => {
                     const daysUntil = Math.ceil((new Date(exam.exam_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                     
                     return (
                       <Card key={exam.id} className="border-l-4 border-blue-500">
                         <CardContent className="p-4">
                           <div className="flex items-start justify-between">
                             <div className="flex-1">
                               <div className="flex items-center gap-2 mb-2">
                                 <Badge className="bg-blue-500 text-white">
                                   {exam.exam_type}
                                 </Badge>
                                 <Badge variant="outline" className={`${daysUntil <= 7 ? 'text-red-600 border-red-300' : 'text-blue-600 border-blue-300'}`}>
                                   {daysUntil === 0 ? 'היום' : daysUntil === 1 ? 'מחר' : `בעוד ${daysUntil} ימים`}
                                 </Badge>
                               </div>
                               <h3 className="font-semibold text-gray-900 mb-1">{exam.course_name}</h3>
                               <div className="text-sm text-gray-600 space-y-1">
                                 <p>{new Date(exam.exam_date).toLocaleDateString('he-IL')} • {exam.exam_time}</p>
                                 <p>{exam.institution_name}</p>
                               </div>
                             </div>
                             <Button 
                               size="sm" 
                               variant="outline"
                               onClick={() => navigate(`/course/${exam.course_id}`)}
                             >
                               פרטים
                             </Button>
                           </div>
                         </CardContent>
                       </Card>
                     );
                   })}
                 </div>
              )}
            </CardContent>
          </Card>

          {/* Active Sessions */}
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-green-500" />
                מפגשים פעילים ({activeSessions.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activeSessions.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">אין מפגשים פעילים</h3>
                  <p className="text-gray-600">אין מפגשים מתוכננים עבור הקורסים שלך</p>
                </div>
              ) : (
                 <div className="space-y-4">
                   {activeSessions.map(session => (
                     <Card key={session.id} className="border-l-4 border-green-500">
                       <CardContent className="p-4">
                         <div className="flex items-start justify-between">
                           <div className="flex-1">
                             <div className="flex items-center gap-2 mb-2">
                               <Badge className="bg-green-500 text-white">
                                 מפגש פעיל
                               </Badge>
                               <Badge variant="outline" className="text-green-600 border-green-300">
                                 פעיל
                               </Badge>
                             </div>
                             <h3 className="font-semibold text-gray-900 mb-1">{session.title}</h3>
                             <div className="text-sm text-gray-600 space-y-1">
                               <p>{new Date(session.scheduled_start_time || session.created_at).toLocaleDateString('he-IL')}</p>
                               <p>פלטפורמה: {session.platform}</p>
                               <p>תיאור: {session.description || 'מפגש לימוד'}</p>
                             </div>
                           </div>
                           <Button 
                             size="sm" 
                             variant="outline"
                             className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                           >
                             הצטרף
                           </Button>
                         </div>
                       </CardContent>
                     </Card>
                   ))}
                 </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Study Partners Section */}
        <Card className="mt-8 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-purple-500" />
              שותפי לימוד מחפשים שיתוף פעולה ({studyPartners.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {studyPartners.length === 0 ? (
              <div className="text-center py-8">
                <UserPlus className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2">אין שותפי לימוד זמינים</h3>
                <p className="text-gray-600">אין סטודנטים המחפשים שותפי לימוד בקורסים שלך כרגע</p>
              </div>
            ) : (
               <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                 {studyPartners.map(partner => (
                   <Card key={partner.id} className="border-l-4 border-purple-500">
                     <CardContent className="p-4">
                       <div className="flex items-start gap-3">
                         <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                           <User className="w-5 h-5 text-white" />
                         </div>
                         <div className="flex-1 min-w-0">
                           <div className="flex items-center gap-2 mb-2">
                             <h3 className="font-semibold text-gray-900 truncate">שותף לימוד</h3>
                             <Badge variant="outline" className="text-purple-600 border-purple-300">
                               פעיל
                             </Badge>
                           </div>
                           <p className="text-sm text-gray-600 mb-2 line-clamp-2">{partner.description}</p>
                           <div className="flex items-center justify-between">
                             <span className="text-xs text-gray-500">זמינות: {partner.available_hours?.join(', ') || 'גמיש'}</span>
                             <Button size="sm" variant="outline" className="text-xs">
                               צור קשר
                             </Button>
                           </div>
                         </div>
                       </div>
                     </CardContent>
                   </Card>
                 ))}
               </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="mt-8 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>פעולות מהירות</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-4">
              <Button 
                variant="outline" 
                className="h-20 flex flex-col items-center gap-2"
                onClick={() => navigate('/')}
              >
                <BookOpen className="w-6 h-6" />
                חפש קורסים חדשים
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex flex-col items-center gap-2"
                onClick={() => navigate('/tutors')}
              >
                <User className="w-6 h-6" />
                מצא מורה פרטי
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex flex-col items-center gap-2"
                onClick={() => navigate('/tips')}
              >
                <Bell className="w-6 h-6" />
                טיפים ללימודים
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex flex-col items-center gap-2"
                onClick={() => navigate('/store')}
              >
                <Star className="w-6 h-6" />
                החנות הסטודנטיאלית
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MyCourses;
