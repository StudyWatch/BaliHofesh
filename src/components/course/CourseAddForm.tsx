import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Plus, Calendar, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useRelevantSemesters } from '@/hooks/useSemesters'; // הוק שמחזיר מערך סמסטרים

interface CourseAddFormProps {
  onCourseAdded?: () => void;
}

const CourseAddForm = ({ onCourseAdded }: CourseAddFormProps) => {
  const [open, setOpen] = useState(false);
  const [courseData, setCourseData] = useState({
    name_he: '',
    name_en: '',
    code: '',
    institution_id: '',
    semester: '',
    exam_date: '',
    enable_collaboration: true,
  });
  const [groupLinks, setGroupLinks] = useState({
    whatsapp_link: '',
    discord_link: '',
    telegram_link: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // שליפת מוסדות
  const { data: institutions } = useQuery({
    queryKey: ['institutions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('institutions')
        .select('id, name_he')
        .order('name_he');
      if (error) throw error;
      return data;
    }
  });

  // שליפת סמסטרים (מה־hook שלך או אפשר גם לשים מערך ידני)
  const { data: semesters = [] } = useRelevantSemesters();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "שגיאה",
          description: "יש להתחבר כדי להוסיף קורס",
          variant: "destructive"
        });
        return;
      }

      const { data: course, error: courseError } = await supabase
        .from('courses')
        .insert({
          name_he: courseData.name_he,
          name_en: courseData.name_en || null,
          code: courseData.code || null,
          institution_id: courseData.institution_id || null,
          semester: courseData.semester || null,
          exam_date: courseData.exam_date || null,
          enable_collaboration: courseData.enable_collaboration
        })
        .select()
        .single();

      if (courseError) throw courseError;

      // קישורים לקבוצות
      if (groupLinks.whatsapp_link || groupLinks.discord_link || groupLinks.telegram_link) {
        await supabase.from('course_groups').insert({
          course_id: course.id,
          whatsapp_link: groupLinks.whatsapp_link || null,
          discord_link: groupLinks.discord_link || null,
          telegram_link: groupLinks.telegram_link || null
        });
      }

      toast({
        title: "הצלחה!",
        description: "הקורס נוסף בהצלחה למערכת"
      });

      // איפוס טופס
      setCourseData({
        name_he: '',
        name_en: '',
        code: '',
        institution_id: '',
        semester: '',
        exam_date: '',
        enable_collaboration: true,
      });
      setGroupLinks({
        whatsapp_link: '',
        discord_link: '',
        telegram_link: ''
      });
      setOpen(false);
      onCourseAdded?.();

    } catch (error) {
      console.error('Error adding course:', error);
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה בהוספת הקורס",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setCourseData(prev => ({ ...prev, [field]: value }));
  };

  const handleGroupLinkChange = (field: string, value: string) => {
    setGroupLinks(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white text-lg px-8 py-3 rounded-xl shadow font-bold">
          <Plus className="w-5 h-5 ml-2" />
          הוסף קורס חדש
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[95vh] overflow-y-auto rounded-2xl shadow-2xl" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-extrabold mb-3">הוספת קורס חדש</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-7">

          {/* פרטי קורס */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <Label htmlFor="name_he" className="text-md font-semibold">שם הקורס בעברית *</Label>
              <Input
                id="name_he"
                value={courseData.name_he}
                onChange={(e) => handleInputChange('name_he', e.target.value)}
                placeholder="לדוג' מתמטיקה בדידה"
                className="h-14 text-[18px] rounded-xl px-5 mt-2 bg-gray-50 border border-gray-300"
                required
              />
            </div>
            <div>
              <Label htmlFor="name_en" className="text-md font-semibold">שם הקורס באנגלית</Label>
              <Input
                id="name_en"
                value={courseData.name_en}
                onChange={(e) => handleInputChange('name_en', e.target.value)}
                placeholder="Discrete Mathematics"
                className="h-14 text-[18px] rounded-xl px-5 mt-2 bg-gray-50 border border-gray-300"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <Label htmlFor="code" className="text-md font-semibold">קוד קורס</Label>
              <Input
                id="code"
                value={courseData.code}
                onChange={(e) => handleInputChange('code', e.target.value)}
                placeholder="20109"
                className="h-14 text-[18px] rounded-xl px-5 mt-2 bg-gray-50 border border-gray-300"
              />
            </div>
            <div>
              <Label htmlFor="institution" className="text-md font-semibold">מוסד לימודים</Label>
              <Select value={courseData.institution_id} onValueChange={(value) => handleInputChange('institution_id', value)}>
                <SelectTrigger className="h-14 text-[18px] rounded-xl px-5 mt-2 bg-gray-50 border border-gray-300">
                  <SelectValue placeholder="בחר מוסד" />
                </SelectTrigger>
                <SelectContent dir="rtl" className="rounded-xl shadow-2xl">
                  {institutions?.map((institution) => (
                    <SelectItem key={institution.id} value={institution.id}
                      className="py-3 px-5 text-[17px] rounded-lg hover:bg-blue-50 data-[state=checked]:bg-blue-100"
                    >
                      {institution.name_he}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="semester" className="text-md font-semibold">סמסטר</Label>
            <Select value={courseData.semester} onValueChange={(value) => handleInputChange('semester', value)}>
              <SelectTrigger className="h-14 text-[18px] rounded-xl px-5 mt-2 bg-gray-50 border border-gray-300">
                <SelectValue placeholder="בחר סמסטר..." />
              </SelectTrigger>
              <SelectContent dir="rtl" className="rounded-xl shadow-2xl min-w-[240px] max-h-72 px-0 py-1">
                {semesters.length > 0
                  ? semesters.map((s: any) => (
                      <SelectItem
                        key={s.name}
                        value={s.name}
                        className="py-3 px-5 text-[17px] rounded-lg hover:bg-blue-50 data-[state=checked]:bg-blue-100 font-bold"
                      >
                        {s.name} {s.is_current && <span className="text-green-600 font-bold">(נוכחי)</span>}
                      </SelectItem>
                    ))
                  : <>
                    <SelectItem value="סמסטר קיץ 2025" className="py-3 px-5 text-[17px] rounded-lg">סמסטר קיץ תשפ״ה <span className="text-green-600 font-bold">(נוכחי)</span></SelectItem>
                    <SelectItem value="סמסטר אביב 2025" className="py-3 px-5 text-[17px] rounded-lg">סמסטר אביב תשפ״ה</SelectItem>
                    <SelectItem value="סמסטר חורף 2025" className="py-3 px-5 text-[17px] rounded-lg">סמסטר חורף תשפ״ה</SelectItem>
                  </>
                }
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="exam_date" className="text-md font-semibold">
              <Calendar className="inline w-5 h-5 mr-2" />
              מועד א' (ראשי)
            </Label>
            <Input
              id="exam_date"
              type="date"
              value={courseData.exam_date}
              onChange={(e) => handleInputChange('exam_date', e.target.value)}
              className="h-14 text-[18px] rounded-xl px-5 mt-2 bg-gray-50 border border-gray-300"
            />
          </div>

          {/* קישורים לקבוצות */}
          <div className="border-t pt-5">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-5 h-5 text-green-600" />
              <span className="text-md font-semibold">קישורי קבוצות קורס (אופציונלי)</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="whatsapp_link" className="text-sm font-semibold">WhatsApp</Label>
                <Input
                  id="whatsapp_link"
                  value={groupLinks.whatsapp_link}
                  onChange={(e) => handleGroupLinkChange('whatsapp_link', e.target.value)}
                  placeholder="https://chat.whatsapp.com/..."
                  type="url"
                  className="h-12 text-[16px] rounded-lg px-4 mt-2"
                />
              </div>
              <div>
                <Label htmlFor="discord_link" className="text-sm font-semibold">Discord</Label>
                <Input
                  id="discord_link"
                  value={groupLinks.discord_link}
                  onChange={(e) => handleGroupLinkChange('discord_link', e.target.value)}
                  placeholder="https://discord.gg/..."
                  type="url"
                  className="h-12 text-[16px] rounded-lg px-4 mt-2"
                />
              </div>
              <div>
                <Label htmlFor="telegram_link" className="text-sm font-semibold">Telegram</Label>
                <Input
                  id="telegram_link"
                  value={groupLinks.telegram_link}
                  onChange={(e) => handleGroupLinkChange('telegram_link', e.target.value)}
                  placeholder="https://t.me/..."
                  type="url"
                  className="h-12 text-[16px] rounded-lg px-4 mt-2"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={isSubmitting} className="flex-1 bg-blue-700 text-white rounded-xl text-lg h-14 hover:bg-blue-900 shadow">
              {isSubmitting ? "מוסיף..." : "הוסף קורס"}
            </Button>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1 h-14 rounded-xl">
              ביטול
            </Button>
          </div>
        </form>
      </DialogContent>
      <style>{`
        [data-radix-popper-content-wrapper] { direction: rtl !important; }
      `}</style>
    </Dialog>
  );
};

export default CourseAddForm;
