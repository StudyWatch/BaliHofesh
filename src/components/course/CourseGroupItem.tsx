import React from 'react';
import { MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface CourseGroupItemProps {
  courseId: string;
  courseName?: string;
}

const CourseGroupItem: React.FC<CourseGroupItemProps> = ({ courseId, courseName }) => {
  return (
    <div className="flex flex-col border rounded-lg p-3 gap-2 hover:bg-muted/50 transition">
      <div className="flex items-center gap-2">
        <MessageSquare className="w-4 h-4 text-blue-500" />
        <span className="font-medium">{courseName || 'ללא שם קורס'}</span>
        <Badge className="text-xs">צ'אט</Badge>
      </div>
      <Button
        variant="secondary"
        size="sm"
        className="self-start text-xs"
        onClick={() =>
          alert(`כאן נוכל לפתוח קישור לקבוצת הקורס ${courseId} או מסך מפגשים`)
        }
      >
        הצג פרטים
      </Button>
    </div>
  );
};

export default CourseGroupItem;
