import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Lightbulb, Plus, Edit, Trash2, ArrowUp, ArrowDown, DollarSign, Copy, AlertTriangle, FilePlus2 } from 'lucide-react';
import { toast } from 'sonner';

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

const CATEGORIES = [
  'לימודים', 'טכנולוגיה', 'אורח חיים', 'ציוד לימודי', 'תחבורה', 'מלגות', 'בריאות', 'כללי'
];

const TipsManagement = () => {
  const queryClient = useQueryClient();
  const [editingTip, setEditingTip] = useState<Tip | null>(null);
  const [search, setSearch] = useState('');
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; tip?: Tip }>({ open: false });
  const [localOrder, setLocalOrder] = useState<string[]>([]);
  const [duplicateTip, setDuplicateTip] = useState<Tip | null>(null);

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
    },
    onSuccess: (data) => setLocalOrder(data.map(t => t.id)),
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
      toast.success('הטיפ נשמר בהצלחה');
    },
    onError: (err: any) => {
      toast.error('שגיאה: ' + err.message);
    }
  });

  // שכפול טיפ
  const handleDuplicate = async (tip: Tip) => {
    const copy = { ...tip, id: undefined, title_he: tip.title_he + ' (העתק)' };
    const { error } = await supabase.from('tips').insert(copy);
    if (error) toast.error('שגיאה בשכפול: ' + error.message);
    else toast.success('הטיפ שוכפל!');
    queryClient.invalidateQueries({ queryKey: ['tips'] });
  };

  // מחיקה
  const deleteTip = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('tips').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tips'] });
      toast.success('הטיפ נמחק');
      setDeleteDialog({ open: false });
    }
  });

  // סידור מיקום (ללקוח בלבד)
  const sortedTips = useMemo(() => localOrder.map(id => tips.find(t => t.id === id)).filter(Boolean) as Tip[], [localOrder, tips]);

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

  // חיפוש טיפים
  const filteredTips = useMemo(() =>
    search.length < 2
      ? sortedTips
      : sortedTips.filter(
          t =>
            t.title_he.includes(search) ||
            t.content_he.includes(search) ||
            (t.title_en ?? '').toLowerCase().includes(search.toLowerCase())
        ),
    [sortedTips, search]
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5" />
              ניהול טיפים - "איך לעבור בשלום"
            </CardTitle>
            <div className="flex flex-wrap gap-2">
              <Input
                className="w-40 md:w-64"
                placeholder="חפש טיפ או קטגוריה..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <Dialog open={!!editingTip} onOpenChange={v => { if (!v) setEditingTip(null) }}>
                <DialogTrigger asChild>
                  <Button onClick={() => setEditingTip(null)}><Plus className="w-4 h-4 ml-2" />הוסף טיפ</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingTip ? 'עריכת טיפ' : 'הוספת טיפ חדש'}</DialogTitle>
                  </DialogHeader>
                  <TipForm tip={editingTip} onSave={data => upsertTip.mutate(data)} categories={CATEGORIES} />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>סדר</TableHead>
                <TableHead>כותרת</TableHead>
                <TableHead>תוכן</TableHead>
                <TableHead>קטגוריה</TableHead>
                <TableHead>סטטוס</TableHead>
                <TableHead>תאריך</TableHead>
                <TableHead>פעולות</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(isLoading ? [] : filteredTips).map((tip, index) => (
                <TableRow key={tip.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{index + 1}</span>
                      <div className="flex flex-col gap-1">
                        <Button variant="outline" size="sm" onClick={() => moveUp(index)} disabled={index === 0}><ArrowUp className="w-3 h-3" /></Button>
                        <Button variant="outline" size="sm" onClick={() => moveDown(index)} disabled={index === filteredTips.length - 1}><ArrowDown className="w-3 h-3" /></Button>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-semibold">{tip.title_he}</div>
                    {tip.title_en && <div className="text-xs text-gray-400">{tip.title_en}</div>}
                  </TableCell>
                  <TableCell>
                    <div className="max-w-xs break-words whitespace-pre-line text-xs text-gray-700 dark:text-gray-100">{tip.content_he}</div>
                    {tip.content_en && <div className="max-w-xs break-words text-xs text-gray-400 mt-1">{tip.content_en}</div>}
                    <Button
                      size="icon"
                      variant="ghost"
                      className="mt-1"
                      title="העתק תוכן"
                      onClick={() => {navigator.clipboard.writeText(tip.content_he); toast.success('הועתק')}}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </TableCell>
                  <TableCell>
                    <Badge>{tip.category}</Badge>
                  </TableCell>
                  <TableCell>
                    {tip.is_sponsored ? (
                      <Badge variant="default" className="bg-yellow-500"><DollarSign className="w-3 h-3 ml-1" />ממומן</Badge>
                    ) : (
                      <Badge variant="secondary">רגיל</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {tip.created_at && (
                      <span className="text-xs">{new Date(tip.created_at).toLocaleDateString('he-IL')}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      <Button variant="outline" size="sm" onClick={() => setEditingTip(tip)}><Edit className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => setDuplicateTip(tip)} title="שכפל טיפ"><FilePlus2 className="w-4 h-4" /></Button>
                      <Button variant="destructive" size="sm" onClick={() => setDeleteDialog({ open: true, tip })}><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {!isLoading && filteredTips.length === 0 && (
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

      {/* דיאלוג מחיקה */}
      <Dialog open={deleteDialog.open} onOpenChange={v => setDeleteDialog({ open: false })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle><AlertTriangle className="inline w-5 h-5 text-red-500" /> האם למחוק טיפ זה?</DialogTitle>
          </DialogHeader>
          <div className="my-3">הפעולה אינה הפיכה.</div>
          <div className="flex gap-2 mt-6">
            <Button variant="outline" onClick={() => setDeleteDialog({ open: false })}>ביטול</Button>
            <Button variant="destructive" onClick={() => deleteTip.mutate(deleteDialog.tip?.id || '')}>מחק</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* דיאלוג שכפול */}
      <Dialog open={!!duplicateTip} onOpenChange={v => { if (!v) setDuplicateTip(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>שכפול טיפ</DialogTitle>
          </DialogHeader>
          <div>לשכפל טיפ זה? תוכל לערוך אותו מיד אחרי הוספה.</div>
          <div className="flex gap-2 mt-4">
            <Button variant="outline" onClick={() => setDuplicateTip(null)}>ביטול</Button>
            <Button variant="default" onClick={() => { handleDuplicate(duplicateTip!); setDuplicateTip(null); }}>שכפל</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// טופס עריכת טיפ משופר (textarea, קטגוריה drop)
const TipForm = ({
  tip,
  onSave,
  categories
}: {
  tip: Tip | null,
  onSave: (data: Partial<Tip>) => void,
  categories: string[]
}) => {
  const [formData, setFormData] = useState<Partial<Tip>>({
    title_he: tip?.title_he || '',
    title_en: tip?.title_en || '',
    content_he: tip?.content_he || '',
    content_en: tip?.content_en || '',
    category: tip?.category || categories[0],
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
          <Input id="title_he" value={formData.title_he} onChange={e => setFormData(prev => ({ ...prev, title_he: e.target.value }))} required />
        </div>
        <div>
          <Label htmlFor="title_en">כותרת (אנגלית)</Label>
          <Input id="title_en" value={formData.title_en} onChange={e => setFormData(prev => ({ ...prev, title_en: e.target.value }))} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="content_he">תוכן (עברית)</Label>
          <textarea id="content_he" rows={3} className="w-full border rounded p-2" value={formData.content_he}
            onChange={e => setFormData(prev => ({ ...prev, content_he: e.target.value }))} required />
        </div>
        <div>
          <Label htmlFor="content_en">תוכן (אנגלית)</Label>
          <textarea id="content_en" rows={3} className="w-full border rounded p-2" value={formData.content_en}
            onChange={e => setFormData(prev => ({ ...prev, content_en: e.target.value }))} />
        </div>
      </div>
      <div>
        <Label htmlFor="category">קטגוריה</Label>
        <select id="category" className="w-full border rounded p-2" value={formData.category} onChange={e => setFormData(prev => ({ ...prev, category: e.target.value }))}>
          {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
        </select>
      </div>
      <div className="flex items-center gap-2">
        <input type="checkbox" id="is_sponsored" checked={formData.is_sponsored} onChange={e => setFormData(prev => ({ ...prev, is_sponsored: e.target.checked }))} />
        <Label htmlFor="is_sponsored">טיפ ממומן</Label>
      </div>
      <Button type="submit" className="w-full">{tip ? 'עדכן טיפ' : 'הוסף טיפ'}</Button>
    </form>
  );
};

export default TipsManagement;
