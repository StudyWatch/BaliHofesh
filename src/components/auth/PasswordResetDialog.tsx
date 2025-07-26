import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { Mail } from 'lucide-react';
import { toast } from 'sonner';

interface PasswordResetDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const PasswordResetDialog: React.FC<PasswordResetDialogProps> = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResetSent, setIsResetSent] = useState(false);

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        toast.error('שגיאה בשליחת מייל איפוס: ' + error.message);
        throw error;
      }

      setIsResetSent(true);
      toast.success('נשלח מייל לאיפוס סיסמה. בדוק את תיבת הדואר שלך.');
    } catch (error: any) {
      console.error('Password reset error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setIsResetSent(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-full max-w-sm sm:max-w-md mx-auto bg-white border-2 shadow-xl p-4 sm:p-6" dir="rtl">
        <DialogHeader className="space-y-3">
          <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto">
            <Mail className="w-6 h-6 text-white" />
          </div>
          <DialogTitle className="text-center text-gray-900 font-bold text-xl">
            {isResetSent ? 'מייל נשלח' : 'איפוס סיסמה'}
          </DialogTitle>
          <DialogDescription className="text-center text-gray-600 text-sm">
            {isResetSent 
              ? 'נשלח מייל עם קישור לאיפוס הסיסמה. בדוק את תיבת הדואר שלך.'
              : 'הכנס את כתובת המייל שלך ונשלח לך קישור לאיפוס סיסמה'
            }
          </DialogDescription>
        </DialogHeader>

        {isResetSent ? (
          <div className="mt-6 space-y-4">
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <p className="text-green-800 text-sm text-center">
                בדוק את תיבת הדואר שלך (כולל תיקיית הספאם) ולחץ על הקישור לאיפוס הסיסמה.
              </p>
            </div>
            <Button onClick={handleClose} variant="outline" className="w-full">
              סגור
            </Button>
          </div>
        ) : (
          <form onSubmit={handlePasswordReset} className="space-y-4 mt-6">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Mail className="w-4 h-4" />
                כתובת מייל
              </label>
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="הכנס את כתובת המייל שלך"
                className="w-full border-gray-300 focus:border-purple-500 text-sm h-10"
              />
            </div>

            <Button 
              type="submit" 
              disabled={isLoading} 
              className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white h-10"
            >
              {isLoading ? 'שולח...' : 'שלח קישור לאיפוס'}
            </Button>

            <Button 
              type="button" 
              onClick={handleClose} 
              variant="outline" 
              className="w-full"
            >
              ביטול
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PasswordResetDialog;