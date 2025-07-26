
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger, DrawerClose } from '@/components/ui/drawer';
import { Users, Shield, Search, UserPlus, Trash2, Crown, Mail, Activity, CalendarDays } from 'lucide-react';
import { useRealUsers, useUpdateUserRole, useDeleteUser } from '@/hooks/useRealUsers';
import { useToast } from '@/hooks/use-toast';

const UsersManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'user' | 'admin'>('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const { toast } = useToast();

  const { data: users = [], isLoading } = useRealUsers();
  const updateRoleMutation = useUpdateUserRole();
  const deleteUserMutation = useDeleteUser();

  const handlePromoteToAdmin = (userId: string) => {
    updateRoleMutation.mutate(
      { userId, role: 'admin' },
      {
        onSuccess: () => {
          toast({
            title: "הצלחה",
            description: "המשתמש קודם לאדמין"
          });
        },
        onError: () => {
          toast({
            title: "שגיאה",
            description: "שגיאה בקידום המשתמש",
            variant: "destructive"
          });
        }
      }
    );
  };

  const handleDemoteFromAdmin = (userId: string) => {
    updateRoleMutation.mutate(
      { userId, role: 'user' },
      {
        onSuccess: () => {
          toast({
            title: "הצלחה",
            description: "הרשאות האדמין הוסרו"
          });
        },
        onError: () => {
          toast({
            title: "שגיאה",
            description: "שגיאה בהורדת הרשאות",
            variant: "destructive"
          });
        }
      }
    );
  };

  const handleDeleteUser = (userId: string) => {
    if (confirm('האם אתה בטוח שברצונך למחוק את המשתמש? פעולה זו תמחק את כל הנתונים שלו.')) {
      deleteUserMutation.mutate(userId, {
        onSuccess: () => {
          toast({
            title: "הצלחה",
            description: "המשתמש נמחק בהצלחה"
          });
        },
        onError: () => {
          toast({
            title: "שגיאה",
            description: "שגיאה במחיקת המשתמש",
            variant: "destructive"
          });
        }
      });
    }
  };

  const filteredUsers = users.filter((user: any) => {
    const matchesSearch = (user.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (user.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const getRoleBadge = (role: string) => {
    return role === 'admin' ? (
      <Badge className="bg-purple-100 text-purple-800 text-xs">
        <Crown className="w-3 h-3 ml-1" />
        אדמין
      </Badge>
    ) : (
      <Badge variant="secondary" className="text-xs">סטודנט</Badge>
    );
  };

  const adminCount = users.filter((u: any) => u.role === 'admin').length;
  const studentCount = users.filter((u: any) => u.role === 'user').length;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="text-lg text-gray-600">טוען משתמשים...</div>
        </CardContent>
      </Card>
    );
  }

  // Mobile user actions component
  const UserActions = ({ user, onClose }: { user: any; onClose: () => void }) => (
    <div className="space-y-3 p-4">
      <div className="text-center">
        <h3 className="font-medium text-lg mb-2">{user.name}</h3>
        <p className="text-sm text-gray-600 mb-4">{user.email}</p>
        {getRoleBadge(user.role)}
      </div>
      
      <div className="space-y-2">
        {user.role === 'user' ? (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              handlePromoteToAdmin(user.id);
              onClose();
            }}
          >
            <Shield className="w-4 h-4 ml-2" />
            שדרג לאדמין
          </Button>
        ) : (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              handleDemoteFromAdmin(user.id);
              onClose();
            }}
            disabled={adminCount <= 1}
          >
            הסר הרשאות אדמין
          </Button>
        )}
        
        <Button
          variant="destructive"
          className="w-full"
          onClick={() => {
            if (window.confirm(`האם אתה בטוח שברצונך למחוק את ${user.name}?`)) {
              handleDeleteUser(user.id);
              onClose();
            }
          }}
        >
          <Trash2 className="w-4 h-4 ml-2" />
          מחק משתמש
        </Button>
      </div>
    </div>
  );

  return (
    <Card className="w-full">
      <CardHeader className="space-y-4">
        <div className="flex flex-col space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <CardTitle className="flex items-center gap-2 text-base lg:text-lg">
              <Users className="w-5 h-5" />
              ניהול משתמשים והרשאות
            </CardTitle>
            <div className="flex gap-2">
              <Badge variant="outline" className="text-xs">{adminCount} אדמינים</Badge>
              <Badge variant="outline" className="text-xs">{studentCount} סטודנטים</Badge>
            </div>
          </div>
          
          <div className="flex flex-col space-y-3">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="חיפוש משתמש..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10 text-sm"
              />
            </div>
            <div className="flex gap-1 flex-wrap">
              <Button 
                variant={filterRole === 'all' ? 'default' : 'outline'}
                onClick={() => setFilterRole('all')}
                size="sm"
                className="text-xs"
              >
                הכל
              </Button>
              <Button 
                variant={filterRole === 'admin' ? 'default' : 'outline'}
                onClick={() => setFilterRole('admin')}
                size="sm"
                className="text-xs"
              >
                אדמינים
              </Button>
              <Button 
                variant={filterRole === 'user' ? 'default' : 'outline'}
                onClick={() => setFilterRole('user')}
                size="sm"
                className="text-xs"
              >
                סטודנטים
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-2 sm:p-6">
        {/* Mobile view - Cards */}
        <div className="block md:hidden space-y-3">
          {filteredUsers.map((user) => (
            <Card key={user.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-medium text-sm">{user.name}</h3>
                    {getRoleBadge(user.role)}
                  </div>
                  <p className="text-xs text-gray-600 mb-1">{user.email}</p>
                  <div className="flex gap-2 text-xs text-gray-500">
                    <CalendarDays className="w-3 h-3" />
                    <span>{new Date(user.created_at).toLocaleDateString('he-IL')}</span>
                  </div>
                </div>
                
                <Drawer>
                  <DrawerTrigger asChild>
                    <Button variant="outline" size="sm" className="text-xs">
                      פעולות
                    </Button>
                  </DrawerTrigger>
                  <DrawerContent>
                    <DrawerHeader className="text-center">
                      <DrawerTitle>פעולות משתמש</DrawerTitle>
                    </DrawerHeader>
                    <UserActions 
                      user={user} 
                      onClose={() => setSelectedUser(null)} 
                    />
                  </DrawerContent>
                </Drawer>
              </div>
            </Card>
          ))}
        </div>

        {/* Desktop view - Table */}
        <div className="hidden md:block overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right min-w-[120px]">שם משתמש</TableHead>
                <TableHead className="text-right min-w-[150px]">מייל</TableHead>
                <TableHead className="text-right min-w-[80px]">תפקיד</TableHead>
                <TableHead className="text-right min-w-[100px]">הצטרפות</TableHead>
                <TableHead className="text-right min-w-[100px]">עדכון אחרון</TableHead>
                <TableHead className="text-right min-w-[120px]">פעולות</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium text-sm">
                    <div className="flex items-center gap-2">
                      <div>
                        <div>{user.name || 'ללא שם'}</div>
                        {user.email && (
                          <div className="text-xs text-gray-500 flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {user.email}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{user.email || '-'}</TableCell>
                  <TableCell>{getRoleBadge(user.role || 'user')}</TableCell>
                  <TableCell className="text-sm">
                    <div className="flex items-center gap-1">
                      <CalendarDays className="w-3 h-3 text-gray-400" />
                      {new Date(user.created_at).toLocaleDateString('he-IL')}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    <div className="flex items-center gap-1">
                      <Activity className="w-3 h-3 text-gray-400" />
                      {new Date(user.updated_at).toLocaleDateString('he-IL')}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {user.role === 'user' ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePromoteToAdmin(user.id)}
                          className="text-xs"
                        >
                          <Shield className="w-3 h-3 ml-1" />
                          שדרג
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDemoteFromAdmin(user.id)}
                          disabled={adminCount <= 1}
                          className="text-xs"
                        >
                          הסר אדמין
                        </Button>
                      )}
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="destructive" size="sm" className="text-xs">
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="w-full max-w-md">
                          <DialogHeader>
                            <DialogTitle>מחיקת משתמש</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <p>האם אתה בטוח שברצונך למחוק את המשתמש <strong>{user.name}</strong>?</p>
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
