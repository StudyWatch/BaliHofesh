
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Lightbulb, Plus, Edit, Trash2, ArrowUp, ArrowDown, DollarSign } from 'lucide-react';

const TipsManagement = () => {
  const [tips, setTips] = useState([
    { id: '1', contentHe: 'התחילו ללמוד מוקדם', contentEn: 'Start studying early', isSponsored: false, order: 1 },
    { id: '2', contentHe: 'השתמשו במשאבי הספרייה', contentEn: 'Use library resources', isSponsored: true, order: 2 },
    { id: '3', contentHe: 'לומדים בקבוצות', contentEn: 'Study in groups', isSponsored: false, order: 3 }
  ]);
  const [editingTip, setEditingTip] = useState(null);

  const handleSaveTip = (tipData) => {
    if (editingTip) {
      setTips(prev => prev.map(tip => 
        tip.id === editingTip.id ? { ...tip, ...tipData } : tip
      ));
    } else {
      const newTip = {
        id: Date.now().toString(),
        order: tips.length + 1,
        ...tipData
      };
      setTips(prev => [...prev, newTip]);
    }
    setEditingTip(null);
  };

  const handleDeleteTip = (id) => {
    setTips(prev => prev.filter(tip => tip.id !== id));
  };

  const moveUp = (index) => {
    if (index > 0) {
      const newTips = [...tips];
      [newTips[index], newTips[index - 1]] = [newTips[index - 1], newTips[index]];
      setTips(newTips);
    }
  };

  const moveDown = (index) => {
    if (index < tips.length - 1) {
      const newTips = [...tips];
      [newTips[index], newTips[index + 1]] = [newTips[index + 1], newTips[index]];
      setTips(newTips);
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
            <Dialog>
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
                  onSave={handleSaveTip}
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
                <TableHead>תוכן עברית</TableHead>
                <TableHead>תוכן אנגלית</TableHead>
                <TableHead>סטטוס</TableHead>
                <TableHead>פעולות</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tips.map((tip, index) => (
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
                          disabled={index === tips.length - 1}
                        >
                          <ArrowDown className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">{tip.contentHe}</TableCell>
                  <TableCell className="max-w-xs truncate">{tip.contentEn}</TableCell>
                  <TableCell>
                    {tip.isSponsored ? (
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
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setEditingTip(tip)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>עריכת טיפ</DialogTitle>
                          </DialogHeader>
                          <TipForm 
                            tip={tip}
                            onSave={handleSaveTip}
                          />
                        </DialogContent>
                      </Dialog>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteTip(tip.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

const TipForm = ({ tip, onSave }) => {
  const [formData, setFormData] = useState({
    contentHe: tip?.contentHe || '',
    contentEn: tip?.contentEn || '',
    isSponsored: tip?.isSponsored || false
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="contentHe">תוכן בעברית</Label>
        <Input
          id="contentHe"
          value={formData.contentHe}
          onChange={(e) => setFormData(prev => ({ ...prev, contentHe: e.target.value }))}
          required
        />
      </div>
      <div>
        <Label htmlFor="contentEn">תוכן באנגלית</Label>
        <Input
          id="contentEn"
          value={formData.contentEn}
          onChange={(e) => setFormData(prev => ({ ...prev, contentEn: e.target.value }))}
          required
        />
      </div>
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="isSponsored"
          checked={formData.isSponsored}
          onChange={(e) => setFormData(prev => ({ ...prev, isSponsored: e.target.checked }))}
        />
        <Label htmlFor="isSponsored">טיפ ממומן</Label>
      </div>
      <Button type="submit" className="w-full">
        {tip ? 'עדכן טיפ' : 'הוסף טיפ'}
      </Button>
    </form>
  );
};

export default TipsManagement;
