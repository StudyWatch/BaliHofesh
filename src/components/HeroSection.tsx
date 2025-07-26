import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, GraduationCap, Calendar, Users } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useAllCourses } from '@/hooks/useCourses';
import { useNavigate } from 'react-router-dom';

const HeroSection = () => {
  const { t, dir } = useLanguage();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [open, setOpen] = useState(false);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const { data: allCourses = [] } = useAllCourses();

  const scrollToResultsRef = useRef<HTMLDivElement | null>(null); // רפרנס לגלילה

  useEffect(() => {
    if (searchTerm.length > 1) {
      const filtered = allCourses.filter((c) =>
        c.name_he?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.code?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredCourses(filtered.slice(0, 8));
      setOpen(true);
    } else {
      setOpen(false);
      setFilteredCourses([]);
    }
  }, [searchTerm, allCourses]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setOpen(false);

    if (scrollToResultsRef.current) {
      scrollToResultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-blue-50 via-teal-50 to-white animate-gradient-x">
      <div className="container mx-auto px-4 py-16 relative z-10" dir={dir}>
        <div className="text-center max-w-4xl mx-auto">
          {/* כותרת */}
          <div className="hero-title-improved inline-block mb-8 animate-fade-in">
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              <span className="text-gray-900">באלי</span>{' '}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">חופש</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-700 font-medium">{t('home.subtitle')}</p>
          </div>

          {/* שורת חיפוש עם הצעות */}
          <div className="max-w-2xl mx-auto mb-12 animate-slide-up delay-200">
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <form onSubmit={handleSubmit}>
                  <div className="relative flex rounded-2xl bg-white/90 backdrop-blur-sm shadow-2xl border border-white/20 p-2">
                    <Input
                      type="text"
                      placeholder={t('home.search_placeholder') || 'חפש קורס לפי שם או מספר קורס'}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="flex-1 border-0 bg-transparent text-lg px-4 py-4 focus:ring-0 focus:outline-none placeholder:text-gray-500"
                    />
                    <Button
                      type="submit"
                      className="bg-gradient-primary hover:opacity-90 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-200 hover:scale-105"
                    >
                      <Search className="w-5 h-5 mr-2" />
                      {t('common.search')}
                    </Button>
                  </div>
                </form>
              </PopoverTrigger>
              <PopoverContent className="w-full p-2 max-h-96 overflow-y-auto text-right rounded-xl shadow-xl z-50">
                {filteredCourses.length > 0 ? (
                  filteredCourses.map((course) => (
                    <div
                      key={course.id}
                      className="p-3 hover:bg-blue-100 cursor-pointer rounded-lg"
                      onClick={() => {
                        navigate(`/courses/${course.id}`);
                        setOpen(false);
                      }}
                    >
                      <div className="font-semibold">{course.name_he}</div>
                      <div className="text-sm text-gray-500">{course.code}</div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500 py-2">לא נמצאו תוצאות</p>
                )}
              </PopoverContent>
            </Popover>
          </div>

          {/* קלפים של סטטיסטיקות */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-slide-up delay-400">
            <div className="text-center p-6 rounded-2xl bg-white/80 shadow-lg">
              <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center mx-auto mb-4">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">500+</h3>
              <p className="text-gray-600">{t('home.stats.institutions')}</p>
            </div>
            <div className="text-center p-6 rounded-2xl bg-white/80 shadow-lg">
              <div className="w-12 h-12 bg-gradient-exam rounded-xl flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">10,000+</h3>
              <p className="text-gray-600">{t('home.stats.exams')}</p>
            </div>
            <div className="text-center p-6 rounded-2xl bg-white/80 shadow-lg">
              <div className="w-12 h-12 bg-gradient-institution rounded-xl flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">50,000+</h3>
              <p className="text-gray-600">{t('home.stats.students')}</p>
            </div>
          </div>

          {/* רפרנס לגלילה אליו (אל תזיז מכאן) */}
          <div ref={scrollToResultsRef} className="h-1 mt-10"></div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
