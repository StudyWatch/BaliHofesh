import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp,
  BookOpen,
  Users,
  Video,
  MessageCircle,
  Award,
  Target,
  Star
} from 'lucide-react';

interface StatsData {
  favoriteCourses: number;
  partnershipsCreated: number;
  sessionsCreated: number;
  messagesSent: number;
}

interface ActivityStatsCardProps {
  stats: StatsData | null;
}

const ActivityStatsCard: React.FC<ActivityStatsCardProps> = ({ stats }) => {
  if (!stats) {
    return (
      <Card className="h-full">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalActivity = stats.partnershipsCreated + stats.sessionsCreated + stats.messagesSent;
  const activityLevel = totalActivity > 20 ? 'מתקדם' : totalActivity > 10 ? 'בינוני' : 'מתחיל';
  const activityProgress = Math.min((totalActivity / 30) * 100, 100);

  const statItems = [
    {
      label: 'קורסים',
      value: stats.favoriteCourses,
      icon: BookOpen,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      label: 'שותפויות',
      value: stats.partnershipsCreated,
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      label: 'מפגשים',
      value: stats.sessionsCreated,
      icon: Video,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      label: 'הודעות',
      value: stats.messagesSent,
      icon: MessageCircle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    }
  ];

  return (
    <Card className="h-full">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-xl">
          <div className="p-2 bg-green-100 rounded-lg">
            <TrendingUp className="w-5 h-5 text-green-600" />
          </div>
          הפעילות שלי
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Activity Level */}
        <div className="text-center p-4 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Award className="w-5 h-5 text-primary" />
            <span className="font-semibold">רמת פעילות: {activityLevel}</span>
          </div>
          <Progress value={activityProgress} className="h-2 mb-2" />
          <p className="text-xs text-muted-foreground">
            {totalActivity} פעילויות בסך הכל
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          {statItems.map((item) => (
            <div 
              key={item.label}
              className={`p-4 ${item.bgColor} rounded-lg text-center transition-transform hover:scale-105`}
            >
              <div className={`inline-flex p-2 rounded-lg bg-white/50 mb-2`}>
                <item.icon className={`w-5 h-5 ${item.color}`} />
              </div>
              <div className={`text-2xl font-bold ${item.color}`}>
                {item.value}
              </div>
              <div className="text-sm text-gray-600">
                {item.label}
              </div>
            </div>
          ))}
        </div>

        {/* Achievement Badges */}
        <div className="space-y-3">
          <h4 className="font-semibold text-sm flex items-center gap-2">
            <Star className="w-4 h-4 text-yellow-500" />
            הישגים
          </h4>
          
          <div className="flex flex-wrap gap-2">
            {stats.partnershipsCreated >= 5 && (
              <div className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                <Users className="w-3 h-3" />
                יוצר שותפויות
              </div>
            )}
            {stats.sessionsCreated >= 3 && (
              <div className="flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">
                <Video className="w-3 h-3" />
                מארגן מפגשים
              </div>
            )}
            {totalActivity >= 20 && (
              <div className="flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs">
                <Target className="w-3 h-3" />
                פעיל במיוחד
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ActivityStatsCard;