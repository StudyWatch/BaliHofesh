import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, MapPin, Clock, Phone, Mail, GraduationCap, BookOpen } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import TutorApplicationForm from '@/components/forms/TutorApplicationForm';

interface RelevantTutorsProps {
  courseId: string;
  courseName: string;
}

const RelevantTutors = ({ courseId, courseName }: RelevantTutorsProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [showApplicationForm, setShowApplicationForm] = useState(false);

  const { data: tutors, isLoading } = useQuery({
    queryKey: ['course-tutors', courseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tutor_courses')
        .select(`
          tutor:tutors (
            id,
            name,
            avatar_url,
            rating,
            reviews_count,
            hourly_rate,
            location,
            phone,
            email,
            experience,
            description,
            availability,
            is_online,
            is_verified
          )
        `)
        .eq('course_id', courseId)
        .eq('tutor.is_verified', true);

      if (error) throw error;

      // סינון מורים אם קרה מצב של נתונים ריקים
      return data?.map((item: any) => item.tutor).filter(Boolean) || [];
    }
  });

  const handleContactTutor = (tutor: any) => {
    if (tutor.phone) {
      window.open(`tel:${tutor.phone}`, '_blank');
    } else if (tutor.email) {
      window.open(`mailto:${tutor.email}?subject=שיעור פרטי ב${courseName}`, '_blank');
    } else {
      toast({
        title: "אין פרטי קשר",
        description: "לא נמצאו פרטי קשר עבור המורה הזה.",
        variant: "destructive"
      });
    }
  };

  const renderJoinBanner = (compact = false) => (
    <Card
      className={`${
        compact
          ? 'p-4 flex flex-col justify-between border-dashed border-2 border-purple-400 text-center'
          : 'p-8 text-center bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-2xl shadow-lg'
      }`}
    >
      <div className="flex-1 flex flex-col items-center justify-center">
        <BookOpen className={`mb-2 ${compact ? 'w-8 h-8 text-purple-500' : 'w-16 h-16 mx-auto'}`} />
        <h3 className={`font-bold ${compact ? 'text-lg text-purple-700' : 'text-2xl mb-2'}`}>
          דרושים מורים נוספים!
        </h3>
        <p className={`opacity-90 ${compact ? 'text-sm text-gray-500' : 'text-lg mb-4'}`}>
          רוצים להצטרף? עזרו לסטודנטים להצליח בקורס {courseName}.
        </p>
      </div>
      <Button
        size={compact ? 'sm' : 'lg'}
        variant={compact ? 'outline' : 'secondary'}
        className={`mt-3 ${compact ? 'text-purple-700 border-purple-400' : 'bg-white text-purple-700 hover:bg-gray-100'}`}
        onClick={() => setShowApplicationForm(true)}
      >
        הצטרפו כמורים
      </Button>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h2 className="text-3xl font-bold text-center text-purple-700">🧑‍🏫 מורים פרטיים רלוונטיים</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse shadow rounded-xl">
              <CardContent className="p-6">
                <div className="w-16 h-16 bg-gray-200 rounded-full mb-4"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded mb-4"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-purple-700 mb-2">🧑‍🏫 מורים פרטיים ב{courseName}</h2>
        <p className="text-gray-500">מומחים בקורס זה, זמינים לעזור לך להצליח!</p>
      </div>

      {(!tutors || tutors.length === 0) ? (
        renderJoinBanner()
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tutors.map((tutor) => (
            <Card
              key={tutor.id}
              className="group rounded-xl shadow-lg hover:shadow-2xl transition-transform duration-300 hover:-translate-y-1 border-l-4 border-l-purple-500"
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200">
                    {tutor.avatar_url ? (
                      <img src={tutor.avatar_url} alt={tutor.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex items-center justify-center h-full text-white font-bold text-xl bg-gradient-to-br from-purple-500 to-indigo-500">
                        {tutor.name?.charAt(0) || 'מ'}
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-gray-900 group-hover:text-purple-600 transition-colors">
                      {tutor.name}
                    </h3>
                    {tutor.experience && (
                      <p className="text-sm text-gray-600 mb-2">{tutor.experience}</p>
                    )}
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-semibold text-sm">{tutor.rating}</span>
                      </div>
                      <span className="text-xs text-gray-500">
                        ({tutor.reviews_count} ביקורות)
                      </span>
                      {tutor.is_online && (
                        <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
                          זמין עכשיו
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="space-y-2 mb-4">
                  {tutor.location && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4" />
                      <span>{tutor.location}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-gray-900 font-semibold">
                    <Clock className="w-4 h-4" />
                    <span>₪{tutor.hourly_rate}/שעה</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => navigate(`/tutor/${tutor.id}`)}
                    variant="outline"
                    className="flex-1"
                    size="sm"
                  >
                    <GraduationCap className="w-4 h-4 mr-1" />
                    פרופיל מלא
                  </Button>
                  <Button
                    onClick={() => handleContactTutor(tutor)}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
                    size="sm"
                  >
                    {tutor.phone ? (
                      <>
                        <Phone className="w-4 h-4 mr-1" />
                        התקשר
                      </>
                    ) : (
                      <>
                        <Mail className="w-4 h-4 mr-1" />
                        צור קשר
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {tutors.length < 3 && renderJoinBanner(true)}
        </div>
      )}

      <TutorApplicationForm
        isOpen={showApplicationForm}
        onClose={() => setShowApplicationForm(false)}
      />
    </div>
  );
};

export default RelevantTutors;
