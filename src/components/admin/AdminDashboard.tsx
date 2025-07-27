import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  BookOpen, 
  Calendar, 
  MessageSquare, 
  Activity, 
  TrendingUp,
  Shield,
  Clock,
  FileText
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAdminActions } from '@/hooks/useAdminActions';


const AdminDashboard = () => {
  // Fetch dashboard statistics
  const { data: stats } = useQuery({
    queryKey: ['admin-dashboard-stats'],
    queryFn: async () => {
      const [
        { count: usersCount },
        { count: coursesCount },
        { count: examDatesCount },
        { count: messagesCount },
        { count: studyPartnersCount },
        { count: studyRoomsCount },
        { count: marathonRegistrationsCount }
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('courses').select('*', { count: 'exact', head: true }),
        supabase.from('exam_dates').select('*', { count: 'exact', head: true }),
        supabase.from('messages').select('*', { count: 'exact', head: true }),
        supabase.from('study_partners').select('*', { count: 'exact', head: true }),
        supabase.from('study_rooms').select('*', { count: 'exact', head: true }),
        supabase.from('marathon_registrations').select('*', { count: 'exact', head: true })
      ]);

      return {
        users: usersCount || 0,
        courses: coursesCount || 0,
        examDates: examDatesCount || 0,
        messages: messagesCount || 0,
        studyPartners: studyPartnersCount || 0,
        studyRooms: studyRoomsCount || 0,
        marathonRegistrations: marathonRegistrationsCount || 0
      };
    }
  });

  const { data: recentActions = [] } = useAdminActions();

  const statisticsCards = [
    {
      title: 'משתמשים רשומים',
      value: stats?.users || 0,
      icon: Users,
      color: 'bg-blue-500',
      trend: '+12%'
    },
    {
      title: 'קורסים פעילים',
      value: stats?.courses || 0,
      icon: BookOpen,
      color: 'bg-green-500',
      trend: '+8%'
    },
    {
      title: 'מועדי בחינה',
      value: stats?.examDates || 0,
      icon: Calendar,
      color: 'bg-purple-500',
      trend: '+15%'
    },
    {
      title: 'הודעות פנימיות',
      value: stats?.messages || 0,
      icon: MessageSquare,
      color: 'bg-orange-500',
      trend: '+25%'
    },
    {
      title: 'שותפי לימוד',
      value: stats?.studyPartners || 0,
      icon: Users,
      color: 'bg-pink-500',
      trend: '+18%'
    },
    {
      title: 'מפגשי לימוד',
      value: stats?.studyRooms || 0,
      icon: Activity,
      color: 'bg-teal-500',
      trend: '+22%'
    },
    {
      title: 'הרשמות למרתון',
      value: stats?.marathonRegistrations || 0,
      icon: TrendingUp,
      color: 'bg-indigo-500',
      trend: '+35%'
    },
    {
      title: 'פעולות אדמין',
      value: recentActions.length,
      icon: Shield,
      color: 'bg-red-500',
      trend: 'היום'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2">לוח בקרה - סטטיסטיקות</h2>
          <p className="text-gray-600">מבט כללי על המערכת ופעילויות אחרונות</p>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-600">
            עודכן לאחרונה: {new Date().toLocaleTimeString('he-IL')}
          </span>
        </div>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statisticsCards.map((stat, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    {stat.title}
                  </p>
                  <p className="text-3xl font-bold">{stat.value}</p>
                  <div className="flex items-center mt-2">
                    <Badge variant="outline" className="text-xs">
                      {stat.trend}
                    </Badge>
                  </div>
                </div>
                <div className={`p-3 rounded-lg ${stat.color} bg-opacity-10`}>
                  <stat.icon className={`w-6 h-6 text-white`} style={{ color: stat.color.replace('bg-', '').replace('-500', '') }} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              פעילויות אחרונות
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActions.slice(0, 5).map((action: any) => (
                <div key={action.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="p-2 bg-blue-100 rounded-full">
                    <Shield className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{action.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {action.action_type}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {new Date(action.created_at).toLocaleString('he-IL')}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              {recentActions.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>אין פעילויות אחרונות</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              קישורים מהירים
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="h-auto p-4 flex-col">
                <Users className="w-6 h-6 mb-2" />
                <span className="text-sm">ניהול משתמשים</span>
              </Button>
              <Button variant="outline" className="h-auto p-4 flex-col">
                <BookOpen className="w-6 h-6 mb-2" />
                <span className="text-sm">ניהול קורסים</span>
              </Button>
              <Button variant="outline" className="h-auto p-4 flex-col">
                <Calendar className="w-6 h-6 mb-2" />
                <span className="text-sm">מועדי בחינות</span>
              </Button>
              <Button variant="outline" className="h-auto p-4 flex-col">
                <MessageSquare className="w-6 h-6 mb-2" />
                <span className="text-sm">מערכת הודעות</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Health */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            בריאות המערכת
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-green-800">מסד נתונים</p>
                <p className="text-xs text-green-600">פעיל ותקין</p>
              </div>
              <Badge className="bg-green-600">✓</Badge>
            </div>
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-green-800">שרת אפליקציה</p>
                <p className="text-xs text-green-600">פעיל ותקין</p>
              </div>
              <Badge className="bg-green-600">✓</Badge>
            </div>
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-green-800">מערכת הודעות</p>
                <p className="text-xs text-green-600">פעילה ותקינה</p>
              </div>
              <Badge className="bg-green-600">✓</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;