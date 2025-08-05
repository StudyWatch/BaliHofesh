import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import { Users, Shield, Search, Trash2, Crown, Mail, Activity, CalendarDays, Info, GraduationCap, AlertCircle, UserX } from 'lucide-react';
import { useRealUsers, useUpdateUserRole, useDeleteUser } from '@/hooks/useRealUsers';
import { useToast } from '@/hooks/use-toast';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";

// ברירת מחדל לאווטאר
const DEFAULT_AVATAR = '/default-avatar.png';

const roleLabel = {
  all: 'הכל',
  admin: 'אדמינים',
  tutor: 'מורים פרטיים',
  user: 'סטודנטים',
};

// אפשרויות פילטור
const roleOptions: Array<'all' | 'admin' | 'tutor' | 'user'> = ['all', 'admin', 'tutor', 'user'];

// מציג תג תפקיד
const getRoleBadge = (role: string) => {
  switch (role) {
    case 'admin':
      return (
        <Badge className="bg-gradient-to-r from-purple-500 to-purple-700 text-white text-xs rounded-full shadow-md px-3">
          <Crown className="w-3 h-3 ml-1 inline" />
          אדמין
        </Badge>
      );
    case 'tutor':
      return (
        <Badge className="bg-gradient-to-r from-emerald-400 to-green-600 text-white text-xs rounded-full shadow-md px-3">
          <GraduationCap className="w-3 h-3 ml-1 inline" />
          מורה פרטי
        </Badge>
      );
    default:
      return (
        <Badge variant="secondary" className="text-xs bg-blue-50 text-blue-700 rounded-full shadow-sm px-3">
          סטודנט
        </Badge>
      );
  }
};

// זיהוי משתמש חריג
const getUserWarnings = (user: any) => {
  const warnings = [];
  const lastLogin = user.updated_at ? new Date(user.updated_at) : null;
  const daysSinceUpdate = lastLogin ? (Date.now() - lastLogin.getTime()) / (1000 * 60 * 60 * 24) : null;
  if (daysSinceUpdate !== null && daysSinceUpdate > 90) warnings.push("לא מחובר 90 יום");
  if (user.status === 'blocked') warnings.push("חסום");
  if (!user.email || !user.name) warnings.push("חסר פרטים");
  return warnings;
};

const UsersManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'user' | 'admin' | 'tutor'>('all');
  const { toast } = useToast();

  const { data: users = [], isLoading } = useRealUsers();
  const updateRoleMutation = useUpdateUserRole();
  const deleteUserMutation = useDeleteUser();

  // שינוי תפקיד דינמי
  const handleChangeRole = (userId: string, role: 'user' | 'admin' | 'tutor') => {
    updateRoleMutation.mutate(
      { userId, role },
      {
        onSuccess: () => toast({ title: "עודכן בהצלחה", description: "התפקיד עודכן בהצלחה" }),
        onError: () => toast({ title: "שגיאה", description: "שגיאה בעדכון תפקיד", variant: "destructive" })
      }
    );
  };

  const handleDeleteUser = (userId: string) => {
    if (window.confirm('האם אתה בטוח שברצונך למחוק את המשתמש? פעולה זו תמחק את כל הנתונים שלו.')) {
      deleteUserMutation.mutate(userId, {
        onSuccess: () => toast({ title: "נמחק בהצלחה", description: "המשתמש הוסר לצמיתות" }),
        onError: () => toast({ title: "שגיאה", description: "שגיאה במחיקת המשתמש", variant: "destructive" })
      });
    }
  };

  // פילטור חכם (שם/מייל/תפקיד)
  const filteredUsers = useMemo(() => users.filter((user: any) => {
    const search = searchTerm.trim().toLowerCase();
    const matches =
      (user.name || '').toLowerCase().includes(search) ||
      (user.email || '').toLowerCase().includes(search);
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    return matches && matchesRole;
  }), [users, searchTerm, filterRole]);

  // סטטיסטיקות
  const adminCount = users.filter((u: any) => u.role === 'admin').length;
  const tutorCount = users.filter((u: any) => u.role === 'tutor').length;
  const studentCount = users.filter((u: any) => u.role === 'user').length;

  // גרף: נרשמו 7 ימים אחרונים
  const registrationsByDate = useMemo(() => {
    const daysBack = 7;
    const map: { [date: string]: number } = {};
    for (let i = 0; i < daysBack; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString('he-IL');
      map[dateStr] = 0;
    }
    users.forEach((u: any) => {
      const reg = new Date(u.created_at).toLocaleDateString('he-IL');
      if (map[reg] !== undefined) map[reg]++;
    });
    return Object.entries(map).map(([date, count]) => ({ date, count })).reverse();
  }, [users]);

  // דיאלוג פרטי משתמש
  const UserDetails = ({ user }: { user: any }) => (
    <div className="space-y-4 text-center p-3">
      <img
        src={user.avatar_url || DEFAULT_AVATAR}
        alt={user.name || 'avatar'}
        className="w-20 h-20 rounded-full border shadow mx-auto mb-2"
      />
      <h2 className="font-bold text-lg">{user.name || 'ללא שם'}</h2>
      <div className="flex items-center justify-center gap-2">{getRoleBadge(user.role)}</div>
      <p className="text-xs text-gray-600">{user.email}</p>
      <div className="flex flex-wrap justify-center gap-2 mt-2">
        {getUserWarnings(user).map((w, i) => (
          <Badge key={i} variant="destructive" className="flex items-center gap-1 px-2 py-0.5 text-xs">
            <AlertCircle className="w-3 h-3" /> {w}
          </Badge>
        ))}
      </div>
      <div className="flex justify-between text-xs text-gray-500 border-t pt-2 mt-2">
        <span>
          <CalendarDays className="inline w-3 h-3 mb-0.5" /> הרשמה: {new Date(user.created_at).toLocaleDateString('he-IL')}
        </span>
        <span>
          <Activity className="inline w-3 h-3 mb-0.5" /> עדכון: {new Date(user.updated_at).toLocaleDateString('he-IL')}
        </span>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="text-lg text-blue-500 animate-pulse">טוען משתמשים...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-6xl mx-auto shadow-2xl bg-gradient-to-tr from-blue-50 via-white to-purple-50 rounded-3xl">
      {/* Header סטטיסטיקות וגרף */}
      <div className="mb-2 px-4 py-3 rounded-2xl bg-gradient-to-tr from-blue-200/60 to-purple-200/40 shadow flex flex-col md:flex-row gap-6 md:items-center md:justify-between">
        <div className="flex gap-8 flex-wrap items-center">
          <div className="flex flex-col items-center">
            <span className="font-black text-xl text-blue-800">{users.length}</span>
            <span className="text-xs text-gray-700">סה״כ משתמשים</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="font-black text-lg text-purple-800">{adminCount}</span>
            <span className="text-xs text-gray-700">אדמינים</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="font-black text-lg text-green-700">{tutorCount}</span>
            <span className="text-xs text-gray-700">מורים</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="font-black text-lg text-blue-700">{studentCount}</span>
            <span className="text-xs text-gray-700">סטודנטים</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="font-black text-lg text-orange-700">
              {registrationsByDate.reduce((acc, d) => acc + d.count, 0)}
            </span>
            <span className="text-xs text-gray-700">נרשמו 7 ימים</span>
          </div>
        </div>
        <div className="w-full md:w-64 h-24">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={registrationsByDate}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" fontSize={10} />
              <YAxis allowDecimals={false} width={30} fontSize={10} />
              <Tooltip />
              <Bar dataKey="count" fill="#6366f1" radius={[8,8,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <CardHeader className="space-y-4 border-b pb-2">
        <div className="flex flex-col space-y-2 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            <CardTitle className="flex items-center gap-2 text-lg lg:text-2xl font-black text-blue-900">
              <Users className="w-6 h-6" />
              מערכת ניהול משתמשים והרשאות
            </CardTitle>
            <div className="flex gap-2">
              <Badge variant="outline" className="text-xs">{adminCount} אדמינים</Badge>
              <Badge variant="outline" className="text-xs">{tutorCount} מורים</Badge>
              <Badge variant="outline" className="text-xs">{studentCount} סטודנטים</Badge>
            </div>
          </div>
          <div className="flex gap-1 flex-wrap">
            {roleOptions.map(roleOpt =>
              <Button
                key={roleOpt}
                variant={filterRole === roleOpt ? 'default' : 'outline'}
                onClick={() => setFilterRole(roleOpt)}
                size="sm"
                className="text-xs rounded-full"
              >
                {roleLabel[roleOpt]}
              </Button>
            )}
          </div>
        </div>
        <div className="relative mt-4 max-w-xs">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="חיפוש לפי שם או מייל..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-10 text-sm rounded-full shadow"
          />
        </div>
      </CardHeader>

      <CardContent className="p-2 sm:p-6">
        {/* Mobile cards */}
        <div className="block md:hidden space-y-4">
          {filteredUsers.map((user) => (
            <Card key={user.id} className="p-4 rounded-xl shadow bg-white">
              <div className="flex items-center gap-4">
                <img
                  src={user.avatar_url || DEFAULT_AVATAR}
                  alt={user.name || 'avatar'}
                  className="w-12 h-12 rounded-full border"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-sm">{user.name}</h3>
                    {getRoleBadge(user.role)}
                  </div>
                  <p className="text-xs text-gray-600">{user.email}</p>
                  <div className="flex gap-2 text-xs text-gray-500">
                    <CalendarDays className="w-3 h-3" />
                    <span>{new Date(user.created_at).toLocaleDateString('he-IL')}</span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {getUserWarnings(user).map((w, i) => (
                      <Badge key={i} variant="destructive" className="flex items-center gap-1 px-2 py-0.5 text-xs">
                        <AlertCircle className="w-3 h-3" /> {w}
                      </Badge>
                    ))}
                  </div>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="icon" className="rounded-full" title="פרטי משתמש">
                      <Info className="w-5 h-5 text-blue-600" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-xs rounded-2xl">
                    <DialogHeader>
                      <DialogTitle>פרטי משתמש</DialogTitle>
                    </DialogHeader>
                    <UserDetails user={user} />
                  </DialogContent>
                </Dialog>
                <Drawer>
                  <DrawerTrigger asChild>
                    <Button variant="outline" size="icon" className="rounded-full" title="פעולות">
                      <Shield className="w-5 h-5 text-purple-700" />
                    </Button>
                  </DrawerTrigger>
                  <DrawerContent>
                    <DrawerHeader className="text-center">
                      <DrawerTitle>פעולות</DrawerTitle>
                    </DrawerHeader>
                    <div className="space-y-2 px-2">
                      {user.role !== 'admin' && (
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => handleChangeRole(user.id, 'admin')}
                        >
                          <Shield className="w-4 h-4 ml-2" />
                          שדרג לאדמין
                        </Button>
                      )}
                      {user.role !== 'user' && (
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => handleChangeRole(user.id, 'user')}
                        >
                          סטודנט רגיל
                        </Button>
                      )}
                      {user.role !== 'tutor' && (
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => handleChangeRole(user.id, 'tutor')}
                        >
                          <GraduationCap className="w-4 h-4 ml-2" />
                          מורה פרטי
                        </Button>
                      )}
                      <Button
                        variant="destructive"
                        className="w-full"
                        onClick={() => handleDeleteUser(user.id)}
                      >
                        <Trash2 className="w-4 h-4 ml-2" />
                        מחק משתמש
                      </Button>
                    </div>
                  </DrawerContent>
                </Drawer>
              </div>
            </Card>
          ))}
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[70px] text-center">אווטאר</TableHead>
                <TableHead className="min-w-[110px] text-right">שם</TableHead>
                <TableHead className="min-w-[140px] text-right">מייל</TableHead>
                <TableHead className="min-w-[60px] text-center">תפקיד</TableHead>
                <TableHead className="min-w-[90px] text-center">הרשמה</TableHead>
                <TableHead className="min-w-[100px] text-center">עדכון</TableHead>
                <TableHead className="min-w-[140px] text-center">סטטוס</TableHead>
                <TableHead className="min-w-[140px] text-center">פעולות</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id} className="hover:bg-blue-50 transition">
                  <TableCell className="text-center">
                    <img
                      src={user.avatar_url || DEFAULT_AVATAR}
                      alt={user.name || 'avatar'}
                      className="w-10 h-10 rounded-full border shadow"
                    />
                  </TableCell>
                  <TableCell className="font-bold text-blue-900">{user.name || 'ללא שם'}</TableCell>
                  <TableCell className="text-sm">{user.email || '-'}</TableCell>
                  <TableCell className="text-center">{getRoleBadge(user.role || 'user')}</TableCell>
                  <TableCell className="text-center">
                    <CalendarDays className="w-3 h-3 inline text-gray-400 mr-1" />
                    {new Date(user.created_at).toLocaleDateString('he-IL')}
                  </TableCell>
                  <TableCell className="text-center">
                    <Activity className="w-3 h-3 inline text-gray-400 mr-1" />
                    {new Date(user.updated_at).toLocaleDateString('he-IL')}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex flex-wrap gap-1 justify-center">
                      {getUserWarnings(user).length === 0 && (
                        <Badge className="bg-green-50 text-green-700 px-2 text-xs rounded-full">פעיל</Badge>
                      )}
                      {getUserWarnings(user).map((w, i) => (
                        <Badge key={i} variant="destructive" className="flex items-center gap-1 px-2 py-0.5 text-xs">
                          <AlertCircle className="w-3 h-3" /> {w}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2 justify-center">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="icon" className="rounded-full" title="פרטי משתמש">
                            <Info className="w-4 h-4 text-blue-600" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="w-full max-w-xs rounded-2xl">
                          <DialogHeader>
                            <DialogTitle>פרטי משתמש</DialogTitle>
                          </DialogHeader>
                          <UserDetails user={user} />
                        </DialogContent>
                      </Dialog>
                      {user.role !== 'admin' && (
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleChangeRole(user.id, 'admin')}
                          className="rounded-full"
                          title="שדרג לאדמין"
                        >
                          <Shield className="w-4 h-4 text-purple-800" />
                        </Button>
                      )}
                      {user.role !== 'user' && (
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleChangeRole(user.id, 'user')}
                          className="rounded-full"
                          title="הפוך לסטודנט"
                        >
                          <Users className="w-4 h-4 text-blue-800" />
                        </Button>
                      )}
                      {user.role !== 'tutor' && (
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleChangeRole(user.id, 'tutor')}
                          className="rounded-full"
                          title="הפוך למורה"
                        >
                          <GraduationCap className="w-4 h-4 text-green-700" />
                        </Button>
                      )}
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="destructive" size="icon" className="rounded-full" title="מחק">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="w-full max-w-md rounded-2xl">
                          <DialogHeader>
                            <DialogTitle>מחיקת משתמש</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <p>האם למחוק את <strong>{user.name}</strong>?</p>
                            <p className="text-sm text-gray-600">
                              פעולה זו תמחק את כל הנתונים של המשתמש כולל קורסים שמורים והיסטוריית פעילות.
                            </p>
                            <div className="flex gap-2 justify-end">
                              <DialogClose asChild>
                                <Button variant="outline" size="sm">ביטול</Button>
                              </DialogClose>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDeleteUser(user.id)}
                              >
                                מחק משתמש
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {filteredUsers.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            {searchTerm ? 'לא נמצאו משתמשים המתאימים לחיפוש' : 'אין משתמשים להצגה'}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UsersManagement;
