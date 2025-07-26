import React from 'react';
import { Link } from 'react-router-dom'; // ✅ חשוב
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  BookOpen,
  Plus,
  ArrowRight,
  GraduationCap,
  Clock,
} from 'lucide-react';

interface FavoriteCoursesProps {
  courses: any[];
  onAddCourse: () => void;
  onViewAll: () => void;
}

const FavoriteCoursesSection: React.FC<FavoriteCoursesProps> = ({
  courses,
  onAddCourse,
  onViewAll,
}) => {
  return (
    <Card className="h-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-xl">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BookOpen className="w-5 h-5 text-blue-600" />
            </div>
            הקורסים שלי
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={onAddCourse}
            className="flex items-center gap-2 hover:bg-primary hover:text-white transition-colors"
          >
            <Plus className="w-4 h-4" />
            הוסף קורס
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {courses.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-muted-foreground mb-2">
              עדיין לא הוספת קורסים
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              הוסף את הקורסים שלך כדי להתחיל ליצור קשרים ולמצוא שותפי לימוד
            </p>
            <Button onClick={onAddCourse} className="mt-2">
              <Plus className="w-4 h-4 mr-2" />
              הוסף קורס ראשון
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {courses.slice(0, 3).map((course: any) => {
              const courseId = course.courses?.id || course.course_id || course.id;
              const courseSlug = course.courses?.slug || course.slug || '';
              const courseUrl = `/courses/${courseId}`;

              return (
                <Link
                  key={courseId}
                  to={courseUrl}
                  className="block group p-4 border rounded-xl hover:shadow-md transition-all duration-300 hover:border-primary/30"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{
                            backgroundColor: course.courses?.institutions?.color || '#3B82F6',
                          }}
                        />
                        <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                          {course.courses?.name_he}
                        </h4>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <GraduationCap className="w-3 h-3" />
                          {course.courses?.institutions?.name_he}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {course.semester}
                        </span>
                      </div>
                    </div>

                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </div>

                  <div className="flex items-center gap-2 mt-3">
                    <Badge variant="secondary" className="text-xs">
                      {course.courses?.code}
                    </Badge>
                    <Badge
                      variant={course.status === 'active' ? 'default' : 'outline'}
                      className="text-xs"
                    >
                      {course.status === 'active' ? 'פעיל' : 'לא פעיל'}
                    </Badge>
                  </div>
                </Link>
              );
            })}

            {courses.length > 3 && (
              <Button
                variant="ghost"
                onClick={onViewAll}
                className="w-full mt-4 text-primary hover:bg-primary/10"
              >
                צפה בכל הקורסים ({courses.length})
                <ArrowRight className="w-4 h-4 mr-2" />
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FavoriteCoursesSection;
