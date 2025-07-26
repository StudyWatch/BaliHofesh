
import React, { useState } from 'react';
import { Calendar, Clock, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useExamDates } from '@/hooks/useExamDates';
import AddToCalendarButton from './AddToCalendarButton';

interface ExamDatesSectionProps {
  courseId: string;
  examDate?: string; // Fallback for backward compatibility
}

const ExamDatesSection = ({ courseId, examDate }: ExamDatesSectionProps) => {
  const [showAllDates, setShowAllDates] = useState(false);
  const { data: examDates, isLoading } = useExamDates(courseId);
  
  // Use exam_dates from database, or fallback to single examDate
  const getExamDates = () => {
    if (examDates && examDates.length > 0) {
      return examDates.map(exam => ({
        type: exam.exam_type,
        date: exam.exam_date,
        time: exam.exam_time
      })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }
    
    if (examDate) {
      // Fallback: create default dates based on single date
      const baseDate = new Date(examDate);
      const moedA2 = new Date(baseDate);
      moedA2.setDate(moedA2.getDate() + 14);
      const moedB = new Date(baseDate);
      moedB.setDate(moedB.getDate() + 30);
      
      return [
        { type: "מועד א'", date: baseDate.toISOString().split('T')[0], time: "13:00" },
        { type: "מועד א2", date: moedA2.toISOString().split('T')[0], time: "09:00" },
        { type: "מועד ב'", date: moedB.toISOString().split('T')[0], time: "09:00" }
      ];
    }
    
    return [];
  };

  const allDates = getExamDates();
  const displayedDates = showAllDates ? allDates : allDates.slice(0, 2);

  const getDateStatus = (dateString: string) => {
    const examDate = new Date(dateString);
    const today = new Date();
    const diffTime = examDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { status: 'past', color: 'gray', text: 'עבר' };
    if (diffDays <= 7) return { status: 'soon', color: 'red', text: `${diffDays} ימים` };
    if (diffDays <= 30) return { status: 'upcoming', color: 'orange', text: `${diffDays} ימים` };
    return { status: 'future', color: 'blue', text: `${diffDays} ימים` };
  };

  if (isLoading) {
    return (
      <Card className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 shadow-lg">
        <CardContent className="p-6">
          <div className="animate-pulse text-center">טוען מועדי בחינות...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-8 bg-gradient-to-r from-red-50 via-orange-50 to-yellow-50 border-orange-200 shadow-2xl">
      <CardContent className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-r from-red-600 to-orange-600 p-3 rounded-full shadow-lg">
              <Calendar className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
                מועדי בחינות
              </h2>
              <p className="text-orange-700 font-medium">לוח זמנים מעודכן לבחינות</p>
            </div>
          </div>
          <div className="bg-white/80 px-4 py-2 rounded-full border border-orange-200">
            <span className="text-orange-800 font-medium">🎯 הגיעו מוכנים!</span>
          </div>
        </div>
        
        {allDates.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              {displayedDates.map((exam, index) => {
                const dateStatus = getDateStatus(exam.date);
                const isMain = index < 2; // First two are main dates
                
                return (
                  <div 
                    key={index} 
                    className={`bg-white rounded-2xl p-6 shadow-xl border-2 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 ${
                      isMain 
                        ? 'border-orange-300 bg-gradient-to-br from-white to-orange-25' 
                        : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <Badge 
                        className={`px-4 py-2 text-base font-bold rounded-full ${
                          dateStatus.status === 'soon' 
                            ? 'bg-red-100 text-red-800 border-red-300' 
                            : dateStatus.status === 'upcoming'
                            ? 'bg-orange-100 text-orange-800 border-orange-300'
                            : dateStatus.status === 'past'
                            ? 'bg-gray-100 text-gray-600 border-gray-300'
                            : 'bg-blue-100 text-blue-800 border-blue-300'
                        }`}
                      >
                        {exam.type}
                      </Badge>
                      {dateStatus.status === 'soon' && (
                        <div className="bg-red-100 p-2 rounded-full">
                          <AlertTriangle className="w-5 h-5 text-red-600" />
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 text-gray-800">
                        <div className="bg-orange-100 p-2 rounded-full">
                          <Calendar className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                          <span className="font-bold text-xl">
                            {new Date(exam.date).toLocaleDateString('he-IL', {
                              weekday: 'long',
                              day: 'numeric',
                              month: 'long'
                            })}
                          </span>
                          <div className="text-sm text-gray-600">
                            {new Date(exam.date).getFullYear()}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 text-gray-700">
                        <div className="bg-blue-100 p-2 rounded-full">
                          <Clock className="w-5 h-5 text-blue-600" />
                        </div>
                        <span className="text-xl font-semibold">{exam.time}</span>
                      </div>
                      
                      <div className={`p-3 rounded-lg text-center font-bold ${
                        dateStatus.status === 'past' 
                          ? 'bg-gray-100 text-gray-600' 
                          : dateStatus.status === 'soon'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {dateStatus.status === 'past' 
                          ? '✓ הבחינה הסתיימה' 
                          : `⏰ נותרו ${dateStatus.text}`
                        }
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {allDates.length > 2 && (
              <div className="text-center">
                <Button
                  variant="outline"
                  onClick={() => setShowAllDates(!showAllDates)}
                  className="px-6 py-3 border-orange-300 text-orange-700 hover:bg-orange-50"
                >
                  {showAllDates ? (
                    <>
                      <ChevronUp className="w-4 h-4 ml-2" />
                      הסתר מועדים נוספים
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4 ml-2" />
                      הצג את כל המועדים ({allDates.length - 2} נוספים)
                    </>
                  )}
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="bg-white rounded-2xl p-12 text-center shadow-xl">
            <div className="bg-orange-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
              <Calendar className="w-12 h-12 text-orange-600" />
            </div>
            <h3 className="text-2xl font-bold text-orange-800 mb-3">מועדי הבחינה יפורסמו בהמשך</h3>
            <p className="text-orange-600 text-lg">עקבו אחר העדכונים באתר האוניברסיטה</p>
          </div>
          )}
          
          {/* Add to Calendar Button */}
          <div className="text-center mt-6">
            <AddToCalendarButton 
              courseId={courseId}
              courseName="הקורס"
              courseCode={undefined}
            />
          </div>
        </CardContent>
      </Card>
    );
  };

export default ExamDatesSection;
