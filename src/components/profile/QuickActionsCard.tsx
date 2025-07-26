import React from 'react';
import {
  Calendar,
  Users,
  MessageSquare,
  Video,
  Bell,
  Settings,
  TrendingUp,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface QuickActionsCardProps {
  onActionClick: (action: string) => void;
}

const actions = [
  {
    id: 'calendar',
    title: 'לוח שנה',
    description: 'צפה בבחינות ואירועים',
    icon: Calendar,
    gradient: 'from-blue-500 to-indigo-600',
  },
  {
    id: 'study-partners',
    title: 'שותפי לימוד',
    description: 'מצא שותפי לימוד חדשים',
    icon: Users,
    gradient: 'from-green-500 to-emerald-500',
  },
  {
    id: 'messages',
    title: 'הודעות',
    description: 'הודעות פרטיות וקבוצתיות',
    icon: MessageSquare,
    gradient: 'from-purple-500 to-pink-500',
  },
  {
    id: 'sessions',
    title: 'מפגשי לימוד',
    description: 'מפגשים וירטואליים',
    icon: Video,
    gradient: 'from-orange-500 to-yellow-400',
  },
];

const QuickActionsCard: React.FC<QuickActionsCardProps> = ({ onActionClick }) => {
  return (
    <Card className="h-full w-full">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-xl">
          <div className="p-2 bg-primary/10 rounded-lg">
            <TrendingUp className="w-5 h-5 text-primary" />
          </div>
          פעולות מהירות
        </CardTitle>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {actions.map((action) => (
            <div
              key={action.id}
              onClick={() => onActionClick(action.id)}
              className={`cursor-pointer rounded-xl p-4 flex flex-col items-center justify-center text-white bg-gradient-to-br ${action.gradient} transition-all duration-200 hover:scale-105 shadow-md`}
            >
              <action.icon className="w-8 h-8 mb-2" />
              <div className="font-bold text-base">{action.title}</div>
              <div className="text-sm opacity-90">{action.description}</div>
            </div>
          ))}
        </div>

        {/* הגדרות נוספות */}
        <div className="mt-6 pt-6 border-t grid gap-3">
          <Button
            variant="outline"
            size="lg"
            onClick={() => onActionClick('notifications')}
            className="w-full justify-start text-base font-semibold rounded-xl"
          >
            <Bell className="w-5 h-5 ml-3 text-primary" />
            הגדרות התראות
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => onActionClick('settings')}
            className="w-full justify-start text-base font-semibold rounded-xl"
          >
            <Settings className="w-5 h-5 ml-3 text-primary" />
            הגדרות כלליות
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickActionsCard;
