import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card, CardHeader, CardTitle, CardContent
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Bell, Plus, Edit, Trash2, AlertCircle, Mail, ShieldCheck } from "lucide-react";
import dayjs from "dayjs";
import "dayjs/locale/he";

// קהלי יעד
const AUDIENCES = [
  { value: "all", label: "כל המשתמשים" },
  { value: "admins", label: "אדמינים" },
  { value: "tutors", label: "מורים פרטיים" }
];

const NOTIFICATION_TYPES = [
  { value: "system", label: "מערכת" },
  { value: "assignment", label: "מטלה" },
  { value: "exam", label: "בחינה" },
  { value: "tip", label: "טיפ/המלצה" },
  { value: "study_partner", label: "שותף לימוד" },
  { value: "custom", label: "אחר" },
];

const DELIVERY_OPTIONS = [
  { value: "site", label: "אתר בלבד" },
  { value: "push", label: "Push בלבד" },
  { value: "both", label: "אתר + Push" },
];

type Notification = {
  id?: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  is_read?: boolean;
  created_at?: string;
  assignment_id?: string;
  exam_id?: string;
  reminder_days_before?: number;
  push_to_phone?: boolean;
  expires_at?: string;
  is_critical?: boolean;
  delivery_target?: "site" | "push" | "both";
};

type NotificationFormData = Omit<Notification, "id" | "user_id"> & {
  audience: "all" | "admins" | "tutors";
};
type AdminNotification = {
  id: string;
  title: string;
  message?: string;
  metadata?: any;
  triggered_by?: string;
  created_at?: string;
  is_read?: boolean;
};

