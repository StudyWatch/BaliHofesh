import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/App';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import {
  useUserProfile,
  useUserFavoriteCourses,
  useUserActivePartnerships,
  useUserActiveSessions,
  useProfileStats
} from '@/hooks/useProfile';
import { useMessages } from '@/hooks/useMessages';
import { useSystemNotifications } from '@/hooks/useSystemNotifications';
import { useTutors } from '@/hooks/useTutors';
import ProfileEditDialog from '@/components/profile/ProfileEditDialog';
import NotificationSettings from '@/components/profile/NotificationSettings';
import { AdvancedCalendar } from '@/components/calendar/AdvancedCalendar';
import {
  User,
  Edit,
  GraduationCap,
  Calendar,
  BookOpen,
  Users,
  Video,
  Mail,
  Phone,
  MessageCircle,
  MessageSquare,
  Bell,
  Settings,
  Star,
  LogOut,
  ChevronRight,
  AlertCircle,
  TrendingUp,
  Award,
  Trophy,
  Medal,
  Layers,
  UserPlus
} from 'lucide-react';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { PieChart, Pie, Cell, Tooltip as ChartTooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';
import tippy from 'tippy.js';
import 'tippy.js/dist/tippy.css';

// --- Animated Background Blobs ---
const BlobBG = () => (
  <>
    <div className="fixed z-0 left-[-180px] top-[-90px] w-[420px] h-[420px] bg-gradient-to-br from-indigo-400 via-purple-400 to-pink-400 opacity-30 blur-2xl rounded-full animate-blob"></div>
    <div className="fixed z-0 right-[-160px] bottom-[-100px] w-[340px] h-[340px] bg-gradient-to-br from-blue-400 via-green-400 to-cyan-400 opacity-25 blur-2xl rounded-full animate-blob animation-delay-2000"></div>
    <style>{`
      @keyframes blob { 0%,100%{transform:scale(1) translate(0,0);} 50%{transform:scale(1.18) translate(30px,20px);} }
      .animate-blob { animation: blob 16s infinite cubic-bezier(.8,0,.2,1); }
      .animation-delay-2000 { animation-delay: 2s; }
    `}</style>
  </>
);

const PIE_COLORS = ['#7C3AED', '#F59E42', '#10B981', '#6366F1', '#F87171', '#3B82F6', '#FBBF24'];

const ProfileStatCard = ({
  label,
  value,
  icon,
  color,
  tooltip
}: {
  label: string,
  value: number,
  icon: React.ReactNode,
  color: string,
  tooltip?: string
}) => (
  <motion.div
    whileHover={{ scale: 1.06, boxShadow: "0 8px 32px 0 rgba(124,58,237,0.17)" }}
    className={`bg-white/95 dark:bg-zinc-900/90 rounded-2xl p-6 shadow transition-all group relative overflow-visible cursor-pointer`}
    onMouseEnter={e => tooltip && tippy(e.currentTarget, { content: tooltip, placement: 'top', theme: 'light-border', duration: [300,200] })}
  >
    <div className="flex items-center justify-center mb-4">
      <div className="p-4 rounded-full" style={{ background: color + '18', color }}>{icon}</div>
    </div>
    <div className="text-3xl font-extrabold" style={{ color }}>{value}</div>
    <div className="text-xs font-bold opacity-80 mt-1">{label}</div>
  </motion.div>
);

const Achievements = ({ stats }) => (
  <div className="flex flex-wrap gap-3 mt-6">
    <Badge className="flex items-center gap-1 px-3 py-1 bg-yellow-200 text-yellow-800 rounded-full border-0 text-xs">
      <Trophy className="w-4 h-4" /> <span>סטודנט מצטיין</span>
    </Badge>
    {stats?.sessionsCreated > 5 &&
      <Badge className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full border-0 text-xs">
        <Layers className="w-4 h-4" /> <span>פעיל מאוד</span>
      </Badge>
    }
    {stats?.partnershipsCreated > 2 &&
      <Badge className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full border-0 text-xs">
        <Users className="w-4 h-4" /> <span>שותפויות מוביל</span>
      </Badge>
    }
    <Badge className="flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-800 rounded-full border-0 text-xs">
      <Medal className="w-4 h-4" /> <span>חבר קהילה</span>
    </Badge>
  </div>
);

const Profile = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [isEditOpen, setIsEditOpen] = useState(false);

  // --- Data loading hooks
  const { data: notifications = [] } = useSystemNotifications();
  const unreadCount = notifications.filter(n => !n.is_read).length;

  const { data: profile, isLoading: profileLoading } = useUserProfile();
  const { data: favoriteCourses, isLoading: loadingCourses } = useUserFavoriteCourses();
  const { data: partnerships, isLoading: partnershipsLoading } = useUserActivePartnerships();
  const { data: sessions, isLoading: sessionsLoading } = useUserActiveSessions();
  const { data: stats, isLoading: statsLoading } = useProfileStats();
  const { data: messages, isLoading: messagesLoading } = useMessages('received');
  const { data: tutors } = useTutors();

  // --- Logout logic
  const handleLogout = () => {
    localStorage.removeItem('user');
    toast({ title: "התנתקת בהצלחה", description: "להתראות בפעם הבאה!" });
    navigate('/');
  };

  useEffect(() => {
    if (!authLoading && !user) navigate('/login');
  }, [user, authLoading, navigate]);

  const isLoading = authLoading || profileLoading;

  // --- Chart data
  const chartData = [
    { name: 'קורסים', value: favoriteCourses?.length || 0 },
    { name: 'שותפויות', value: partnerships?.length || 0 },
    { name: 'מפגשים', value: sessions?.length || 0 },
    { name: 'התראות', value: unreadCount }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 relative overflow-hidden">
        <BlobBG />
        <Header />
        <div className="container mx-auto px-4 py-12 animate-pulse">
          <div className="h-32 bg-muted rounded-lg"></div>
          <div className="grid lg:grid-cols-3 gap-6 mt-10">
            <div className="h-96 bg-muted rounded-lg"></div>
            <div className="h-96 bg-muted rounded-lg"></div>
            <div className="h-96 bg-muted rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }
  if (!user || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
        <BlobBG />
        <Header />
        <div className="container mx-auto px-4 py-8 text-center">
          <Card className="max-w-md mx-auto">
            <CardContent className="p-8">
              <AlertCircle className="w-16 h-16 mx-auto text-destructive mb-4" />
              <h2 className="text-xl font-bold mb-2">שגיאה בטעינת הפרופיל</h2>
              <p className="text-muted-foreground mb-4">לא ניתן לטעון את פרטי הפרופיל שלך</p>
              <Button onClick={() => navigate('/')}>חזור לעמוד הראשי</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // --- Relevant tutors for user's courses
  const relevantTutors = tutors?.filter(tutor =>
    favoriteCourses?.some(course =>
      tutor.subjects?.some(subject =>
        subject.includes(course.courses?.name_he || '') ||
        subject.includes(course.courses?.code || '')
      ) ||
      tutor.description?.includes(course.courses?.name_he || '') ||
      tutor.description?.includes(course.courses?.code || '')
    )
  ) || [];

  // --- Unread messages
  const unreadMessages = messages?.filter(msg => !msg.is_read).slice(0, 3) || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-indigo-50 to-slate-100 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-800" dir="rtl">
      <BlobBG />
      <Header />

      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* --- Profile Welcome Card --- */}
        <motion.div
          className="relative bg-gradient-to-l from-indigo-500 via-indigo-400 to-purple-500 rounded-3xl shadow-xl mb-10 overflow-hidden"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <div className="absolute left-[-90px] bottom-[-70px] w-72 h-72 bg-pink-400/20 blur-3xl rounded-full"></div>
          <CardContent className="relative flex flex-col md:flex-row items-center md:items-start gap-6 p-10 text-white">
            <motion.div
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, type: "spring" }}
            >
              <Avatar className="w-28 h-28 border-4 border-white shadow-lg">
                <AvatarImage src={profile.avatar_url} />
                <AvatarFallback className="text-3xl bg-white/40 text-indigo-900">
                  {profile.name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
            </motion.div>
            <div className="flex-1">
              <h1 className="text-4xl font-extrabold drop-shadow-lg mb-2">שלום, {profile.name || user.email}!</h1>
              <div className="flex flex-wrap gap-2 mb-3">
                {profile.university && (
                  <Badge className="bg-white/20 text-white border-white/30 px-2 py-1">
                    <GraduationCap className="w-4 h-4 inline-block mr-1" />
                    {profile.university}
                  </Badge>
                )}
                {profile.study_year && (
                  <Badge className="bg-white/20 text-white border-white/30 px-2 py-1">
                    <Calendar className="w-4 h-4 inline-block mr-1" />
                    שנה {profile.study_year}
                  </Badge>
                )}
              </div>
              <p className="text-lg font-medium opacity-90 mb-3">ברוך הבא לאזור האישי שלך – כאן הכל מסודר במקום אחד!</p>
              <Achievements stats={stats} />
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" className="text-white border-white/30 border hover:bg-white/10 flex items-center gap-2">
                    <Settings className="w-5 h-5" /> הגדרות
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <NotificationSettings onClose={() => setIsEditOpen(false)} />
                </DialogContent>
              </Dialog>
              <Button onClick={handleLogout} variant="destructive" className="flex items-center gap-2 text-white bg-red-500 hover:bg-red-600 border-none">
                <LogOut className="w-5 h-5" /> התנתק
              </Button>
            </div>
          </CardContent>
        </motion.div>
        {/* --- Animated Stats & Pie Chart --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div className="grid grid-cols-2 gap-4">
            <ProfileStatCard
              label="קורסים"
              value={favoriteCourses?.length || 0}
              icon={<BookOpen className="w-7 h-7" />}
              color="#7C3AED"
              tooltip="מספר הקורסים שאתה עוקב אחריהם"
            />
            <ProfileStatCard
              label="שותפויות"
              value={partnerships?.length || 0}
              icon={<Users className="w-7 h-7" />}
              color="#10B981"
              tooltip="מספר השותפויות הפעילות שלך"
            />
            <ProfileStatCard
              label="מפגשים"
              value={sessions?.length || 0}
              icon={<Video className="w-7 h-7" />}
              color="#6366F1"
              tooltip="מספר מפגשי לימוד שיצרת או השתתפת בהם"
            />
            <ProfileStatCard
              label="התראות חדשות"
              value={unreadCount || 0}
              icon={<Bell className="w-7 h-7" />}
              color="#F59E42"
              tooltip="מספר התראות חדשות שטרם נצפו"
            />
          </div>
          <div className="bg-white/80 dark:bg-zinc-900/80 rounded-2xl shadow p-6 flex flex-col items-center">
            <h2 className="text-lg font-semibold mb-2 text-indigo-800 dark:text-indigo-200">גרף פעילות</h2>
            <ResponsiveContainer width="99%" height={230}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={85}
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => percent > 0.09 ? `${name} ${(percent*100).toFixed(0)}%` : ''}
                  paddingAngle={3}
                  isAnimationActive
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <ChartTooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* --- Quick Actions (Navigation) --- */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <Button onClick={() => navigate('/courses')}
            className="flex flex-col items-center justify-center bg-gradient-to-br from-indigo-500 to-violet-500 text-white rounded-xl shadow-lg hover:scale-105 transition-transform py-5">
            <BookOpen className="w-8 h-8 mb-1" />
            <span className="text-sm">הקורסים שלי</span>
          </Button>
          <Button onClick={() => navigate('/tutors')}
            className="flex flex-col items-center justify-center bg-gradient-to-br from-blue-400 to-cyan-500 text-white rounded-xl shadow-lg hover:scale-105 transition-transform py-5">
            <UserPlus className="w-8 h-8 mb-1" />
            <span className="text-sm">מורים פרטיים</span>
          </Button>
          <Button onClick={() => navigate('/groups')}
            className="flex flex-col items-center justify-center bg-gradient-to-br from-green-400 to-lime-400 text-white rounded-xl shadow-lg hover:scale-105 transition-transform py-5">
            <Users className="w-8 h-8 mb-1" />
            <span className="text-sm">קבוצות לימוד</span>
          </Button>
          <Button onClick={() => navigate('/store')}
            className="flex flex-col items-center justify-center bg-gradient-to-br from-orange-400 to-yellow-300 text-white rounded-xl shadow-lg hover:scale-105 transition-transform py-5">
            <Award className="w-8 h-8 mb-1" />
            <span className="text-sm">חנות</span>
          </Button>
        </div>

        {/* --- Tabs + כל המשך הטאבים לפי הסגנון הזה! --- */}
        <Tabs defaultValue="calendar" className="bg-white/80 dark:bg-zinc-900/80 rounded-3xl shadow-2xl p-6 mb-10 space-y-6 overflow-hidden">
          <TabsList className="grid w-full grid-cols-5 mb-6">
            <TabsTrigger value="calendar" className="text-base">לוח שנה</TabsTrigger>
            <TabsTrigger value="overview" className="text-base">סקירה</TabsTrigger>
            <TabsTrigger value="courses" className="text-base">הקורסים שלי</TabsTrigger>
            <TabsTrigger value="activities" className="text-base">פעילויות</TabsTrigger>
            <TabsTrigger value="messages" className="text-base">הודעות</TabsTrigger>
          </TabsList>

          {/* Enhanced Calendar Tab */}
<TabsContent value="calendar" className="space-y-6">
  {!loadingCourses ? (
    <AdvancedCalendar 
      userCourses={favoriteCourses || []}
      upcomingExams={[]} 
      className="w-full"
    />
  ) : (
    <div className="text-center py-8">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-4"></div>
      <p className="text-muted-foreground">טוען לוח שנה...</p>
    </div>
  )}
</TabsContent>

          {/* Overview Tab - Reorganized */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Enhanced Profile Info */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <User className="w-5 h-5" />
                      פרטי פרופיל
                    </CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditOpen(true)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <Avatar className="w-20 h-20 mx-auto mb-4">
                      <AvatarImage src={profile.avatar_url} />
                      <AvatarFallback className="text-xl">
                        {profile.name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    
                    <h3 className="text-xl font-semibold">{profile.name}</h3>
                    {profile.bio && (
                      <p className="text-muted-foreground text-sm mt-2">{profile.bio}</p>
                    )}
                  </div>

                  {/* Enhanced Contact Info */}
                  {(profile.show_email || profile.show_phone) && (
                    <>
                      <Separator />
                      <div className="space-y-3">
                        <h4 className="font-medium flex items-center gap-2">
                          <MessageCircle className="w-4 h-4" />
                          פרטי קשר
                        </h4>
                        <div className="space-y-2">
                          {profile.show_email && (
                            <div className="flex items-center gap-2 text-sm p-2 bg-blue-50 dark:bg-blue-950/20 rounded">
                              <Mail className="w-4 h-4 text-blue-500" />
                              <span>{profile.email}</span>
                            </div>
                          )}
                          {profile.show_phone && profile.phone && (
                            <div className="flex items-center gap-2 text-sm p-2 bg-green-50 dark:bg-green-950/20 rounded">
                              <Phone className="w-4 h-4 text-green-500" />
                              <span>{profile.phone}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Enhanced Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    פעולות מהירות
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="space-y-3">
                  <Button 
                    variant="outline" 
                    className="w-full justify-between h-12"
                    onClick={() => navigate('/courses')}
                  >
                    <span className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4" />
                      חפש קורסים חדשים
                    </span>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full justify-between h-12"
                    onClick={() => navigate('/tutors')}
                  >
                    <span className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      מצא מורה פרטי
                    </span>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full justify-between h-12"
                    onClick={() => navigate('/tips')}
                  >
                    <span className="flex items-center gap-2">
                      <Star className="w-4 h-4" />
                      טיפים ועצות לימוד
                    </span>
                    <ChevronRight className="w-4 h-4" />
                  </Button>

                  <Button 
                    variant="outline" 
                    className="w-full justify-between h-12"
                    onClick={() => navigate('/store')}
                  >
                    <span className="flex items-center gap-2">
                      <Award className="w-4 h-4" />
                      חנות ומוצרים
                    </span>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>

              {/* Enhanced Messages Preview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <MessageSquare className="w-5 h-5" />
                      הודעות אחרונות
                    </span>
                    {unreadCount > 0 && (
                      <Badge variant="destructive">{unreadCount}</Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                
                <CardContent>
                  {messagesLoading ? (
                    <div className="animate-pulse space-y-3">
                      <div className="h-4 bg-muted rounded"></div>
                      <div className="h-4 bg-muted rounded w-3/4"></div>
                    </div>
                  ) : unreadMessages.length > 0 ? (
                    <div className="space-y-3">
                      {unreadMessages.map((message) => (
                        <div 
                          key={message.id} 
                          className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                          onClick={() => navigate('/messages')}
                        >
                          <div className="font-medium line-clamp-1">{message.subject || 'ללא נושא'}</div>
                          <div className="text-sm text-muted-foreground line-clamp-2">
                            {message.content}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            מאת: {message.sender_profile?.name || 'משתמש לא ידוע'}
                          </div>
                        </div>
                      ))}
                      
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full"
                        onClick={() => navigate('/messages')}
                      >
                        צפה בכל הההודעות
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>אין הודעות חדשות</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
{/* Courses Tab */}
<TabsContent value="courses" className="w-full">
  <Card className="w-full">
    <CardHeader>
      <CardTitle className="flex items-center justify-between">
        <span className="flex items-center gap-2">
          <BookOpen className="w-5 h-5" />
          הקורסים שלי ({favoriteCourses?.length || 0})
        </span>
        <Button onClick={() => navigate('/courses')}>
          הוסף קורסים
        </Button>
      </CardTitle>
    </CardHeader>
    <CardContent className="w-full">
      {loadingCourses ? (
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-muted rounded-lg"></div>
          ))}
        </div>
      ) : favoriteCourses && favoriteCourses.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
          {favoriteCourses.map((course: any) => (
            <Card
              key={course.id}
              className="w-full rounded-xl shadow-sm hover:shadow-md transition cursor-pointer"
              onClick={() => navigate(`/course/${course.course_id}`)}
            >
              <CardContent className="p-4 h-full flex flex-col justify-between">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <Badge variant="secondary">
                        {course.courses?.code}
                      </Badge>
                      <Badge variant={course.status === 'active' ? 'default' : 'outline'}>
                        {course.status === 'active' ? 'פעיל' : 
                         course.status === 'completed' ? 'הושלם' : 'במעקב'}
                      </Badge>
                      {course.rating && (
                        <Badge className="bg-yellow-200 text-yellow-800 border-0 ml-1">
                          {'★'.repeat(course.rating)}
                        </Badge>
                      )}
                    </div>
                    <h3 className="font-semibold mb-1">{course.courses?.name_he}</h3>
                    <p className="text-sm text-muted-foreground mb-1">
                      סמסטר: {course.semester}
                    </p>
                    {course.courses?.instructor && (
                      <p className="text-xs text-muted-foreground">
                        מרצה: {course.courses.instructor}
                      </p>
                    )}
                    {course.courses?.description && (
                      <p className="text-xs text-muted-foreground">
                        {course.courses.description.slice(0, 100)}...
                      </p>
                    )}
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground ml-2" />
                </div>
                {/* --- הכפתורים המשופרים --- */}
                <div className="flex flex-col gap-2 mt-4 w-full">
                  <a
                    href={`/groups/${course.course_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 py-2 px-0 bg-gradient-to-r from-green-400 to-emerald-500 text-white rounded-2xl font-bold text-base shadow-lg hover:scale-[1.03] transition"
                  >
                    <Users className="w-5 h-5" />
                    קבוצות
                  </a>
                  <a
                    href={`/tutors?course=${course.course_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 py-2 px-0 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-2xl font-bold text-base shadow-lg hover:scale-[1.03] transition"
                  >
                    <UserPlus className="w-5 h-5" />
                    מורים
                  </a>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <BookOpen className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">אין קורסים שמורים</h3>
          <p className="text-muted-foreground mb-4">
            התחל לעקוב אחרי קורסים כדי לראות אותם כאן
          </p>
          <Button onClick={() => navigate('/courses')}>
            חפש קורסים
          </Button>
        </div>
      )}
    </CardContent>
  </Card>
</TabsContent>

{/* Activities Tab */}
<TabsContent value="activities" className="space-y-6">
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
    {/* שותפויות לימוד */}
    <Card className="rounded-xl shadow-md hover:shadow-lg transition">
      <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-t-xl">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Users className="w-5 h-5" />
          שותפויות לימוד ({partnerships?.length || 0})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-3">
        {partnershipsLoading ? (
          <div className="animate-pulse space-y-3">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded-lg"></div>
            ))}
          </div>
        ) : partnerships && partnerships.length > 0 ? (
          partnerships.map((partnership: any) => (
            <div
              key={partnership.id}
              className="p-3 border rounded-lg hover:bg-muted/50 transition"
            >
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-4 h-4 text-purple-600" />
                <span className="font-medium">
                  {partnership.courses?.name_he}
                </span>
                <Badge variant="secondary" className="text-xs">
                  {partnership.status === 'active' ? 'פעיל' : 'לא פעיל'}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {partnership.preferences || 'אין העדפות מוגדרות'}
              </p>
            </div>
          ))
        ) : (
          <div className="text-center py-4 text-muted-foreground">
            אין שותפויות פעילות
          </div>
        )}
      </CardContent>
    </Card>

    {/* מפגשים משותפים */}
    <Card className="rounded-xl shadow-md hover:shadow-lg transition">
      <CardHeader className="bg-gradient-to-r from-green-400 to-emerald-500 text-white rounded-t-xl">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Video className="w-5 h-5" />
          מפגשים משותפים ({sessions?.length || 0})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-3">
        {sessionsLoading ? (
          <div className="animate-pulse space-y-3">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded-lg"></div>
            ))}
          </div>
        ) : sessions && sessions.length > 0 ? (
          sessions.map((session: any) => (
            <div
              key={session.id}
              className="p-3 border rounded-lg hover:bg-muted/50 transition"
            >
              <div className="flex items-center gap-2 mb-1">
                <Video className="w-4 h-4 text-green-600" />
                <span className="font-medium">{session.title}</span>
                <Badge variant="secondary" className="text-xs">
                  {session.status === 'active' ? 'פעיל' : 'הושלם'}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {session.courses?.name_he}
              </p>
              <p className="text-xs text-muted-foreground">
                {new Date(session.created_at).toLocaleDateString('he-IL')}
              </p>
            </div>
          ))
        ) : (
          <div className="text-center py-4 text-muted-foreground">
            אין מפגשים פעילים
          </div>
        )}
      </CardContent>
    </Card>

    {/* קבוצות קורסים */}
    <Card className="rounded-xl shadow-md hover:shadow-lg transition">
      <CardHeader className="bg-gradient-to-r from-blue-400 to-indigo-600 text-white rounded-t-xl">
        <CardTitle className="flex items-center gap-2 text-lg">
          <MessageSquare className="w-5 h-5" />
          קבוצות קורסים
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-3">
        {favoriteCourses && favoriteCourses.length > 0 ? (
          favoriteCourses.map((course: any) => (
            <CourseGroupItem
              key={course.course_id}
              courseId={course.course_id}
              courseName={course.courses?.name_he}
            />
          ))
        ) : (
          <div className="text-center py-4 text-muted-foreground">
            אין קורסים פעילים להצגת קבוצות
          </div>
        )}
      </CardContent>
    </Card>
  </div>
</TabsContent>

{/* Messages Tab */}
<TabsContent value="messages">
  <Card className="rounded-xl shadow-md hover:shadow-lg transition">
    <CardHeader className="bg-gradient-to-r from-cyan-500 to-sky-600 text-white rounded-t-xl">
      <CardTitle className="flex items-center justify-between text-lg">
        <span className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          הודעות ({messages?.length || 0})
        </span>
        {unreadCount > 0 && (
          <Badge variant="destructive" className="text-sm">
            {unreadCount} חדשות
          </Badge>
        )}
      </CardTitle>
    </CardHeader>
    <CardContent className="p-4 space-y-4">
      {messagesLoading ? (
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-muted rounded-lg"></div>
          ))}
        </div>
      ) : messages && messages.length > 0 ? (
        <div className="space-y-3">
          {messages.slice(0, 10).map((message) => (
            <div
              key={message.id}
              className={`p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition ${
                !message.is_read ? 'bg-blue-50 dark:bg-blue-950/20' : ''
              }`}
              onClick={() => navigate('/messages')}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 pr-2">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-base">
                      {message.subject || 'ללא נושא'}
                    </span>
                    {!message.is_read && (
                      <Badge variant="secondary" className="text-xs">חדש</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    מאת: {message.sender_profile?.name || 'משתמש לא ידוע'}
                  </p>
                  <p className="text-sm mt-1 line-clamp-2">
                    {message.content}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {new Date(message.created_at).toLocaleDateString('he-IL')} •{' '}
                    {new Date(message.created_at).toLocaleTimeString('he-IL', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground mt-1" />
              </div>
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            className="w-full mt-2"
            onClick={() => navigate('/messages')}
          >
            לצפייה בכל ההודעות
          </Button>
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <MessageSquare className="w-16 h-16 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">אין הודעות</h3>
          <p>לא קיבלת הודעות עדיין</p>
        </div>
      )}
    </CardContent>
  </Card>
</TabsContent>


        </Tabs>
      </div>

      {/* Profile Edit Dialog */}
      <ProfileEditDialog 
        open={isEditOpen} 
        onOpenChange={setIsEditOpen} 
      />
    </div>
  );
};

// Component for individual course group item
const CourseGroupItem = ({ courseId, courseName }: { courseId: string; courseName: string }) => {
  const { data: courseGroup } = useCourseGroups(courseId);

  return (
    <div className="border rounded-lg p-4">
      <h4 className="font-medium mb-3">{courseName}</h4>
      <div className="flex gap-2 flex-wrap">
        {courseGroup?.whatsapp_link ? (
          <Button 
            size="sm" 
            className="h-8 bg-green-600 hover:bg-green-700"
            asChild
          >
            <a href={courseGroup.whatsapp_link} target="_blank" rel="noopener noreferrer">
              <MessageSquare className="w-3 h-3 mr-1" />
              WhatsApp
            </a>
          </Button>
        ) : (
          <Button size="sm" className="h-8" variant="outline" disabled>
            <MessageSquare className="w-3 h-3 mr-1" />
            WhatsApp
          </Button>
        )}
        
        {courseGroup?.discord_link ? (
          <Button 
            size="sm" 
            className="h-8 bg-blue-600 hover:bg-blue-700"
            asChild
          >
            <a href={courseGroup.discord_link} target="_blank" rel="noopener noreferrer">
              <MessageSquare className="w-3 h-3 mr-1" />
              Discord
            </a>
          </Button>
        ) : (
          <Button size="sm" className="h-8" variant="outline" disabled>
            <MessageSquare className="w-3 h-3 mr-1" />
            Discord
          </Button>
        )}
      </div>
    </div>
  );
};

export default Profile;
