
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { BookOpen, Calendar, Users, Search } from 'lucide-react';

const Universities = () => {
  const navigate = useNavigate();
  const { t, dir } = useLanguage();
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');

  useEffect(() => {
    setSearchTerm(searchParams.get('search') || '');
  }, [searchParams]);

  // Fetch Open University data
  const { data: openUniversity } = useQuery({
    queryKey: ['open-university'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('institutions')
        .select('*')
        .eq('name_he', 'האוניברסיטה הפתוחה')
        .single();
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch all Open University courses
  const { data: courses = [], isLoading } = useQuery({
    queryKey: ['open-university-courses'],
    queryFn: async () => {
      if (!openUniversity?.id) return [];
      
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('institution_id', openUniversity.id)
        .order('name_he');
      
      if (error) throw error;
      return data;
    },
    enabled: !!openUniversity?.id
  });

  // Filter courses based on search term
  const filteredCourses = courses.filter(course => 
    course.name_he.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.name_en?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCourseClick = (courseId: string) => {
    navigate(`/course/${courseId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50" dir={dir}>
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            קורסי האוניברסיטה הפתוחה
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto mb-8">
            חפש וגלה את כל הקורסים הזמינים באוניברסיטה הפתוחה. למד עם קבוצות, מצא שותפי למידה והצטרף למפגשי לימוד
          </p>
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="חפש קורס לפי שם או מספר קורס..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-4 pr-12 py-3 text-lg text-right"
              />
            </div>
          </div>
        </div>

        {/* Institution Info */}
        {openUniversity && (
          <div className="mb-8">
            <Card className="border-2 border-primary/20">
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div 
                    className="w-16 h-16 rounded-lg flex items-center justify-center text-white font-bold text-xl"
                    style={{ backgroundColor: openUniversity.color }}
                  >
                    פ
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      האוניברסיטה הפתוחה
                    </h2>
                    <p className="text-gray-600">
                      לימודים גמישים ונגישים במגוון תחומים אקדמיים
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-blue-500" />
                    <span>{courses.length} קורסים זמינים</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-green-500" />
                    <span>קבוצות ושיתוף פעולה</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Results Summary */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-gray-900">
              {searchTerm ? `תוצאות חיפוש: "${searchTerm}"` : 'כל הקורסים'}
              <span className="text-gray-500 mr-2">({filteredCourses.length})</span>
            </h3>
            {searchTerm && (
              <Button onClick={() => setSearchTerm('')} variant="outline" size="sm">
                נקה חיפוש
              </Button>
            )}
          </div>
        </div>

        {/* Courses Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="text-xl text-gray-600">טוען קורסים...</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => (
              <Card 
                key={course.id}
                className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/20 cursor-pointer hover:-translate-y-1"
                onClick={() => handleCourseClick(course.id)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <CardTitle className="text-lg font-bold text-right flex-1 group-hover:text-primary transition-colors">
                      {course.name_he}
                    </CardTitle>
                    {course.code && (
                      <Badge variant="secondary" className="mr-2">
                        {course.code}
                      </Badge>
                    )}
                  </div>
                  {course.name_en && (
                    <p className="text-sm text-gray-500 text-right">
                      {course.name_en}
                    </p>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {course.semester && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <BookOpen className="w-4 h-4" />
                        <span>סמסטר: {course.semester}</span>
                      </div>
                    )}
                    {course.exam_date && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span>מועד בחינה: {new Date(course.exam_date).toLocaleDateString('he-IL')}</span>
                      </div>
                    )}
                    {course.enable_collaboration && (
                      <div className="flex items-center gap-2 text-sm text-green-600">
                        <Users className="w-4 h-4" />
                        <span>קבוצות ושיתוף פעולה זמינים</span>
                      </div>
                    )}
                  </div>
                  <Button
                    className="w-full mt-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCourseClick(course.id);
                    }}
                  >
                    צפה בפרטי הקורס
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!isLoading && filteredCourses.length === 0 && (
          <div className="text-center py-12">
            <div className="text-xl text-gray-600 mb-4">
              {searchTerm ? 'לא נמצאו קורסים המתאימים לחיפוש' : 'אין קורסים זמינים כרגע'}
            </div>
            {searchTerm && (
              <Button onClick={() => setSearchTerm('')} variant="outline">
                נקה חיפוש
              </Button>
            )}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default Universities;