const AdminNotificationsPanel: React.FC = () => {
  const [tab, setTab] = useState<"system" | "admin">("system");
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterDelivery, setFilterDelivery] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingNotification, setEditingNotification] = useState<Notification | null>(null);
  const [isAdminDialogOpen, setIsAdminDialogOpen] = useState(false);
  const [editingAdminNotif, setEditingAdminNotif] = useState<AdminNotification | null>(null);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  // טען את כל ההתראות
  const { data: notifications = [] } = useQuery({
    queryKey: ["admin-notifications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Notification[];
    }
  });

  // התראות אדמין (לוג בלבד)
  const { data: adminNotifications = [] } = useQuery({
    queryKey: ["admin-admin-notifications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_notifications")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as AdminNotification[];
    }
  });

  const unreadCount = adminNotifications.filter((n) => !n.is_read).length;

  // שליחת התראה מרובה לפי audience
 const upsertMutation = useMutation({
  mutationFn: async (notif: NotificationFormData) => {
    let userRows: { id: string }[] = [];
    if (notif.audience === "all") {
      const { data, error } = await supabase.from("profiles").select("id");
      if (error) throw error;
      userRows = data ?? [];
    } else if (notif.audience === "admins") {
      const { data, error } = await supabase.from("profiles").select("id").eq("role", "admin");
      if (error) throw error;
      userRows = data ?? [];
    } else if (notif.audience === "tutors") {
      const { data, error } = await supabase.from("profiles").select("id").eq("is_tutor", true);
      if (error) throw error;
      userRows = data ?? [];
    }
    if (!userRows.length) throw new Error("לא נמצאו משתמשים ליעד שנבחר");

    // Bulk insert - יוצר התראה לכל משתמש (לפי הקהל)
    const notifications: Omit<Notification, "id">[] = userRows.map(u => ({
      ...notif,
      user_id: u.id,
      // לא שומרים audience
    }));

    // עדכון (edit) - מעדכן רק את ההתראה שנבחרה
    if (editingNotification && editingNotification.id) {
      const { error } = await supabase
        .from("notifications")
        .update({ ...notifications[0] })
        .eq("id", editingNotification.id);
      if (error) throw error;
    } else {
      // יצירה חדשה - bulk insert
      const { error } = await supabase.from("notifications").insert(notifications);
      if (error) throw error;
    }
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
    toast({ title: "הצלחה", description: editingNotification ? "התראה עודכנה" : "התראה נשלחה" });
    setEditingNotification(null);
    setIsDialogOpen(false);
  },
  onError: (err: any) => {
    toast({ title: "שגיאה", description: err.message, variant: "destructive" });
  }
});

  // מחיקת התראה
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("notifications").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
      toast({ title: "נמחקה", description: "התראה נמחקה" });
    }
  });

  // יצירת התראת אדמין (לוג בלבד)
  const createAdminNotifMutation = useMutation({
    mutationFn: async (notif: Omit<AdminNotification, "id" | "created_at" | "is_read">) => {
      const { error } = await supabase
        .from("admin_notifications")
        .insert([{ ...notif }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-admin-notifications"] });
      toast({ title: "הצלחה", description: "התראת אדמין נוצרה" });
      setIsAdminDialogOpen(false);
      setEditingAdminNotif(null);
    },
    onError: (err: any) => {
      toast({ title: "שגיאה", description: err.message, variant: "destructive" });
    }
  });

  // מחיקת התראת אדמין
  const deleteAdminNotifMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("admin_notifications")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-admin-notifications"] });
      toast({ title: "נמחקה", description: "התראת אדמין נמחקה" });
    }
  });

  // סינון (אין ערך ריק)
  const filteredNotifications = notifications.filter(n => {
    const searchMatch =
      !search ||
      n.title?.toLowerCase().includes(search.toLowerCase()) ||
      n.message?.toLowerCase().includes(search.toLowerCase());
    const typeMatch = filterType === "all" || n.type === filterType;
    const deliveryMatch = filterDelivery === "all" || n.delivery_target === filterDelivery;
    return searchMatch && typeMatch && deliveryMatch;
  });

  return (
    <Card className="bg-gradient-to-tr from-blue-50 to-purple-50 shadow-xl border-2 border-blue-100 rounded-2xl p-2 sm:p-6 min-h-[80vh]">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-3 text-2xl font-extrabold">
            <Bell className="w-7 h-7 text-blue-500" />
            ניהול התראות מערכת
            <Badge variant={unreadCount ? "destructive" : "secondary"}>
              {unreadCount ? `${unreadCount} התראות אדמין חדשות` : "אין התראות אדמין חדשות"}
            </Badge>
          </CardTitle>
        </div>
      </CardHeader>
      <Tabs value={tab} onValueChange={v => setTab(v as "system" | "admin")} className="w-full">
        <TabsList className="mb-3 w-full flex justify-center">
          <TabsTrigger value="system">התראות מערכת</TabsTrigger>
          <TabsTrigger value="admin">התראות אדמין</TabsTrigger>
        </TabsList>
        <TabsContent value="system">
          <div className="flex flex-wrap gap-2 mb-6 items-center">
            <Input
              placeholder="חפש בכותרת/תוכן..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="max-w-xs"
            />
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="סוג התראה" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">הכל</SelectItem>
                {NOTIFICATION_TYPES.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterDelivery} onValueChange={setFilterDelivery}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="אופן משלוח" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">הכל</SelectItem>
                {DELIVERY_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => {
              setSearch("");
              setFilterType("all");
              setFilterDelivery("all");
            }}>איפוס סינון</Button>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  onClick={() => {
                    setEditingNotification(null);
                    setIsDialogOpen(true);
                  }}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Plus className="w-4 h-4 ml-2" />
                  הוצאת התראה חדשה
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg bg-white dark:bg-gray-900">
                <DialogHeader>
                  <DialogTitle>
                    {editingNotification ? "עריכת התראה" : "יצירת התראה חדשה"}
                  </DialogTitle>
                </DialogHeader>
                <NotificationForm
                  defaultData={editingNotification}
                  onSave={data => upsertMutation.mutate(data)}
                  isLoading={upsertMutation.isPending}
                />
              </DialogContent>
            </Dialog>
          </div>
          <div className="overflow-x-auto rounded-xl border border-gray-100 shadow-md bg-white dark:bg-gray-900">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>כותרת</TableHead>
                  <TableHead>סוג</TableHead>
                  <TableHead>קהל יעד</TableHead>
                  <TableHead>נשלח ב</TableHead>
                  <TableHead>תפוגה</TableHead>
                  <TableHead>סטטוס</TableHead>
                  <TableHead>פעולות</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredNotifications.map((n) => (
                  <TableRow key={n.id}>
                    <TableCell>
                      <div className="font-bold">{n.title}</div>
                      <div className="text-xs text-gray-500">{n.message?.slice(0, 50)}</div>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-blue-100 text-blue-700">{NOTIFICATION_TYPES.find(t => t.value === n.type)?.label || n.type}</Badge>
                      {n.is_critical && <Badge className="bg-red-100 text-red-700 ml-2"><AlertCircle className="inline w-3 h-3" /> קריטית</Badge>}
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-purple-100 text-purple-700">
                        {DELIVERY_OPTIONS.find(o => o.value === n.delivery_target)?.label || "אתר"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs">{n.created_at ? dayjs(n.created_at).locale("he").format("DD/MM/YY HH:mm") : "-"}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs">{n.expires_at ? dayjs(n.expires_at).locale("he").format("DD/MM/YY HH:mm") : "-"}</div>
                    </TableCell>
                    <TableCell>
                      {n.is_read ? <Badge className="bg-green-100 text-green-700">נקראה</Badge>
                        : <Badge className="bg-yellow-100 text-yellow-700">לא נקראה</Badge>}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="outline" size="sm" onClick={() => {
                          setEditingNotification(n);
                          setIsDialogOpen(true);
                        }}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => {
                          if (window.confirm("למחוק התראה זו?")) {
                            deleteMutation.mutate(n.id!);
                          }
                        }}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredNotifications.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-gray-400 py-6">
                      לא נמצאו התראות.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* התראות אדמין */}
        <TabsContent value="admin">
          <div className="flex flex-wrap gap-2 mb-6 items-center">
            <Dialog open={isAdminDialogOpen} onOpenChange={setIsAdminDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  onClick={() => {
                    setEditingAdminNotif(null);
                    setIsAdminDialogOpen(true);
                  }}
                  className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <ShieldCheck className="w-4 h-4 ml-2" />
                  צור התראת אדמין
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg bg-white dark:bg-gray-900">
                <DialogHeader>
                  <DialogTitle>
                    {editingAdminNotif ? "עריכת התראת אדמין" : "יצירת התראת אדמין"}
                  </DialogTitle>
                </DialogHeader>
                <AdminNotifForm
                  defaultData={editingAdminNotif}
                  onSave={data => createAdminNotifMutation.mutate(data)}
                  isLoading={createAdminNotifMutation.isPending}
                />
              </DialogContent>
            </Dialog>
          </div>
          <div className="overflow-x-auto rounded-xl border border-gray-100 shadow-md bg-white dark:bg-gray-900">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>כותרת</TableHead>
                  <TableHead>תוכן</TableHead>
                  <TableHead>נוצר ב</TableHead>
                  <TableHead>סטטוס</TableHead>
                  <TableHead>פעולות</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {adminNotifications.map((n) => (
                  <TableRow key={n.id}>
                    <TableCell>
                      <div className="font-bold">{n.title}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs text-gray-700">{n.message?.slice(0, 70)}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs">{n.created_at ? dayjs(n.created_at).locale("he").format("DD/MM/YY HH:mm") : "-"}</div>
                    </TableCell>
                    <TableCell>
                      {n.is_read
                        ? <Badge className="bg-green-100 text-green-700">נקראה</Badge>
                        : <Badge className="bg-yellow-100 text-yellow-700">לא נקראה</Badge>}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="destructive" size="sm" onClick={() => {
                          if (window.confirm("למחוק התראת אדמין זו?")) {
                            deleteAdminNotifMutation.mutate(n.id);
                          }
                        }}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {adminNotifications.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-gray-400 py-6">
                      לא נמצאו התראות אדמין.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
};

// === טופס התראה רגילה עם בחירת קהל יעד ===
const NotificationForm: React.FC<{
  defaultData?: Notification | null;
  onSave: (data: NotificationFormData) => void;
  isLoading: boolean;
}> = ({ defaultData, onSave, isLoading }) => {
  const [form, setForm] = useState<NotificationFormData>({
    audience: "all",
    type: defaultData?.type || "",
    title: defaultData?.title || "",
    message: defaultData?.message || "",
    delivery_target: defaultData?.delivery_target || "site",
    is_critical: defaultData?.is_critical || false,
    push_to_phone: defaultData?.push_to_phone || false,
    expires_at: defaultData?.expires_at ? dayjs(defaultData?.expires_at).format("YYYY-MM-DDTHH:mm") : "",
    link: defaultData?.link || "",
    is_read: defaultData?.is_read || false,
    assignment_id: defaultData?.assignment_id,
    exam_id: defaultData?.exam_id,
    reminder_days_before: defaultData?.reminder_days_before,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.message || !form.type || !form.delivery_target) return;
    onSave({
      ...form,
      expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-bold">סוג התראה</label>
          <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
            <SelectTrigger>
              <SelectValue placeholder="בחר סוג" />
            </SelectTrigger>
            <SelectContent>
              {NOTIFICATION_TYPES.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm font-bold">אופן משלוח</label>
          <Select value={form.delivery_target} onValueChange={v => setForm(f => ({ ...f, delivery_target: v as "site" | "push" | "both" }))}>
            <SelectTrigger>
              <SelectValue placeholder="בחר ערוץ" />
            </SelectTrigger>
            <SelectContent>
              {DELIVERY_OPTIONS.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <label className="text-sm font-bold">קהל יעד</label>
        <Select value={form.audience} onValueChange={v => setForm(f => ({ ...f, audience: v }))}>
          <SelectTrigger>
            <SelectValue placeholder="בחר קהל יעד" />
          </SelectTrigger>
          <SelectContent>
            {AUDIENCES.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="text-sm font-bold">כותרת</label>
        <Input
          required
          value={form.title}
          onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
          maxLength={90}
        />
      </div>
      <div>
        <label className="text-sm font-bold">תוכן התראה</label>
        <Input
          required
          value={form.message}
          onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
          maxLength={250}
        />
      </div>
      <div>
        <label className="text-sm font-bold">קישור (לא חובה)</label>
        <Input
          type="url"
          value={form.link}
          onChange={e => setForm(f => ({ ...f, link: e.target.value }))}
        />
      </div>
      <div className="flex gap-3">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.is_critical}
            onChange={e => setForm(f => ({ ...f, is_critical: e.target.checked }))}
          />
          <AlertCircle className="w-4 h-4 text-red-500" /> קריטית (אדום)
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.push_to_phone}
            onChange={e => setForm(f => ({ ...f, push_to_phone: e.target.checked }))}
          />
          <Mail className="w-4 h-4 text-blue-500" /> שלח Push
        </label>
      </div>
      <div>
        <label className="text-sm font-bold">פג תוקף (לא חובה)</label>
        <Input
          type="datetime-local"
          value={form.expires_at}
          onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))}
        />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="submit" className="bg-blue-600 text-white" disabled={isLoading}>
          {isLoading ? "שולח..." : "שלח התראה"}
        </Button>
      </div>
    </form>
  );
};

// טופס התראת אדמין
const AdminNotifForm: React.FC<{
  defaultData?: AdminNotification | null;
  onSave: (data: Omit<AdminNotification, "id" | "created_at" | "is_read">) => void;
  isLoading: boolean;
}> = ({ defaultData, onSave, isLoading }) => {
  const [form, setForm] = useState<Omit<AdminNotification, "id" | "created_at" | "is_read">>({
    title: defaultData?.title || "",
    message: defaultData?.message || "",
    metadata: defaultData?.metadata || {},
    triggered_by: defaultData?.triggered_by || undefined,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.message) return;
    onSave(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-bold">כותרת</label>
        <Input
          required
          value={form.title}
          onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
          maxLength={90}
        />
      </div>
      <div>
        <label className="text-sm font-bold">תוכן ההתראה</label>
        <Input
          required
          value={form.message}
          onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
          maxLength={250}
        />
      </div>
      <div>
        <label className="text-sm font-bold">Metadata (לא חובה)</label>
        <Input
          value={JSON.stringify(form.metadata || {})}
          onChange={e => {
            try {
              setForm(f => ({ ...f, metadata: JSON.parse(e.target.value) }));
            } catch {
              // ignore if invalid json
            }
          }}
        />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="submit" className="bg-purple-600 text-white" disabled={isLoading}>
          {isLoading ? "שולח..." : "שלח התראת אדמין"}
        </Button>
      </div>
    </form>
  );
};

export default AdminNotificationsPanel;
