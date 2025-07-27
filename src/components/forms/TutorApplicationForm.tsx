import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { User, Mail, Phone, Clock, MapPin, DollarSign, GraduationCap, UploadCloud } from 'lucide-react';
import CourseSelector from '@/components/course/CourseSelector';
import { Checkbox } from '@/components/ui/checkbox';

interface TutorApplicationFormProps {
  isOpen: boolean;
  onClose: () => void;
}

const TutorApplicationForm: React.FC<TutorApplicationFormProps> = ({ isOpen, onClose }) => {
  const { dir } = useLanguage();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    experience: '',
    description: '',
    hourly_rate: '',
    location: '',
    availability: '',
    acceptedTerms: false // ✅ שדה חדש – אישור תנאים
  });
  const [selectedCourses, setSelectedCourses] = useState<{id: string; name_he: string; code?: string; institution_name?: string; grade?: number}[]>([]);
  const [isStudent, setIsStudent] = useState(false);
  const [courseGrades, setCourseGrades] = useState<{[courseId: string]: number}>({});
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleCourseGradeChange = (courseId: string, grade: number) => {
    setCourseGrades(prev => ({
      ...prev,
      [courseId]: grade
    }));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAvatarFile(e.target.files[0]);
      setAvatarPreview(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // ✅ חסימת שליחה אם לא סומן אישור תנאים
    if (!formData.acceptedTerms) {
      alert('יש לאשר את תנאי השימוש למורים פרטיים לפני השליחה.');
      setIsSubmitting(false);
      return;
    }

    try {
      // העלאת תמונת פרופיל ל־Supabase Storage
      let avatarUrl: string | null = null;
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${fileExt}`;
        const { error: uploadError } = await supabase
          .storage
          .from('tutor-avatars')
          .upload(fileName, avatarFile);

        if (uploadError) throw uploadError;

        const { data } = supabase
          .storage
          .from('tutor-avatars')
          .getPublicUrl(fileName);
        avatarUrl = data.publicUrl;
      }

      // subjects בפורמט string[]
      const subjects = selectedCourses.map(course => {
        let courseTitle = course.name_he;
        if (course.code) courseTitle += ` (${course.code})`;
        if (isStudent && courseGrades[course.id]) {
          courseTitle += ` - ציון: ${courseGrades[course.id]}`;
        }
        return courseTitle;
      });

      const { error } = await supabase
        .from('tutor_applications')
        .insert([{
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          subjects: subjects,
          experience: formData.experience,
          description: formData.description,
          hourly_rate: formData.hourly_rate ? parseInt(formData.hourly_rate) : null,
          location: formData.location,
          availability: formData.availability,
          avatar_url: avatarUrl,
          // ניתן להוסיף פה בעתיד: accepted_terms: formData.acceptedTerms
        }]);

      if (error) throw error;

      setIsSubmitted(true);
      setTimeout(() => {
        onClose();
        setIsSubmitted(false);
        setFormData({
          name: '',
          email: '',
          phone: '',
          experience: '',
          description: '',
          hourly_rate: '',
          location: '',
          availability: '',
          acceptedTerms: false // אפס את התיבה
        });
        setSelectedCourses([]);
        setIsStudent(false);
        setCourseGrades({});
        setAvatarFile(null);
        setAvatarPreview(null);
      }, 2000);
    } catch (error) {
      console.error('Error submitting application:', error);
      alert('שגיאה בשליחת הבקשה. אנא נסה שוב.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md" dir={dir}>
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">תודה רבה!</h3>
            <p className="text-gray-600">
              הבקשה שלך נשלחה בהצלחה. נחזור אליך בהקדם האפשרי.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir={dir}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <GraduationCap className="w-6 h-6 text-blue-600" />
            הצטרפות כמורה פרטי
          </DialogTitle>
          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800 font-medium">
              🎓 <strong>מורים פרטיים? סטודנטים מצטיינים? בואו ללמד!</strong>
            </p>
            <p className="text-xs text-blue-700 mt-1">
              הוסיפו קורסים אותם אתם מלמדים (אפשר לבחור יותר מאחד), ואם למדתם את הקורס – ציינו את הציון.
            </p>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* העלאת תמונת פרופיל */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium">
              <UploadCloud className="w-4 h-4" />
              תמונת פרופיל (אופציונלי)
            </label>
            <Input
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
            />
            {avatarPreview && (
              <div className="mt-2">
                <img
                  src={avatarPreview}
                  alt="Avatar Preview"
                  className="w-20 h-20 rounded-full border"
                />
              </div>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium">
                <User className="w-4 h-4" />
                שם מלא *
              </label>
              <Input
                required
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="הכנס את שמך המלא"
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium">
                <Mail className="w-4 h-4" />
                אימייל *
              </label>
              <Input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="example@email.com"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium">
                <Phone className="w-4 h-4" />
                טלפון
              </label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="050-1234567"
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium">
                <DollarSign className="w-4 h-4" />
                תעריף לשעה (₪)
              </label>
              <Input
                type="number"
                value={formData.hourly_rate}
                onChange={(e) => setFormData(prev => ({ ...prev, hourly_rate: e.target.value }))}
                placeholder="150"
              />
            </div>
          </div>

          {/* סטודנט שלמד את הקורסים */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is-student"
                checked={isStudent}
                onCheckedChange={(checked) => setIsStudent(!!checked)}
              />
              <label
                htmlFor="is-student"
                className="flex items-center gap-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                <GraduationCap className="w-4 h-4" />
                אני סטודנט שלמד את הקורסים
              </label>
            </div>
            {isStudent && (
              <p className="text-sm text-blue-600 bg-blue-50 p-2 rounded">
                אם אתה סטודנט, נבקש ממך לציין את הציון שקיבלת בכל קורס כדי לוודא איכות ההוראה.
              </p>
            )}
          </div>

          {/* Course Selection */}
          <CourseSelector
            selectedCourses={selectedCourses}
            onCoursesChange={setSelectedCourses}
            isStudent={isStudent}
            onGradeChange={handleCourseGradeChange}
          />

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium">
                <MapPin className="w-4 h-4" />
                מיקום
              </label>
              <Input
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                placeholder="תל אביב, ירושלים, און-ליין"
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium">
                <Clock className="w-4 h-4" />
                זמינות
              </label>
              <Input
                value={formData.availability}
                onChange={(e) => setFormData(prev => ({ ...prev, availability: e.target.value }))}
                placeholder="ימי א-ה 16:00-20:00"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">ניסיון והכשרה</label>
            <Textarea
              value={formData.experience}
              onChange={(e) => setFormData(prev => ({ ...prev, experience: e.target.value }))}
              placeholder="ספר על הניסיון וההכשרה שלך..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">תיאור נוסף</label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="ספר קצת על עצמך ועל שיטת ההוראה שלך..."
              rows={3}
            />
          </div>

          {/* ✅ תיבת סימון תנאי שימוש */}
          <div className="flex items-start gap-2 text-sm bg-gray-50 border border-gray-200 p-3 rounded">
            <Checkbox
              id="accept-terms"
              checked={formData.acceptedTerms}
              onCheckedChange={(checked) =>
                setFormData(prev => ({ ...prev, acceptedTerms: !!checked }))
              }
            />
            <label htmlFor="accept-terms" className="leading-snug">
              אני מאשר/ת את&nbsp;
              <a href="/tutors-terms" target="_blank" className="text-blue-600 underline">
                תנאי השימוש למורים פרטיים
              </a>
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? 'שולח...' : 'שלח בקשה'}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              ביטול
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TutorApplicationForm;
