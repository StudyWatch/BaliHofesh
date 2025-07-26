import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCreateMarathonRegistration } from '@/hooks/useMarathonRegistrations';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Trophy, Users } from 'lucide-react';

interface MarathonRegistrationModalProps {
  courseId: string;
  courseName: string;
}

const MarathonRegistrationModal = ({ courseId, courseName }: MarathonRegistrationModalProps) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const { mutate: createRegistration, isPending } = useCreateMarathonRegistration();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !email.trim()) {
      toast({
        title: "שגיאה",
        description: "יש למלא את כל השדות הנדרשים",
        variant: "destructive"
      });
      return;
    }

    // Get current user if logged in
    const { data: { user } } = await supabase.auth.getUser();

    createRegistration({
      course_id: courseId,
      user_id: user?.id,
      user_name: name.trim(),
      user_email: email.trim(),
      status: 'registered'
    }, {
      onSuccess: () => {
        toast({
          title: "נרשמת בהצלחה! 🎉",
          description: "תקבל/י הודעה כאשר המרתון יתחיל",
        });
        setOpen(false);
        setName('');
        setEmail('');
      },
      onError: (error) => {
        toast({
          title: "שגיאה בהרשמה",
          description: "אירעה שגיאה. נסה/י שוב מאוחר יותר",
          variant: "destructive"
        });
        console.error('Error registering for marathon:', error);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-bold text-lg px-8 py-4 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200">
          <Trophy className="w-6 h-6 ml-2" />
          הירשם/י עכשיו למרתון!
          <Users className="w-5 h-5 mr-2" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center">
            🏃‍♂️ הרשמה למרתון הכנה לבחינה
          </DialogTitle>
          <p className="text-center text-muted-foreground mt-2">
            {courseName}
          </p>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <Label htmlFor="name">שם מלא *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="הכנס/י את שמך המלא"
              required
              className="text-right"
            />
          </div>
          
          <div>
            <Label htmlFor="email">כתובת אימייל *</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your.email@example.com"
              required
              className="text-left"
              dir="ltr"
            />
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">מה כלול במרתון:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• חזרה מקיפה על כל החומר</li>
              <li>• פתרון מבחנים משנים קודמות</li>
              <li>• שאלות ותשובות עם מתרגלים מנוסים</li>
              <li>• טיפים והמלצות לבחינה</li>
            </ul>
          </div>
          
          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={isPending} className="flex-1 bg-orange-600 hover:bg-orange-700">
              {isPending ? "נרשם..." : "הירשם/י למרתון"}
            </Button>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              ביטול
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default MarathonRegistrationModal;