import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Users,
  BookOpen,
  MessageSquare,
  Calendar,
  TrendingUp,
  Activity,
  Star,
  Clock,
  BarChart3,
  PieChart,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import { useAdminStats } from '@/hooks/useAdminStats';
// דמו Chart.js ריאקט - אפשר להחליף לספריית דיאגרמות אחרת
import { Pie, Bar } from 'react-chartjs-2';
import 'chart.js/auto';

const AdvancedAdminDashboard = () => {
  const { data: stats, isLoading } = useAdminStats();

  // דמו לסטטיסטיקות גרפיות (ניתן להוציא מהשרת)
  const chartData = {
    labels: ['משתמשים', 'קורסים', 'ביקורות', 'מפגשים'],
    datasets: [{
      data: [
        stats?.totalUsers ?? 0,
        stats?.totalCourses ?? 0,
        stats?.totalReviews ?? 0,
        stats?.totalSessions ?? 0,
      ],
      backgroundColor: [
        '#3b82f6', // blue
        '#22c55e', // green
        '#a21caf', // purple
        '#f59e42', // orange
      ],
      borderWidth: 0,
    }],
  };

  const barData = {
    labels: stats?.popularCourses?.map((c: any) => c.name?.slice(0, 20) + (c.name.length > 20 ? '...' : '')) ?? [],
    datasets: [{
      label: 'ביקורות לקורס',
      data: stats?.popularCourses?.map((c: any) => c.reviewCount) ?? [],
      backgroundColor: '#a21caf',
      borderRadius: 8,
    }],
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="h-28" />
          ))}
        </div>
        <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-2xl" />
      </div>
    );
  }

  if (!stats) return null;

  // כרטיס סטטיסטיקה
  const StatCard = ({ title, value, icon: Icon, color, trend }: {
    title: string;
    value: number | string;
    icon: any;
    color: string;
    trend?: string;
  }) => (
    <Card className="relative overflow-hidden shadow-lg rounded-2xl">
      <CardContent className="p-6 flex flex-col h-full justify-between">
        <div className="flex items-center justify-between mb-1">
          <div>
            <p className="text-xs font-semibold text-muted-foreground">{title}</p>
            <p className="text-2xl md:text-3xl font-black text-gray-800 dark:text-blue-100">{value}</p>
            {trend && (
              <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                <TrendingUp className="w-3 h-3" />
                {trend}
              </p>
            )}
          </div>
          <div className={`p-3 rounded-xl shadow ${color} bg-opacity-90`}>
            <Icon className="w-7 h-7 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-8 pb-10">
      {/* Main Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="סה״כ משתמשים"
          value={stats.totalUsers.toLocaleString()}
          icon={Users}
          color="bg-blue-600"
          trend="+12% החודש"
        />
        <StatCard
          title="סה״כ קורסים"
          value={stats.totalCourses}
          icon={BookOpen}
          color="bg-green-600"
          trend="+8 קורסים חדשים"
        />
        <StatCard
          title="ביקורות"
          value={stats.totalReviews}
          icon={MessageSquare}
          color="bg-purple-700"
          trend="+23 השבוע"
        />
        <StatCard
          title="מפגשים פעילים"
          value={stats.totalSessions}
          icon={Calendar}
          color="bg-orange-500"
          trend="+5 היום"
        />
      </div>

      {/* Charts & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="rounded-2xl shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5 text-blue-600" />
              דיאגרמת התפלגות
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
              <div className="w-full max-w-xs mx-auto">
                <Pie data={chartData} options={{
                  plugins: { legend: { display: true, rtl: true, labels: { font: { size: 13 } } } }
                }} />
              </div>
              <div className="flex-1">
                <Bar data={barData} options={{
                  plugins: { legend: { display: false } },
                  scales: {
                    x: { ticks: { font: { size: 11 }, color: '#666' } },
                    y: { beginAtZero: true }
                  }
                }} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Popular Courses */}
        <Card className="rounded-2xl shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-purple-700" />
              קורסים פופולריים
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.popularCourses.map((course, index) => (
                <div key={course.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/40 rounded-lg shadow-sm">
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold bg-blue-200 text-blue-900">{index + 1}</Badge>
                    <div>
                      <p className="font-medium text-blue-900 dark:text-blue-100">{course.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {course.reviewCount} ביקורות
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">{course.averageRating}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="rounded-2xl shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-green-600" />
            פעילות אחרונה
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.recentActivity.map((activity, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-900/40 rounded-lg">
                <Avatar className="w-8 h-8 mt-1 shadow">
                  <AvatarFallback className="text-xs bg-blue-200 dark:bg-blue-800 text-blue-900">{activity.userName?.charAt(0)}</AvatarFallback>
                  {activity.avatarUrl && <AvatarImage src={activity.avatarUrl} alt={activity.userName} />}
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-blue-100">
                    {activity.description}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="w-3 h-3 text-gray-400" />
                    <span className="text-xs text-gray-500">
                      {new Date(activity.timestamp).toLocaleString('he-IL')}
                    </span>
                    <Badge
                      variant="outline"
                      className="text-xs"
                    >
                      {activity.type === 'review' ? 'ביקורת' :
                        activity.type === 'registration' ? 'רישום' : 'מפגש'}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="rounded-2xl shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ChevronRight className="w-5 h-5 text-blue-500" />
            פעולות מהירות
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-20 flex-col gap-2 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-700">
              <Users className="w-6 h-6" />
              ניהול משתמשים
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2 text-green-800 dark:text-green-200 border-green-200 dark:border-green-700">
              <BookOpen className="w-6 h-6" />
              הוספת קורס
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2 text-purple-700 dark:text-purple-200 border-purple-200 dark:border-purple-700">
              <MessageSquare className="w-6 h-6" />
              ניהול ביקורות
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2 text-orange-700 dark:text-orange-200 border-orange-200 dark:border-orange-700">
              <Calendar className="w-6 h-6" />
              מפגשים פעילים
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdvancedAdminDashboard;
