import React, { useState, useMemo } from 'react';
import {
  Card, CardHeader, CardTitle, CardContent
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from '@/components/ui/dialog';
import {
  Tabs, TabsContent, TabsList, TabsTrigger
} from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import {
  MessageSquare, Mail, Send, Trash2, Eye, Search, Users
} from 'lucide-react';
import {
  useAdminMessages, useSendMessage, useMarkMessageAsRead, useDeleteMessage
} from '@/hooks/useMessages';
import { useRealUsers } from '@/hooks/useRealUsers';
import { useToast } from '@/hooks/use-toast';

const MessagesManagement = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [selectedMessage, setSelectedMessage] = useState<any>(null);
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  const { data: allMessages = [] } = useAdminMessages();
  const { data: users = [] } = useRealUsers();
  const sendMessageMutation = useSendMessage();
  const markAsReadMutation = useMarkMessageAsRead();
  const deleteMessageMutation = useDeleteMessage();

  // ממפה מזהה למשתמש לשם (לנוחות בתצוגה)
  const userMap = useMemo(() => {
    const map: Record<string, any> = {};
    users.forEach((u: any) => { map[u.id] = u; });
    return map;
  }, [users]);

  // Search/filter
  const filteredMessages = useMemo(() => allMessages.filter((msg: any) => {
    if (searchTerm) {
      return (
        msg.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        msg.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        userMap[msg.sender_id]?.name?.toLowerCase()?.includes(searchTerm.toLowerCase()) ||
        userMap[msg.receiver_id]?.name?.toLowerCase()?.includes(searchTerm.toLowerCase())
      );
    }
    return true;
  }), [allMessages, searchTerm, userMap]);

  const unreadMessages = useMemo(() => filteredMessages.filter((m: any) => !m.is_read), [filteredMessages]);
  const readMessages = useMemo(() => filteredMessages.filter((m: any) => m.is_read), [filteredMessages]);

  const handleSendMessage = (messageData: any) => {
    sendMessageMutation.mutate(messageData, {
      onSuccess: () => {
        toast({ title: "הצלחה", description: "ההודעה נשלחה בהצלחה" });
        setIsComposeOpen(false);
      },
      onError: () => {
        toast({
          title: "שגיאה",
          description: "שגיאה בשליחת ההודעה",
          variant: "destructive"
        });
      }
    });
  };

  const handleMarkAsRead = (messageId: string) => markAsReadMutation.mutate(messageId);

  const handleDeleteMessage = (messageId: string) => {
    if (window.confirm('האם אתה בטוח שברצונך למחוק את ההודעה?')) {
      deleteMessageMutation.mutate(messageId, {
        onSuccess: () => toast({ title: "ההודעה נמחקה" }),
      });
    }
  };

  const getDisplayMessages = () => {
    if (activeTab === 'unread') return unreadMessages;
    if (activeTab === 'read') return readMessages;
    return filteredMessages;
  };

  return (
    <div className="space-y-6">
      <Card className="border-2 border-blue-100 bg-white/90 dark:bg-blue-950/40">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
              <MessageSquare className="w-5 h-5" />
              <span>ניהול הודעות פנימיות</span>
              <Badge variant="secondary">{allMessages.length} הודעות</Badge>
            </CardTitle>
            <Dialog open={isComposeOpen} onOpenChange={setIsComposeOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Send className="w-4 h-4 ml-2" />
                  כתוב הודעה חדשה
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>הודעה חדשה</DialogTitle>
                </DialogHeader>
                <ComposeMessageForm
                  users={users}
                  onSend={handleSendMessage}
                  isLoading={sendMessageMutation.isPending}
                />
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search & Stats */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <Input
                placeholder="חיפוש הודעות, נושא, שם משתמש..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                autoFocus
              />
            </div>
            <div className="flex gap-2">
              <Badge variant="outline" className="bg-blue-50 text-blue-800">{unreadMessages.length} לא נקראו</Badge>
              <Badge variant="outline" className="bg-green-50 text-green-800">{readMessages.length} נקראו</Badge>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">כל ההודעות</TabsTrigger>
              <TabsTrigger value="unread">לא נקראו</TabsTrigger>
              <TabsTrigger value="read">נקראו</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-6">
              <div className="overflow-x-auto rounded-lg border border-blue-100 bg-white/80 dark:bg-blue-950/20">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>שולח</TableHead>
                      <TableHead>נמען</TableHead>
                      <TableHead>נושא</TableHead>
                      <TableHead>תאריך</TableHead>
                      <TableHead>סטטוס</TableHead>
                      <TableHead>פעולות</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getDisplayMessages().map((message: any) => (
                      <TableRow key={message.id} className={message.is_read ? "" : "bg-blue-50/40"}>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4 text-blue-400" />
                            <span>
                              {userMap[message.sender_id]?.name || userMap[message.sender_id]?.email || message.sender_id}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Mail className="w-4 h-4 text-green-400" />
                            <span>
                              {userMap[message.receiver_id]?.name || userMap[message.receiver_id]?.email || message.receiver_id}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{message.subject || 'ללא נושא'}</div>
                            <div className="text-sm text-gray-500 truncate max-w-[180px]">
                              {message.content}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {new Date(message.created_at).toLocaleDateString('he-IL', { year: 'numeric', month: '2-digit', day: '2-digit' })}
                        </TableCell>
                        <TableCell>
                          {message.is_read
                            ? <Badge variant="secondary">נקראה</Badge>
                            : <Badge className="bg-blue-600 text-white">חדשה</Badge>
                          }
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedMessage(message)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            {!message.is_read && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleMarkAsRead(message.id)}
                              >
                                סמן כנקראה
                              </Button>
                            )}
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteMessage(message.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {getDisplayMessages().length === 0 && (
                <div className="text-center py-8">
                  <MessageSquare className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">אין הודעות</h3>
                  <p className="text-gray-600">
                    {searchTerm ? 'לא נמצאו הודעות המתאימות לחיפוש' : 'טרם נשלחו הודעות במערכת'}
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Message Details Dialog */}
      {selectedMessage && (
        <Dialog open={!!selectedMessage} onOpenChange={() => setSelectedMessage(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>פרטי הודעה</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>שולח</Label>
                  <div className="text-sm">
                    {userMap[selectedMessage.sender_id]?.name || userMap[selectedMessage.sender_id]?.email}
                  </div>
                </div>
                <div>
                  <Label>נמען</Label>
                  <div className="text-sm">
                    {userMap[selectedMessage.receiver_id]?.name || userMap[selectedMessage.receiver_id]?.email}
                  </div>
                </div>
              </div>
              <div>
                <Label>נושא</Label>
                <div className="text-sm">{selectedMessage.subject || 'ללא נושא'}</div>
              </div>
              <div>
                <Label>תוכן</Label>
                <div className="p-3 bg-gray-50 rounded-md whitespace-pre-wrap">
                  {selectedMessage.content}
                </div>
              </div>
              <div>
                <Label>תאריך</Label>
                <div className="text-sm">
                  {new Date(selectedMessage.created_at).toLocaleString('he-IL')}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

const ComposeMessageForm = ({ users, onSend, isLoading }: any) => {
  const [formData, setFormData] = useState({
    receiver_id: '',
    subject: '',
    content: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.receiver_id || !formData.content) return;
    onSend(formData);
    setFormData({ receiver_id: '', subject: '', content: '' });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="receiver">נמען</Label>
        <Select
          value={formData.receiver_id}
          onValueChange={value => setFormData(prev => ({ ...prev, receiver_id: value }))}
          required
        >
          <SelectTrigger>
            <SelectValue placeholder="בחר נמען" />
          </SelectTrigger>
          <SelectContent>
            {users.map((user: any) => (
              <SelectItem key={user.id} value={user.id}>
                {user.name || user.email} ({user.email})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="subject">נושא</Label>
        <Input
          id="subject"
          value={formData.subject}
          onChange={e => setFormData(prev => ({ ...prev, subject: e.target.value }))}
          placeholder="נושא ההודעה"
        />
      </div>

      <div>
        <Label htmlFor="content">תוכן ההודעה</Label>
        <Textarea
          id="content"
          value={formData.content}
          onChange={e => setFormData(prev => ({ ...prev, content: e.target.value }))}
          placeholder="כתוב את תוכן ההודעה כאן..."
          required
          rows={6}
        />
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="submit" disabled={isLoading} className="flex-1 bg-blue-700 hover:bg-blue-800 text-white">
          {isLoading ? 'שולח...' : 'שלח הודעה'}
        </Button>
      </div>
    </form>
  );
};

export default MessagesManagement;
