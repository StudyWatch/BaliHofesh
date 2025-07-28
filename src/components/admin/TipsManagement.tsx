import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Lightbulb, Plus, Edit, Trash2, ArrowUp, ArrowDown, DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Tip {
  id: string;
  title_he: string;
  title_en?: string;
  content_he: string;
  content_en?: string;
  category: string;
  is_sponsored: boolean;
  rating?: number;
  created_at?: string;
}

const TipsManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingTip, setEditingTip] = useState<Tip | null>(null);

  // שליפת טיפים מה-DB
  const { data: tips = [], isLoading } = useQuery({
    queryKey: ['tips'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tips')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Tip[];
    }
  });

  // הוספה/עדכון
  const upsertTip = useMutation({
    mutationFn: async (data: Partial<Tip>) => {
      if (editingTip) {
        const { error } = await supabase.from('tips').update(data).eq('id', editingTip.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('tips').insert([data]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tips'] });
      setEditingTip(null);
      toast({ title: 'הצלחה', description: 'הטיפ נשמר בהצלחה' });
    },
    onError: (err: any) => {
      toast({ title: 'שגיאה', description: err.message, variant: 'destructive' });
    }
  });

  // מחיקה
  const deleteTip = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('tips').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tips'] });
      toast({ title: 'הצלחה', description: 'הטיפ נמחק' });
    }
  });

  // סידור מיקום (בלבד ללקוח, לא שמור ל־DB)
  const [localOrder, setLocalOrder] = useState<string[]>([]);

  React.useEffect(() => {
    if (tips.length) {
      setLocalOrder(tips.map(tip => tip.id));
    }
  }, [tips.length]);

  const sortedTips = localOrder.map(id => tips.find(t => t.id === id)).filter(Boolean) as Tip[];

  const moveUp = (index: number) => {
    if (index > 0) {
      const arr = [...localOrder];
      [arr[index - 1], arr[index]] = [arr[index], arr[index - 1]];
      setLocalOrder(arr);
    }
  };
  const moveDown = (index: number) => {
    if (index < localOrder.length - 1) {
      const arr = [...localOrder];
      [arr[index], arr[index + 1]] = [arr[index + 1], arr[index]];
      setLocalOrder(arr);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5" />
              ניהול טיפים - "איך לעבור בשלום"
            </CardTitle>
            <Dialog open={!!editingTip} onOpenChange={v => { if (!v) setEditingTip(null) }}>
              <DialogTrigger asChild>
                <Button onClick={() => setEditingTip(null)}>
                  <Plus className="w-4 h-4 ml-2" />
                  הוסף טיפ
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingTip ? 'עריכת טיפ' : 'הוספת טיפ חדש'}
                  </DialogTitle>
                </DialogHeader>
                <TipForm
                  tip={editingTip}
                  onSave={(data) => upsertTip.mutate(data)}
                />
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>סדר</TableHead>
                <TableHead>כותרת (עברית)</TableHead>
                <TableHead>כותרת (EN)</TableHead>
                <TableHead>תוכן (עברית)</TableHead>
                <TableHead>תוכן (EN)</TableHead>
                <TableHead>קטגוריה</TableHead>
                <TableHead>סטטוס</TableHead>
                <TableHead>פעולות</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(isLoading ? [] : sortedTips).map((tip, index) => (
                <TableRow key={tip.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{index + 1}</span>
                      <div className="flex flex-col gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => moveUp(index)}
                          disabled={index === 0}
                        >
                          <ArrowUp className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => moveDown(index)}
                          disabled={index === sortedTips.length - 1}
                        >
                          <ArrowDown className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">{tip.title_he}</TableCell>
                  <TableCell className="max-w-xs truncate">{tip.title_en}</TableCell>
                  <TableCell className="max-w-xs truncate">{tip.content_he}</TableCell>
                  <TableCell className="max-w-xs truncate">{tip.content_en}</TableCell>
                  <TableCell className="max-w-xs truncate">{tip.category}</TableCell>
                  <TableCell>
                    {tip.is_sponsored ? (
                      <Badge variant="default" className="bg-yellow-500">
                        <DollarSign className="w-3 h-3 ml-1" />
                        ממומן
                      </Badge>
                    ) : (
                      <Badge variant="secondary">רגיל</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingTip(tip)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteTip.mutate(tip.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {!isLoading && sortedTips.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-gray-400 py-6">
                    אין טיפים להצגה.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

// טופס הוספה/עריכה לטיפ (מתאים לטבלת tips שלך)
const TipForm = ({
  tip,
  onSave,
}: {
  tip: Tip | null,
  onSave: (data: Partial<Tip>) => void
}) => {
  const [formData, setFormData] = useState<Partial<Tip>>({
    title_he: tip?.title_he || '',
    title_en: tip?.title_en || '',
    content_he: tip?.content_he || '',
    content_en: tip?.content_en || '',
    category: tip?.category || '',
    is_sponsored: tip?.is_sponsored || false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="title_he">כותרת (עברית)</Label>
          <Input
            id="title_he"
            value={formData.title_he}
            onChange={(e) => setFormData(prev => ({ ...prev, title_he: e.target.value }))}
            required
          />
        </div>
        <div>
          <Label htmlFor="title_en">כותרת (אנגלית)</Label>
          <Input
            id="title_en"
            value={formData.title_en}
            onChange={(e) => setFormData(prev => ({ ...prev, title_en: e.target.value }))}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="content_he">תוכן (עברית)</Label>
          <Input
            id="content_he"
            value={formData.content_he}
            onChange={(e) => setFormData(prev => ({ ...prev, content_he: e.target.value }))}
            required
          />
        </div>
        <div>
          <Label htmlFor="content_en">תוכן (אנגלית)</Label>
          <Input
            id="content_en"
            value={formData.content_en}
            onChange={(e) => setFormData(prev => ({ ...prev, content_en: e.target.value }))}
          />
        </div>
      </div>
      <div>
        <Label htmlFor="category">קטגוריה</Label>
        <Input
          id="category"
          value={formData.category}
          onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
        />
      </div>
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="is_sponsored"
          checked={formData.is_sponsored}
          onChange={(e) => setFormData(prev => ({ ...prev, is_sponsored: e.target.checked }))}
        />
        <Label htmlFor="is_sponsored">טיפ ממומן</Label>
      </div>
      <Button type="submit" className="w-full">
        {tip ? 'עדכן טיפ' : 'הוסף טיפ'}
      </Button>
    </form>
  );
};

export default TipsManagement;
