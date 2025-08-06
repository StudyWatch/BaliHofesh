import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { MessageSquare, CheckCircle, Clock, FileText, Trash2, User2, Copy, ExternalLink, AlertTriangle, Undo2 } from 'lucide-react';
import { toast } from 'sonner';

type UserReportStatus = 'pending' | 'resolved' | 'dismissed';

interface UserReport {
  id: string;
  user_id?: string;
  email?: string;
  subject: string;
  sub_category?: string;
  content: string;
  course_id?: string;
  file_url?: string;
  user_agent?: string;
  page_referrer?: string;
  status: UserReportStatus;
  created_at: string;
  resolved_at?: string;
}

// קישור מהיר לקורסים - לשדרג לקריאה דינמית ב-query בהמשך
const courses: { [id: string]: string } = {
  '1': 'מבוא למדעי המחשב',
  '2': 'חשבון דיפרנציאלי',
  '3': 'מבוא לפסיכולוגיה',
};

function getCourseName(courseId?: string) {
  return courseId && courses[courseId] ? courses[courseId] : (courseId ? courseId : '—');
}

function getStatusBadge(status: UserReportStatus) {
  switch (status) {
    case 'pending':
      return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 ml-1" />ממתין</Badge>;
    case 'resolved':
      return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 ml-1" />טופל</Badge>;
    case 'dismissed':
      return <Badge variant="secondary">נדחה</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

const UserReportsManagement: React.FC = () => {
  const [reports, setReports] = useState<UserReport[]>([]);
  const [filterStatus, setFilterStatus] = useState<'all' | UserReportStatus>('all');
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [undoStack, setUndoStack] = useState<UserReport[]>([]);
  const [editDialog, setEditDialog] = useState<{open: boolean; report?: UserReport} >({open: false});

  // טען פניות
  useEffect(() => {
    fetchReports();
  }, []);

  async function fetchReports() {
    setLoading(true);
    const { data, error } = await supabase
      .from('user_reports')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) setReports(data as UserReport[]);
    setLoading(false);
  }

  // עדכון סטטוס/עריכה
  const updateReport = async (id: string, changes: Partial<UserReport>) => {
    const { error } = await supabase
      .from('user_reports')
      .update({ ...changes, resolved_at: changes.status ? new Date().toISOString() : undefined })
      .eq('id', id);
    if (!error) {
      setReports(prev => prev.map(r => r.id === id ? { ...r, ...changes, resolved_at: changes.status ? new Date().toISOString() : undefined } : r));
      toast.success('עודכן בהצלחה');
    } else {
      toast.error('שגיאה בעדכון: ' + error.message);
    }
  };

  // מחיקה
  const deleteReport = async (id: string) => {
    const report = reports.find(r => r.id === id);
    if (!report) return;
    setDeletingId(id);
    // "מחיקה רכה" – אפשר Undo תוך 8 שניות
    setReports(prev => prev.filter(r => r.id !== id));
    setUndoStack(prev => [report, ...prev]);
    toast('הפנייה נמחקה', {
      action: {
        label: 'שחזר',
        onClick: () => undoDelete(id)
      },
      duration: 8000,
    });
    setTimeout(async () => {
      // מוחק באמת רק אם לא עשו undo
      if (undoStack.find(r => r.id === id)) return;
      await supabase.from('user_reports').delete().eq('id', id);
    }, 8000);
  };

  // שחזור
  const undoDelete = (id: string) => {
    const report = undoStack.find(r => r.id === id);
    if (report) {
      setReports(prev => [report, ...prev]);
      setUndoStack(prev => prev.filter(r => r.id !== id));
      toast.success('השחזור בוצע');
    }
  };

  // סינון
  const filteredReports = filterStatus === 'all'
    ? reports
    : reports.filter(report => report.status === filterStatus);

  const pendingCount = reports.filter(r => r.status === 'pending').length;

  // --- תפריט עריכה מהירה ---
  const openEditDialog = (report: UserReport) => setEditDialog({open: true, report});
  const closeEditDialog = () => setEditDialog({open: false, report: undefined});

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            ניהול פניות משתמשים
            {pendingCount > 0 && (
              <Badge className="bg-red-100 text-red-800">{pendingCount} ממתינות</Badge>
            )}
          </CardTitle>
          <div className="flex gap-2">
            <Button variant={filterStatus === 'all' ? 'default' : 'outline'} onClick={() => setFilterStatus('all')} size="sm">הכל ({reports.length})</Button>
            <Button variant={filterStatus === 'pending' ? 'default' : 'outline'} onClick={() => setFilterStatus('pending')} size="sm">ממתינות ({pendingCount})</Button>
            <Button variant={filterStatus === 'resolved' ? 'default' : 'outline'} onClick={() => setFilterStatus('resolved')} size="sm">טופלו ({reports.filter(r => r.status === 'resolved').length})</Button>
            <Button variant={filterStatus === 'dismissed' ? 'default' : 'outline'} onClick={() => setFilterStatus('dismissed')} size="sm">נדחו ({reports.filter(r => r.status === 'dismissed').length})</Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-16 text-lg text-gray-400">טוען פניות...</div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>קטגוריה</TableHead>
                  <TableHead>תת־קטגוריה</TableHead>
                  <TableHead>קורס</TableHead>
                  <TableHead>תוכן</TableHead>
                  <TableHead>קובץ</TableHead>
                  <TableHead>תאריך</TableHead>
                  <TableHead>סטטוס</TableHead>
                  <TableHead>פעולות</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell>
                      <Badge variant="outline">{report.subject}</Badge>
                    </TableCell>
                    <TableCell>
                      {report.sub_category ? (
                        <Badge className="bg-purple-100 text-purple-700">{report.sub_category}</Badge>
                      ) : '—'}
                    </TableCell>
                    <TableCell>
                      {report.course_id
                        ? <a href={`/courses/${report.course_id}`} className="text-blue-700 underline">{getCourseName(report.course_id)}</a>
                        : '—'}
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="link" className="h-auto p-0 text-right justify-start">
                            <span className="truncate">{report.content}</span>
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-lg">
                          <DialogHeader>
                            <DialogTitle>פרטי הדיווח</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-3 text-sm">
                            <div><strong>קטגוריה:</strong> {report.subject}</div>
                            <div><strong>תת־קטגוריה:</strong> {report.sub_category || '—'}</div>
                            <div><strong>קורס:</strong> {getCourseName(report.course_id)}</div>
                            <div className="flex items-center gap-2">
                              <strong>תוכן:</strong>
                              <Button variant="ghost" size="icon" onClick={() => {navigator.clipboard.writeText(report.content); toast.success('התוכן הועתק!')}} title="העתק תוכן">
                                <Copy className="w-4 h-4" />
                              </Button>
                            </div>
                            <p className="mt-1 p-2 bg-gray-50 rounded">{report.content}</p>
                            {report.file_url && (
                              <div>
                                <strong>קובץ:</strong>
                                <a href={report.file_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline flex items-center gap-1">
                                  <FileText className="w-4 h-4" /> לצפייה / להורדה
                                </a>
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <strong>אימייל:</strong> {report.email || '—'}
                              {report.email && (
                                <Button variant="ghost" size="icon" onClick={() => {navigator.clipboard.writeText(report.email!); toast.success('האימייל הועתק!')}} title="העתק אימייל">
                                  <Copy className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                            <div>
                              <strong>משתמש:</strong>{" "}
                              {report.user_id ?
                                <a href={`/profile/${report.user_id}`} target="_blank" className="inline-flex items-center text-blue-600 underline"><User2 className="w-4 h-4 ml-1" /> לפרופיל</a>
                                : '—'}
                            </div>
                            <div><strong>דפדפן:</strong> {report.user_agent || '—'}</div>
                            <div>
                              <strong>תאריך שליחה:</strong> {new Date(report.created_at).toLocaleDateString('he-IL')} {new Date(report.created_at).toLocaleTimeString('he-IL')}
                            </div>
                            {report.resolved_at && (
                              <div>
                                <strong>טופל בתאריך:</strong> {new Date(report.resolved_at).toLocaleDateString('he-IL')}
                              </div>
                            )}
                            {report.page_referrer && (
                              <div>
                                <strong>מקור:</strong>{" "}
                                <a href={report.page_referrer} className="text-blue-500 underline flex items-center gap-1" target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="w-4 h-4" /> {report.page_referrer}
                                </a>
                              </div>
                            )}
                          </div>
                          <div className="flex gap-3 pt-3 border-t mt-4">
                            <Button variant="outline" onClick={closeEditDialog} className="flex-1">סגור</Button>
                            <Button variant="default" className="flex-1" onClick={() => openEditDialog(report)}>
                              <CheckCircle className="w-4 h-4 ml-1" /> ערוך/עדכן סטטוס
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                    <TableCell>
                      {report.file_url ? (
                        <a href={report.file_url} target="_blank" rel="noopener noreferrer">
                          <FileText className="w-5 h-5 text-blue-600" />
                        </a>
                      ) : "—"}
                    </TableCell>
                    <TableCell>{new Date(report.created_at).toLocaleDateString('he-IL')}</TableCell>
                    <TableCell>{getStatusBadge(report.status)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {report.status === 'pending' && (
                          <>
                            <Button variant="success" size="sm" onClick={() => updateReport(report.id, { status: 'resolved' })}>
                              <CheckCircle className="w-4 h-4 ml-1" /> טופל
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => updateReport(report.id, { status: 'dismissed' })}>
                              דחה
                            </Button>
                          </>
                        )}
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="destructive" size="sm">
                              <Trash2 className="w-4 h-4" /> מחק
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>
                                <AlertTriangle className="inline w-5 h-5 ml-2 text-red-500" />
                                האם למחוק פנייה זו?
                              </DialogTitle>
                            </DialogHeader>
                            <div className="text-sm my-4">
                              פעולה זו בלתי הפיכה! ניתן לבצע Undo תוך 8 שניות.
                            </div>
                            <div className="flex gap-2 mt-6">
                              <Button variant="outline" onClick={() => setDeletingId(null)}>ביטול</Button>
                              <Button variant="destructive" onClick={() => {deleteReport(report.id); setDeletingId(null);}}>
                                מחק סופית
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {filteredReports.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                אין פניות {filterStatus === 'all' ? '' : `ב${filterStatus === 'pending' ? 'סטטוס ממתין' : 'סטטוס שנבחר'}`}
              </div>
            )}
          </>
        )}
      </CardContent>

      {/* דיאלוג עריכה מהירה */}
      <Dialog open={editDialog.open} onOpenChange={closeEditDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>עריכת פנייה</DialogTitle>
          </DialogHeader>
          {editDialog.report && (
            <form
              className="space-y-4"
              onSubmit={async (e) => {
                e.preventDefault();
                await updateReport(editDialog.report!.id, {
                  subject: (e.target as any).subject.value,
                  sub_category: (e.target as any).sub_category.value,
                  status: (e.target as any).status.value as UserReportStatus
                });
                closeEditDialog();
              }}>
              <div>
                <label className="block mb-1 font-semibold">נושא</label>
                <Input name="subject" defaultValue={editDialog.report.subject} required />
              </div>
              <div>
                <label className="block mb-1 font-semibold">תת־קטגוריה</label>
                <Input name="sub_category" defaultValue={editDialog.report.sub_category || ''} />
              </div>
              <div>
                <label className="block mb-1 font-semibold">סטטוס</label>
                <select className="w-full p-2 border rounded" name="status" defaultValue={editDialog.report.status}>
                  <option value="pending">ממתין</option>
                  <option value="resolved">טופל</option>
                  <option value="dismissed">נדחה</option>
                </select>
              </div>
              <div className="flex gap-2">
                <Button type="submit" variant="default" className="flex-1">שמור</Button>
                <Button type="button" variant="outline" className="flex-1" onClick={closeEditDialog}>ביטול</Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default UserReportsManagement;
