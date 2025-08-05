import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { MessageSquare, CheckCircle, Clock, FileText } from 'lucide-react';

// טיפוס תואם טבלת user_reports
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

// דוגמת קורסים – מומלץ להטעין בפועל מהשרת
const courses: { [id: string]: string } = {
  '1': 'מבוא למדעי המחשב',
  '2': 'חשבון דיפרנציאלי',
  '3': 'מבוא לפסיכולוגיה',
  // ... לטעון את כל הקורסים/לקשר מה־DB
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

  // טעינת פניות מה־DB
  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) setReports(data as UserReport[]);
      setLoading(false);
    };
    fetchReports();
  }, []);

  // עדכון סטטוס (טופל/נדחה)
  const updateReportStatus = async (id: string, newStatus: UserReportStatus) => {
    const { error } = await supabase
      .from('user_reports')
      .update({ status: newStatus, resolved_at: new Date().toISOString() })
      .eq('id', id);

    if (!error) {
      setReports(prev =>
        prev.map(report =>
          report.id === id
            ? { ...report, status: newStatus, resolved_at: new Date().toISOString() }
            : report
        )
      );
    } else {
      alert('שגיאה בעדכון סטטוס: ' + error.message);
    }
  };

  // סינון
  const filteredReports = filterStatus === 'all'
    ? reports
    : reports.filter(report => report.status === filterStatus);

  const pendingCount = reports.filter(r => r.status === 'pending').length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            ניהול פניות משתמשים
            {pendingCount > 0 && (
              <Badge className="bg-red-100 text-red-800">
                {pendingCount} ממתינות
              </Badge>
            )}
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant={filterStatus === 'all' ? 'default' : 'outline'}
              onClick={() => setFilterStatus('all')}
              size="sm"
            >
              הכל ({reports.length})
            </Button>
            <Button
              variant={filterStatus === 'pending' ? 'default' : 'outline'}
              onClick={() => setFilterStatus('pending')}
              size="sm"
            >
              ממתינות ({pendingCount})
            </Button>
            <Button
              variant={filterStatus === 'resolved' ? 'default' : 'outline'}
              onClick={() => setFilterStatus('resolved')}
              size="sm"
            >
              טופלו ({reports.filter(r => r.status === 'resolved').length})
            </Button>
            <Button
              variant={filterStatus === 'dismissed' ? 'default' : 'outline'}
              onClick={() => setFilterStatus('dismissed')}
              size="sm"
            >
              נדחו ({reports.filter(r => r.status === 'dismissed').length})
            </Button>
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
                    <TableCell className="font-medium">{getCourseName(report.course_id)}</TableCell>
                    <TableCell className="max-w-xs">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="link" className="h-auto p-0 text-right justify-start">
                            <span className="truncate">{report.content}</span>
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>פרטי הדיווח</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-3 text-sm">
                            <div><strong>קטגוריה:</strong> {report.subject}</div>
                            <div><strong>תת־קטגוריה:</strong> {report.sub_category || '—'}</div>
                            <div><strong>קורס:</strong> {getCourseName(report.course_id)}</div>
                            <div><strong>תוכן:</strong>
                              <p className="mt-1 p-2 bg-gray-50 rounded">{report.content}</p>
                            </div>
                            {report.file_url && (
                              <div>
                                <strong>קובץ:</strong>{" "}
                                <a href={report.file_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline flex items-center gap-1">
                                  <FileText className="w-4 h-4" /> לצפייה / להורדה
                                </a>
                              </div>
                            )}
                            <div><strong>אימייל:</strong> {report.email || '—'}</div>
                            <div><strong>דפדפן:</strong> {report.user_agent || '—'}</div>
                            <div>
                              <strong>תאריך שליחה:</strong> {new Date(report.created_at).toLocaleDateString('he-IL')} {new Date(report.created_at).toLocaleTimeString('he-IL')}
                            </div>
                            {report.resolved_at && (
                              <div>
                                <strong>טופל בתאריך:</strong> {new Date(report.resolved_at).toLocaleDateString('he-IL')}
                              </div>
                            )}
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
                      {report.status === 'pending' ? (
                        <div className="flex gap-2">
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => updateReportStatus(report.id, 'resolved')}
                          >
                            <CheckCircle className="w-4 h-4 ml-1" />
                            טופל
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateReportStatus(report.id, 'dismissed')}
                          >
                            דחה
                          </Button>
                        </div>
                      ) : (
                        <span className="text-gray-500 text-sm">
                          {report.status === 'resolved' ? 'טופל' : 'נדחה'}
                        </span>
                      )}
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
    </Card>
  );
};

export default UserReportsManagement;
