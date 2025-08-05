import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Megaphone, Plus, Edit, Trash2, ExternalLink, Search } from 'lucide-react';

// TODO: בעתיד תטען מה-DB
const institutions = [
  { id: '1', name: 'האוניברסיטה העברית' },
  { id: '2', name: 'אוניברסיטת תל אביב' },
  { id: '3', name: 'הטכניון' }
];

interface SponsoredContent {
  id: string;
  institutionId: string;
  content: string;
  link?: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

interface SponsoredContentFormData {
  institutionId: string;
  content: string;
  link: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

const SponsoredContentManagement = () => {
  // דמו — להחליף ל-fetch מה-DB!
  const [sponsoredContent, setSponsoredContent] = useState<SponsoredContent[]>([
    {
      id: '1',
      institutionId: '1',
      content: 'קבלו 20% הנחה על ספרי לימוד!',
      link: 'https://example.com/books',
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      isActive: true
    },
    {
      id: '2',
      institutionId: '2',
      content: 'השתתפו בפעילות הסטודנטים החדשה',
      link: 'https://example.com/activities',
      startDate: '2024-01-15',
      endDate: '2024-06-30',
      isActive: true
    }
  ]);
  const [editingContent, setEditingContent] = useState<SponsoredContent | null>(null);
  const [search, setSearch] = useState('');

  const handleSaveContent = (contentData: Partial<SponsoredContent>) => {
    if (editingContent) {
      setSponsoredContent(prev => prev.map(content =>
        content.id === editingContent.id ? { ...content, ...contentData } : content
      ));
    } else {
      const newContent: SponsoredContent = {
        id: Date.now().toString(),
        institutionId: contentData.institutionId || '',
        content: contentData.content || '',
        link: contentData.link || '',
        startDate: contentData.startDate || '',
        endDate: contentData.endDate || '',
        isActive: contentData.isActive ?? true,
      };
      setSponsoredContent(prev => [...prev, newContent]);
    }
    setEditingContent(null);
  };

  const handleDeleteContent = (id: string) => {
    setSponsoredContent(prev => prev.filter(content => content.id !== id));
  };

  const getInstitutionName = (institutionId: string) => {
    return institutions.find(inst => inst.id === institutionId)?.name || 'לא נמצא';
  };

  const isActiveContent = (content: SponsoredContent) => {
    const now = new Date();
    const start = new Date(content.startDate);
    const end = new Date(content.endDate);
    return content.isActive && now >= start && now <= end;
  };

  // סינון
  const filteredContent = sponsoredContent.filter(item =>
    getInstitutionName(item.institutionId).includes(search) ||
    item.content.includes(search)
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="flex items-center gap-2">
            <Megaphone className="w-5 h-5" />
            ניהול פרסום ממומן לפי מוסדות
          </CardTitle>
          <Dialog open={!!editingContent} onOpenChange={open => !open && setEditingContent(null)}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingContent(null)} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 ml-2" />
                הוסף פרסום
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingContent ? 'עריכת פרסום' : 'הוספת פרסום חדש'}
                </DialogTitle>
              </DialogHeader>
              <SponsoredContentForm
                content={editingContent}
                onSave={handleSaveContent}
              />
            </DialogContent>
          </Dialog>
        </div>
        <div className="max-w-xs mt-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <Input
              placeholder="חיפוש לפי מוסד/תוכן"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>מוסד</TableHead>
              <TableHead>תוכן</TableHead>
              <TableHead>קישור</TableHead>
              <TableHead>התחלה</TableHead>
              <TableHead>סיום</TableHead>
              <TableHead>סטטוס</TableHead>
              <TableHead>פעולות</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredContent.map((content) => (
              <TableRow key={content.id}>
                <TableCell className="font-medium">{getInstitutionName(content.institutionId)}</TableCell>
                <TableCell className="max-w-xs truncate">{content.content}</TableCell>
                <TableCell>
                  {content.link ? (
                    <a href={content.link} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline flex items-center gap-1">
                      קישור <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : <span className="text-gray-400">—</span>}
                </TableCell>
                <TableCell>{new Date(content.startDate).toLocaleDateString('he-IL')}</TableCell>
                <TableCell>{new Date(content.endDate).toLocaleDateString('he-IL')}</TableCell>
                <TableCell>
                  {isActiveContent(content) ? (
                    <Badge className="bg-green-100 text-green-800">פעיל</Badge>
                  ) : (
                    <Badge variant="secondary">לא פעיל</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingContent(content)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteContent(content.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filteredContent.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-gray-500 py-6">
                  לא נמצאו תוצאות.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

const SponsoredContentForm = ({
  content,
  onSave
}: {
  content: SponsoredContent | null,
  onSave: (data: Partial<SponsoredContent>) => void
}) => {
  const [formData, setFormData] = useState<SponsoredContentFormData>({
    institutionId: content?.institutionId || '',
    content: content?.content || '',
    link: content?.link || '',
    startDate: content?.startDate || '',
    endDate: content?.endDate || '',
    isActive: content?.isActive ?? true
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.institutionId || !formData.content || !formData.startDate || !formData.endDate) return;
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="institutionId">מוסד *</Label>
        <Select value={formData.institutionId} onValueChange={val => setFormData(prev => ({ ...prev, institutionId: val }))}>
          <SelectTrigger>
            <SelectValue placeholder="בחר מוסד" />
          </SelectTrigger>
          <SelectContent>
            {institutions.map((institution) => (
              <SelectItem key={institution.id} value={institution.id}>
                {institution.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="content">תוכן הפרסום *</Label>
        <Textarea
          id="content"
          value={formData.content}
          onChange={e => setFormData(prev => ({ ...prev, content: e.target.value }))}
          required
        />
      </div>
      <div>
        <Label htmlFor="link">קישור (אופציונלי)</Label>
        <Input
          id="link"
          type="url"
          value={formData.link}
          onChange={e => setFormData(prev => ({ ...prev, link: e.target.value }))}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="startDate">תאריך התחלה *</Label>
          <Input
            id="startDate"
            type="date"
            value={formData.startDate}
            onChange={e => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
            required
          />
        </div>
        <div>
          <Label htmlFor="endDate">תאריך סיום *</Label>
          <Input
            id="endDate"
            type="date"
            value={formData.endDate}
            onChange={e => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
            required
          />
        </div>
      </div>
      <div className="flex items-center space-x-2 space-x-reverse">
        <input
          type="checkbox"
          id="isActive"
          checked={formData.isActive}
          onChange={e => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
        />
        <Label htmlFor="isActive" className="cursor-pointer">פעיל</Label>
      </div>
      <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
        {content ? 'עדכן פרסום' : 'הוסף פרסום'}
      </Button>
    </form>
  );
};

export default SponsoredContentManagement;
