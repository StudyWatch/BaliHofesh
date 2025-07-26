
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
// Temporarily using empty data until real data hooks are available
const institutions: any[] = [];
const courses: any[] = [];
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, ArrowRight, ArrowLeft, BookOpen } from 'lucide-react';

const Institution = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, dir } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');

  const institution = institutions.find(inst => inst.id === id);
  const institutionCourses = courses.filter(course => course.institutionId === id);
  
  const filteredCourses = institutionCourses.filter(course =>
    course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.lecturer?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!institution) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center">
          <h1 className="text-2xl font-bold mb-4">מוסד לא נמצא</h1>
          <Button onClick={() => navigate('/')}>חזור לדף הבית</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen" dir={dir} style={{ backgroundColor: `${institution.colorCode}10` }}>
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className="flex items-center gap-2"
            >
              {dir === 'rtl' ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
              חזור לדף הבית
            </Button>
            <div 
              className="w-16 h-16 rounded-lg flex items-center justify-center text-white font-bold text-2xl"
              style={{ backgroundColor: institution.colorCode }}
            >
              {institution.shortName.charAt(0)}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{institution.name}</h1>
              <p className="text-gray-600">{institution.description}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Search Courses */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              חיפוש קורסים
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <Input
                type="text"
                placeholder="חפש לפי שם קורס, קוד או מרצה..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
              />
              <Button style={{ backgroundColor: institution.colorCode }}>
                <Search className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Courses Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <Card 
              key={course.id} 
              className="hover:shadow-lg transition-all duration-300 cursor-pointer border-2 hover:border-opacity-50"
              style={{ borderColor: institution.colorCode }}
              onClick={() => navigate(`/course/${course.id}`)}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div 
                    className="px-3 py-1 rounded-full text-white text-sm font-medium"
                    style={{ backgroundColor: institution.colorCode }}
                  >
                    {course.code}
                  </div>
                  <BookOpen className="w-5 h-5 text-gray-400" />
                </div>
                
                <h3 className="font-bold text-gray-900 mb-2 line-clamp-2">
                  {course.name}
                </h3>
                
                {course.lecturer && (
                  <p className="text-gray-600 text-sm mb-4">
                    מרצה: {course.lecturer}
                  </p>
                )}

                <Button 
                  variant="outline" 
                  className="w-full"
                  style={{ borderColor: institution.colorCode, color: institution.colorCode }}
                >
                  צפה במועדי בחינה
                  {dir === 'rtl' ? <ArrowLeft className="w-4 h-4 mr-2" /> : <ArrowRight className="w-4 h-4 ml-2" />}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredCourses.length === 0 && (
          <Card className="p-8 text-center">
            <h3 className="text-xl font-semibold mb-2">לא נמצאו קורסים</h3>
            <p className="text-gray-600">נסה לחפש במילים אחרות או נקה את שדה החיפוש</p>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Institution;
