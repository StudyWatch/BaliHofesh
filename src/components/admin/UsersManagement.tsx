import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import {
  Users, Shield, Search, Trash2, Crown, Mail, Activity, CalendarDays, Info
} from 'lucide-react';
import { useRealUsers, useUpdateUserRole, useDeleteUser } from '@/hooks/useRealUsers';
import { useToast } from '@/hooks/use-toast';

const DEFAULT_AVATAR = '/default-avatar.png';

const getRoleBadge = (role: string) => {
  return role === 'admin' ? (
    <Badge className="bg-gradient-to-r from-purple-500 to-purple-700 text-white text-xs rounded-full shadow-md px-3">
      <Crown className="w-3 h-3 ml-1 inline" />
      אדמין
    </Badge>
  ) : (
    <Badge variant="secondary" className="text-xs bg-blue-50 text-blue-700 rounded-full shadow-sm px-3">
      סטודנט
    </Badge>
  );
};

const UsersManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'user' | 'admin'>('all');
  const { toast } = useToast();

  const { data: users = [], isLoading } = useRealUsers();
  const updateRoleMutation = useUpdateUserRole();
  const deleteUserMutation = useDeleteUser();

  const handlePromoteToAdmin = (userId: string) => {
    updateRoleMutation.mutate(
      { userId, role: 'admin' },
      {
        onSuccess: () => toast({
          title: "עודכן בהצלחה",
          description: "המשתמש קודם לאדמין",
        }),
        onError: () => toast({
          title: "שגיאה",
          description: "שגיאה בקידום המשתמש",
          variant: "destructive",
        })
      }
    );
  };

  const handleDemoteFromAdmin = (userId: string) => {
    updateRoleMutation.mutate(
      { userId, role: 'user' },
      {
        onSuccess: () => toast({
          title: "עודכן בהצלחה",
          description: "הרשאות האדמין הוסרו",
        }),
        onError: () => toast({
          title: "שגיאה",
          description: "שגיאה בהורדת הרשאות",
          variant: "destructive",
        })
      }
    );
  };

  const handleDeleteUser = (userId: string) => {
    if (window.confirm('האם אתה בטוח שברצונך למחוק את המשתמש? פעולה זו תמחק את כל הנתונים שלו.')) {
      deleteUserMutation.mutate(userId, {
        onSuccess: () => toast({
          title: "נמחק בהצלחה",
          description: "המשתמש הוסר לצמיתות",
        }),
        onError: () => toast({
          title: "שגיאה",
          description: "שגיאה במחיקת המשתמש",
          variant: "destructive",
        })
      });
    }
  };

  const filteredUsers = users.filter((user: any) => {
    const search = searchTerm.trim().toLowerCase();
    const matches =
      (user.name || '').toLowerCase().includes(search) ||
      (user.email || '').toLowerCase().includes(search);
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    return matches && matchesRole;
  });

  const adminCount = users.filter((u: any) => u.role === 'admin').length;
  const studentCount = users.filter((u: any) => u.role === 'user').length;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="text-lg text-blue-500 animate-pulse">טוען משתמשים...</div>
        </CardContent>
      </Card>
    );
  }

  // פרטי משתמש לדיאלוג בלבד (רק שם, מייל, אווטאר, הרשמה/עדכון)
  const UserDetails = ({ user }: { user: any }) => (
    <div className="space-y-4 text-center p-3">
      <img
        src={user.avatar_url || DEFAULT_AVATAR}
        alt={user.name || 'avatar'}
        className="w-20 h-20 rounded-full border shadow mx-auto mb-2"
      />
      <h2 className="font-bold text-lg">{user.name || 'ללא שם'}</h2>
      <div className="flex items-center justify-center gap-2">
        {getRoleBadge(user.role)}
      </div>
      <p className="text-xs text-gray-600">{user.email}</p>
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

  return (
    <Card className="w-full max-w-6xl mx-auto shadow-xl bg-gradient-to-tr from-blue-50 via-white to-purple-50 rounded-3xl">
      <CardHeader className="space-y-4 border-b pb-2">
        <div className="flex flex-col space-y-2 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            <CardTitle className="flex items-center gap-2 text-lg lg:text-2xl font-black text-blue-900">
              <Users className="w-6 h-6" />
              מערכת ניהול משתמשים והרשאות
            </CardTitle>
            <div className="flex gap-2">
              <Badge variant="outline" className="text-xs">{adminCount} אדמינים</Badge>
              <Badge variant="outline" className="text-xs">{studentCount} סטודנטים</Badge>
            </div>
          </div>
          <div className="flex gap-1 flex-wrap">
            <Button 
              variant={filterRole === 'all' ? 'default' : 'outline'}
              onClick={() => setFilterRole('all')}
              size="sm"
              className="text-xs rounded-full"
            >
              הכל
            </Button>
            <Button 
              variant={filterRole === 'admin' ? 'default' : 'outline'}
              onClick={() => setFilterRole('admin')}
              size="sm"
              className="text-xs rounded-full"
            >
              אדמינים
            </Button>
            <Button 
              variant={filterRole === 'user' ? 'default' : 'outline'}
              onClick={() => setFilterRole('user')}
              size="sm"
              className="text-xs rounded-full"
            >
              סטודנטים
            </Button>
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
                </div>
                {/* פרטי משתמש */}
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
                      {user.role === 'user' ? (
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => handlePromoteToAdmin(user.id)}
                        >
                          <Shield className="w-4 h-4 ml-2" />
                          שדרג לאדמין
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => handleDemoteFromAdmin(user.id)}
                          disabled={adminCount <= 1}
                        >
                          הסר הרשאות אדמין
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

        {/* Desktop: Advanced Table */}
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
                  <TableCell>
                    <div className="flex gap-2 justify-center">
                      {/* פרטי משתמש בדיאלוג */}
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
                      {/* שינוי הרשאה */}
                      {user.role === 'user' ? (
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handlePromoteToAdmin(user.id)}
                          className="rounded-full"
                          title="שדרג לאדמין"
                        >
                          <Shield className="w-4 h-4 text-purple-800" />
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleDemoteFromAdmin(user.id)}
                          disabled={adminCount <= 1}
                          className="rounded-full"
                          title="הסר הרשאת אדמין"
                        >
                          <Crown className="w-4 h-4 text-yellow-500" />
                        </Button>
                      )}
                      {/* מחיקה */}
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
