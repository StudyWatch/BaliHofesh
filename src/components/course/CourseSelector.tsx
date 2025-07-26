import React, { useState } from 'react';
import { Check, ChevronsUpDown, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { useAllCourses } from '@/hooks/useCourses';

interface SelectedCourse {
  id: string;
  name_he: string;
  code?: string;
  institution_name?: string;
  grade?: number;
}

interface CourseSelectorProps {
  selectedCourses: SelectedCourse[];
  onCoursesChange: (courses: SelectedCourse[]) => void;
  isStudent: boolean;
  onGradeChange: (courseId: string, grade: number) => void;
}

const CourseSelector: React.FC<CourseSelectorProps> = ({
  selectedCourses,
  onCoursesChange,
  isStudent,
  onGradeChange
}) => {
  const [open, setOpen] = useState(false);
  const { data: courses = [], isLoading } = useAllCourses();

  const addCourse = (course: any) => {
    const newCourse: SelectedCourse = {
      id: course.id,
      name_he: course.name_he,
      code: course.code,
      institution_name: course.institutions?.name_he
    };
    
    if (!selectedCourses.find(c => c.id === course.id)) {
      onCoursesChange([...selectedCourses, newCourse]);
    }
    setOpen(false);
  };

  const removeCourse = (courseId: string) => {
    onCoursesChange(selectedCourses.filter(c => c.id !== courseId));
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium mb-2 block">קורסים שאתה מלמד *</label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between"
            >
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4" />
                בחר קורס...
              </div>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0">
            <Command>
              <CommandInput placeholder="חפש קורס..." />
              <CommandEmpty>לא נמצאו קורסים.</CommandEmpty>
              <CommandList>
                <CommandGroup>
                  {courses.map((course) => (
                    <CommandItem
                      key={course.id}
                      value={course.name_he + ' ' + (course.code || '')}
                      onSelect={() => addCourse(course)}
                      className="flex items-center justify-between"
                    >
                      <div className="flex-1">
                        <div className="font-medium">{course.name_he}</div>
                        <div className="text-sm text-gray-500">
                          {course.code && `קוד: ${course.code}`} • {course.institutions?.name_he}
                        </div>
                      </div>
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedCourses.find(c => c.id === course.id) ? "opacity-100" : "opacity-0"
                        )}
                      />
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {/* Selected Courses */}
      <div className="space-y-3">
        {selectedCourses.map((course) => (
          <div key={course.id} className="p-3 border rounded-lg bg-gray-50">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h4 className="font-medium">{course.name_he}</h4>
                <p className="text-sm text-gray-600">
                  {course.code && `קוד: ${course.code}`} • {course.institution_name}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeCourse(course.id)}
                className="text-red-600 hover:text-red-800"
              >
                הסר
              </Button>
            </div>
            
            {isStudent && (
              <div className="mt-2">
                <label className="block text-sm font-medium mb-1">
                  מה היה הציון שלך בקורס זה? *
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  className="w-20 px-2 py-1 border rounded text-center"
                  placeholder="85"
                  onChange={(e) => {
                    const grade = parseInt(e.target.value);
                    if (grade >= 0 && grade <= 100) {
                      onGradeChange(course.id, grade);
                    }
                  }}
                />
                <span className="ml-2 text-sm text-gray-600">נקודות</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {selectedCourses.length === 0 && (
        <div className="text-center py-4 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
          בחר קורסים שאתה מעוניין ללמד
        </div>
      )}
    </div>
  );
};

export default CourseSelector;