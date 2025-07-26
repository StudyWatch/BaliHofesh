
import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { Lightbulb, User, Mail, BookOpen, Tag } from 'lucide-react';

interface TipSubmissionFormProps {
  isOpen: boolean;
  onClose: () => void;
}

const TipSubmissionForm: React.FC<TipSubmissionFormProps> = ({ isOpen, onClose }) => {
  const { dir } = useLanguage();
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: '',
    author_name: '',
    author_email: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const categories = [
    { value: 'learning', label: 'טכניקות למידה' },
    { value: 'productivity', label: 'פרודוקטיביות' },
    { value: 'exams', label: 'בחינות' },
    { value: 'time-management', label: 'ניהול זמן' },
    { value: 'motivation', label: 'מוטיבציה' },
    { value: 'technology', label: 'טכנולוגיה' },
    { value: 'health', label: 'בריאות ורווחה' },
    { value: 'career', label: 'קריירה' },
    { value: 'other', label: 'אחר' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('tip_submissions')
        .insert([{
          title: formData.title,
          content: formData.content,
          category: formData.category,
          author_name: formData.author_name,
          author_email: formData.author_email
        }]);

      if (error) throw error;

      setIsSubmitted(true);
      setTimeout(() => {
        onClose();
        setIsSubmitted(false);
        setFormData({
          title: '',
          content: '',
          category: '',
          author_name: '',
          author_email: ''
        });
      }, 2000);
    } catch (error) {
      console.error('Error submitting tip:', error);
      alert('שגיאה בשליחת הטיפ. אנא נסה שוב.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md" dir={dir}>
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lightbulb className="w-8 h-8 text-yellow-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">תודה רבה!</h3>
            <p className="text-gray-600">
              הטיפ שלך נשלח לבדיקה. נפרסם אותו בקרוב אם יאושר.
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
            <Lightbulb className="w-6 h-6 text-yellow-600" />
            שיתוף טיפ חדש
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium">
                <User className="w-4 h-4" />
                השם שלך (אופציונלי)
              </label>
              <Input
                value={formData.author_name}
                onChange={(e) => setFormData(prev => ({ ...prev, author_name: e.target.value }))}
                placeholder="השם שיוצג עם הטיפ"
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium">
                <Mail className="w-4 h-4" />
                אימייל (אופציונלי)
              </label>
              <Input
                type="email"
                value={formData.author_email}
                onChange={(e) => setFormData(prev => ({ ...prev, author_email: e.target.value }))}
                placeholder="example@email.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium">
              <BookOpen className="w-4 h-4" />
              כותרת הטיפ *
            </label>
            <Input
              required
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="למשל: איך לזכור מידע לטווח ארוך"
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium">
              <Tag className="w-4 h-4" />
              קטגוריה *
            </label>
            <Select required value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="בחר קטגוריה" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">תוכן הטיפ *</label>
            <Textarea
              required
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              placeholder="כתב כאן את הטיפ המלא עם הסבר מפורט..."
              rows={8}
              className="min-h-[200px]"
            />
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">הנחיות לכתיבת טיפ טוב:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• כתוב בצורה ברורה ומובנת</li>
              <li>• תן דוגמאות מעשיות</li>
              <li>• הסבר מדוע הטיפ עובד</li>
              <li>• ודא שהמידע מדויק ומועיל</li>
            </ul>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? 'שולח...' : 'שלח טיפ'}
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

export default TipSubmissionForm;
