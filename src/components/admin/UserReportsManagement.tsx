
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { MessageSquare, CheckCircle, Clock, AlertCircle } from 'lucide-react';
// Temporarily using mock data until real data hooks are available
const institutions = [
  { id: '1', shortName: 'האוניברסיטה העברית' },
  { id: '2', shortName: 'אוניברסיטת תל אביב' },
  { id: '3', shortName: 'טכניון' }
];

const courses = [
  { id: '1', name: 'מבוא למדעי המחשב' },
  { id: '2', name: 'חשבון דיפרנציאלי' },
  { id: '3', name: 'מבוא לפסיכולוגיה' }
];

interface UserReport {
  id: string;
  courseId: string;
  institutionId: string;
  content: string;
  reportType: 'exam-update' | 'error' | 'suggestion' | 'other';
  status: 'pending' | 'resolved' | 'dismissed';
  createdAt: string;
  resolvedAt?: string;
  userEmail?: string;
}

const UserReportsManagement = () => {
  const [reports, setReports] = useState<UserReport[]>([
    {
      id: '1',
      courseId: '1',
      institutionId: '1',
      content: 'מועד ב של מבוא למדעי המחשב נדחה ליום חמישי',
      reportType: 'exam-update',
      status: 'pending',
      createdAt: '2024-01-15T10:30:00Z',
      userEmail: 'student@example.com'
    },
    {
      id: '2',
      courseId: '2',
      institutionId: '1',
      content: 'שגיאה בהצגת שם המרצה - צריך להיות פרופ גולן ולא פרופ לוי',
      reportType: 'error',
      status: 'pending',
      createdAt: '2024-01-14T14:20:00Z',
      userEmail: 'another@example.com'
    },
    {
      id: '3',
      courseId: '3',
      institutionId: '2',
      content: 'הוספתם פרטי יצירת קשר עם המרצה',
      reportType: 'suggestion',
      status: 'resolved',
      createdAt: '2024-01-10T09:15:00Z',
      resolvedAt: '2024-01-12T16:45:00Z',
      userEmail: 'student2@example.com'
    }
  ]);

  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'resolved' | 'dismissed'>('all');

  const handleResolveReport = (id: string) => {
    setReports(prev => prev.map(report => 
      report.id === id 
        ? { ...report, status: 'resolved', resolvedAt: new Date().toISOString() }
        : report
    ));
  };

  const handleDismissReport = (id: string) => {
    setReports(prev => prev.map(report => 
      report.id === id 
        ? { ...report, status: 'dismissed', resolvedAt: new Date().toISOString() }
        : report
    ));
  };

  const getCourseName = (courseId: string) => {
    return courses.find(course => course.id === courseId)?.name || 'קורס לא נמצא';
  };

  const getInstitutionName = (institutionId: string) => {
    return institutions.find(inst => inst.id === institutionId)?.shortName || 'מוסד לא נמצא';
  };

  const getReportTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      'exam-update': 'עדכון מועד',
      'error': 'שגיאה',
      'suggestion': 'הצעה',
      'other': 'אחר'
    };
    return types[type] || type;
  };

  const getStatusBadge = (status: string) => {
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
  };

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
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>מוסד</TableHead>
              <TableHead>קורס</TableHead>
              <TableHead>סוג דיווח</TableHead>
              <TableHead>תוכן</TableHead>
              <TableHead>תאריך</TableHead>
              <TableHead>סטטוס</TableHead>
              <TableHead>פעולות</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredReports.map((report) => (
              <TableRow key={report.id}>
                <TableCell>{getInstitutionName(report.institutionId)}</TableCell>
                <TableCell className="font-medium">{getCourseName(report.courseId)}</TableCell>
                <TableCell>
                  <Badge variant="outline">{getReportTypeLabel(report.reportType)}</Badge>
                </TableCell>
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
                      <div className="space-y-4">
                        <div>
                          <strong>מוסד:</strong> {getInstitutionName(report.institutionId)}
                        </div>
                        <div>
                          <strong>קורס:</strong> {getCourseName(report.courseId)}
                        </div>
                        <div>
                          <strong>סוג דיווח:</strong> {getReportTypeLabel(report.reportType)}
                        </div>
                        <div>
                          <strong>תוכן:</strong>
                          <p className="mt-1 p-2 bg-gray-50 rounded">{report.content}</p>
                        </div>
                        <div>
                          <strong>מייל דוחה:</strong> {report.userEmail}
                        </div>
                        <div>
                          <strong>תאריך:</strong> {new Date(report.createdAt).toLocaleDateString('he-IL')} בשעה {new Date(report.createdAt).toLocaleTimeString('he-IL')}
                        </div>
                        {report.resolvedAt && (
                          <div>
                            <strong>טופל בתאריך:</strong> {new Date(report.resolvedAt).toLocaleDateString('he-IL')}
                          </div>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                </TableCell>
                <TableCell>{new Date(report.createdAt).toLocaleDateString('he-IL')}</TableCell>
                <TableCell>{getStatusBadge(report.status)}</TableCell>
                <TableCell>
                  {report.status === 'pending' && (
                    <div className="flex gap-2">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleResolveReport(report.id)}
                      >
                        <CheckCircle className="w-4 h-4 ml-1" />
                        טופל
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDismissReport(report.id)}
                      >
                        דחה
                      </Button>
                    </div>
                  )}
                  {report.status !== 'pending' && (
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
      </CardContent>
    </Card>
  );
};

export default UserReportsManagement;
