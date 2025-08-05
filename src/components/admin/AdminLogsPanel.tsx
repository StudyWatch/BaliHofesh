import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card, CardHeader, CardTitle, CardContent
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, ShieldCheck, Search, Info, Filter, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import dayjs from "dayjs";
import "dayjs/locale/he";

const ACTION_COLORS: Record<string, string> = {
  create: "bg-green-100 text-green-700",
  update: "bg-blue-100 text-blue-700",
  delete: "bg-red-100 text-red-700",
  login: "bg-purple-100 text-purple-700",
  view: "bg-yellow-100 text-yellow-800",
};

const TARGET_TYPES = [
  { value: "", label: "הכל" },
  { value: "user", label: "משתמש" },
  { value: "exam", label: "בחינה" },
  { value: "assignment", label: "מטלה" },
  { value: "tutor", label: "מורה" },
  { value: "notification", label: "התראה" },
  { value: "store", label: "מוצר/חנות" },
  { value: "affiliate", label: "שותף" },
  { value: "system", label: "מערכת" },
];

const ACTION_TYPES = [
  { value: "", label: "הכל" },
  { value: "create", label: "יצירה" },
  { value: "update", label: "עדכון" },
  { value: "delete", label: "מחיקה" },
  { value: "login", label: "התחברות" },
  { value: "view", label: "צפייה" },
];

const getActionLabel = (action: string) =>
  ACTION_TYPES.find(a => a.value === action)?.label || action;

const getTargetLabel = (target: string) =>
  TARGET_TYPES.find(t => t.value === target)?.label || target;

const formatDate = (d?: string) => d ? dayjs(d).locale("he").format("DD/MM/YY HH:mm") : "-";

type LogEntry = {
  id: string;
  admin_id: string;
  action_type: string;
  target_type: string;
  target_id?: string;
  description: string;
  metadata?: any;
  created_at: string;
};

const AdminLogsPanel: React.FC = () => {
  const [search, setSearch] = useState("");
  const [actionType, setActionType] = useState("");
  const [targetType, setTargetType] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [adminId, setAdminId] = useState("");
  const [viewMeta, setViewMeta] = useState<any>(null);

  // לוגים
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["admin-logs"],
    queryFn: async () => {
      let query = supabase
        .from("admin_logs" as any) // אם יש שגיאת טיפוסים – תוסיף as any, או תעדכן טיפוסים בפרויקט
        .select("*")
        .order("created_at", { ascending: false });
      const { data, error } = await query;
      if (error) throw error;
      return data as LogEntry[];
    }
  });

  // פאנל משתמשי אדמין
  const { data: admins = [] } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, name, email")
        .eq("role", "admin");
      if (error) return [];
      return data || [];
    }
  });

  // סינון מתקדם
  const filteredLogs = logs.filter(log => {
    const searchMatch =
      !search ||
      log.description?.toLowerCase().includes(search.toLowerCase()) ||
      log.admin_id?.toLowerCase().includes(search.toLowerCase()) ||
      log.target_id?.toLowerCase().includes(search.toLowerCase());

    const actionMatch = !actionType || log.action_type === actionType;
    const targetMatch = !targetType || log.target_type === targetType;

    const dateMatch =
      (!dateFrom || new Date(log.created_at) >= new Date(dateFrom)) &&
      (!dateTo || new Date(log.created_at) <= new Date(dateTo));

    const adminMatch = !adminId || log.admin_id === adminId;

    return searchMatch && actionMatch && targetMatch && dateMatch && adminMatch;
  });

  return (
    <Card className="shadow-2xl border-2 rounded-2xl p-2 sm:p-8 min-h-[80vh] bg-white dark:bg-gray-950">
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
          <CardTitle className="flex items-center gap-2 text-2xl font-extrabold">
            <ShieldCheck className="w-6 h-6 text-purple-800" />
            לוגים ומעקב אדמין
          </CardTitle>
          <div className="flex flex-wrap gap-2 mt-2 sm:mt-0">
            <Input
              placeholder="חיפוש חופשי"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="max-w-xs"
            />
            <Select value={actionType} onValueChange={setActionType}>
              <SelectTrigger className="w-28">
                <SelectValue placeholder="סוג פעולה" />
              </SelectTrigger>
              <SelectContent>
                {ACTION_TYPES.map(a => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={targetType} onValueChange={setTargetType}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="סוג יעד" />
              </SelectTrigger>
              <SelectContent>
                {TARGET_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={adminId} onValueChange={setAdminId}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="מנהל" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">הכל</SelectItem>
                {admins.map((a: any) =>
                  <SelectItem key={a.id} value={a.id}>{a.name || a.email}</SelectItem>
                )}
              </SelectContent>
            </Select>
            <Input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              title="מתאריך"
              className="w-32"
            />
            <Input
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              title="עד תאריך"
              className="w-32"
            />
            <Button variant="outline" onClick={() => {
              setSearch(""); setActionType(""); setTargetType(""); setAdminId(""); setDateFrom(""); setDateTo("");
            }}>איפוס</Button>
          </div>
        </div>
        <div className="mt-2 text-sm text-gray-400">
          <Info className="inline w-4 h-4 mb-1" /> כל פעולה חשובה במערכת נרשמת כאן, כולל מחיקות, עדכונים, כניסות וצפיות.<br />
          ניתן לסנן לפי תאריך, פעולה, מנהל, יעד, ולחפש תיאור/מזהה.
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto border rounded-xl shadow bg-white dark:bg-gray-900">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-center">מנהל</TableHead>
                <TableHead className="text-center">סוג פעולה</TableHead>
                <TableHead className="text-center">יעד</TableHead>
                <TableHead className="text-center">מזהה יעד</TableHead>
                <TableHead className="text-center">תיאור</TableHead>
                <TableHead className="text-center">זמן</TableHead>
                <TableHead className="text-center">פרטים נוספים</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.map((log) => (
                <TableRow key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <TableCell>
                    <Badge className="bg-purple-200 text-purple-900">
                      {admins.find((a: any) => a.id === log.admin_id)?.name || log.admin_id}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={ACTION_COLORS[log.action_type] || "bg-gray-100 text-gray-700"}>
                      {getActionLabel(log.action_type)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-gray-600">{getTargetLabel(log.target_type)}</Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{log.target_id || "-"}</TableCell>
                  <TableCell>
                    <span className="truncate block max-w-xs">{log.description}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs">{formatDate(log.created_at)}</span>
                  </TableCell>
                  <TableCell>
                    {log.metadata ?
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="icon" title="הצג פרטים"><Eye className="w-4 h-4 text-blue-700" /></Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Metadata</DialogTitle>
                          </DialogHeader>
                          <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto max-h-[400px]">{JSON.stringify(log.metadata, null, 2)}</pre>
                        </DialogContent>
                      </Dialog>
                      : <span className="text-gray-400">—</span>}
                  </TableCell>
                </TableRow>
              ))}
              {filteredLogs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-gray-400 py-6">לא נמצאו רשומות.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminLogsPanel;
