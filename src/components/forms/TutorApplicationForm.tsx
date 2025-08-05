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

// ✨ מערך תמונות מוכנות
const defaultAvatars = [
  "https://img.icons8.com/?size=100&id=d5q9KF0l7VrO&format=png&color=000000",
  "https://img.icons8.com/color/96/businessman.png",
  "https://img.icons8.com/?size=100&id=5NbAWYtOPEQK&format=png&color=000000",
  "https://img.icons8.com/color/96/administrator-male.png",
  "https://img.icons8.com/color/96/classroom.png",
  "https://img.icons8.com/color/96/user-female.png",
  "https://img.icons8.com/color/96/person-female.png",
  "https://img.icons8.com/?size=100&id=9lGFYRqn3qyG&format=png&color=000000",
  "https://img.icons8.com/color/96/user.png",
  "https://img.icons8.com/color/96/manager--v2.png",
  "https://img.icons8.com/?size=100&id=sd0AG4alDEtx&format=png&color=000000",
  "https://img.icons8.com/?size=100&id=33202&format=png&color=000000",
  "https://img.icons8.com/color/96/checked-user-male.png",
  "https://img.icons8.com/color/96/accounting.png",
  "https://img.icons8.com/color/96/idea-sharing.png",
  "https://img.icons8.com/?size=100&id=bYGMUuJmMTuP&format=png&color=000000",
  "https://img.icons8.com/?size=100&id=QU6Xf2Y4Pvmq&format=png&color=000000",
  "https://img.icons8.com/color/96/user-female-circle.png",
  "https://img.icons8.com/color/96/reading.png",
  "https://img.icons8.com/?size=100&id=l5vi6ZnMW4zz&format=png&color=000000",
  "https://img.icons8.com/?size=100&id=pLXXw2jC7w_J&format=png&color=000000",
  "https://img.icons8.com/color/96/open-book--v2.png",
  "https://img.icons8.com/color/96/student-male.png",
  "https://img.icons8.com/?size=100&id=laHEK2JefqpP&format=png&color=000000",
];

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
    acceptedTerms: false,
  });
  const [selectedCourses, setSelectedCourses] = useState<{id: string; name_he: string; code?: string; institution_name?: string;}[]>([]);
  const [isStudent, setIsStudent] = useState(false);
  const [courseGrades, setCourseGrades] = useState<{[courseId: string]: number}>({});
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [selectedAvatarUrl, setSelectedAvatarUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // שינוי ציון של קורס נבחר
  const handleCourseGradeChange = (courseId: string, grade: number) => {
    setCourseGrades(prev => ({
      ...prev,
      [courseId]: grade
    }));
  };

  // שינוי תמונה אישית
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAvatarFile(e.target.files[0]);
      setAvatarPreview(URL.createObjectURL(e.target.files[0]));
      setSelectedAvatarUrl(null); // ביטול בחירה מוכנה
    }
  };

  // שליחת הטופס
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!formData.acceptedTerms) {
      alert('יש לאשר את תנאי השימוש למורים פרטיים לפני השליחה.');
      setIsSubmitting(false);
      return;
    }
    if (selectedCourses.length === 0) {
      alert('יש לבחור לפחות קורס אחד.');
      setIsSubmitting(false);
      return;
    }

    try {
      // העלאת תמונה
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
      } else if (selectedAvatarUrl) {
        avatarUrl = selectedAvatarUrl;
      } else {
        avatarUrl = null;
      }

      // בניית subjects לפי שם קורס (וקוד וציון אם יש)
      const subjects = selectedCourses.map(course => {
        let title = course.name_he;
        if (course.code) title += ` (${course.code})`;
        if (isStudent && courseGrades[course.id]) {
          title += ` - ציון: ${courseGrades[course.id]}`;
        }
        return title;
      });

      // אובייקט שליחה
      const submission = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone || null,
        subjects: subjects, // מערך מחרוזות בלבד!
        experience: formData.experience || null,
        description: formData.description || null,
        hourly_rate: formData.hourly_rate ? parseInt(formData.hourly_rate) : null,
        location: formData.location || null,
        availability: formData.availability || null,
        avatar_url: avatarUrl ?? null,
      };

      // שליחה למסד
      const { error } = await supabase
        .from('tutor_applications')
        .insert([submission]);

      if (error) {
        console.error('Supabase Error:', error);
        alert('שגיאה בשליחת הבקשה: ' + (error.message || 'לא ידועה'));
        setIsSubmitting(false);
        return;
      }

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
          acceptedTerms: false
        });
        setSelectedCourses([]);
        setIsStudent(false);
        setCourseGrades({});
        setAvatarFile(null);
        setAvatarPreview(null);
        setSelectedAvatarUrl(null);
      }, 2000);
    } catch (error: any) {
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
          {/* בחירת תמונה מוכנה */}
          <div className="space-y-2">
            <label className="text-sm font-medium">בחר תמונה מוכנה</label>
            <div className="flex gap-3 flex-wrap">
              {defaultAvatars.map((url, idx) => (
                <img
                  key={idx}
                  src={url}
                  alt={`Avatar ${idx + 1}`}
                  className={`w-16 h-16 rounded-full border-2 cursor-pointer transition
                    ${selectedAvatarUrl === url ? 'border-blue-500 ring ring-blue-300' : 'border-gray-200'}`}
                  onClick={() => {
                    setSelectedAvatarUrl(url);
                    setAvatarFile(null);
                    setAvatarPreview(url);
                  }}
                />
              ))}
            </div>
          </div>

          {/* העלאת תמונה אישית */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium">
              <UploadCloud className="w-4 h-4" />
              או העלה תמונה מהמחשב
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
          {/* תנאי שימוש */}
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
