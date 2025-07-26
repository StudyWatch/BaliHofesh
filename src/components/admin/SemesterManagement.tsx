import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Plus, Edit2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getCurrentSemester, getRelevantSemesters } from '@/hooks/useSemesters';

const SemesterManagement = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  // Get current semester info
  const currentSemester = getCurrentSemester();
  const relevantSemesters = getRelevantSemesters();

  const handleSave = () => {
    toast({
      title: 'מערכת סמסטרים',
      description: 'מערכת הסמסטרים עובדת באופן אוטומטי לפי התאריך הנוכחי',
    });
    setIsDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">ניהול סמסטרים</h2>
          <p className="text-muted-foreground">
            ניהול סמסטרים ומועדי לימוד - המערכת עובדת אוטומטית לפי התאריך הנוכחי
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              הוסף סמסטר
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>הוספת סמסטר חדש</DialogTitle>
              <DialogDescription>
                המערכת מזהה סמסטרים אוטומטית לפי התאריך
              </DialogDescription>
            </DialogHeader>
            <Button onClick={handleSave}>הבנתי</Button>
          </DialogContent>
        </Dialog>
      </div>

      {/* Current Semester Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            סמסטר נוכחי
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">{currentSemester.name}</h3>
                <p className="text-sm text-muted-foreground">
                  שנה: {currentSemester.year} | עונה: {currentSemester.season}
                </p>
              </div>
              <Badge variant="default">פעיל</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Relevant Semesters */}
      <Card>
        <CardHeader>
          <CardTitle>סמסטרים רלוונטיים</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {relevantSemesters.map((semester, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <h4 className="font-medium">{semester.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    שנה: {semester.year} | עונה: {semester.season}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {semester.is_current && (
                    <Badge variant="default">נוכחי</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SemesterManagement;