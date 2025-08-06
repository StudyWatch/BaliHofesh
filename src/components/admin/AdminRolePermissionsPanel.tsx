import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger
} from "@/components/ui/drawer";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Pencil, Trash2, Check, XCircle, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";

const RESOURCES = [
  { value: "users", label: "משתמשים" },
  { value: "notifications", label: "התראות" },
  { value: "store", label: "חנות" },
  { value: "tutors", label: "מורים" },
  { value: "user_reports", label: "פניות" },
  { value: "admin_logs", label: "יומני אדמין" },
  { value: "affiliates", label: "אפיליאייט" },
  { value: "banners", label: "באנרים" },
];

const ROLES = [
  { value: "admin", label: "מנהל", color: "bg-green-700" },
  { value: "support", label: "תמיכה", color: "bg-blue-600" },
  { value: "editor", label: "עורך", color: "bg-purple-600" },
  { value: "tutor", label: "מורה", color: "bg-pink-500" },
  { value: "student", label: "סטודנט", color: "bg-gray-500" },
];

type Permission = {
  id: string;
  role: string;
  resource: string;
  can_read: boolean;
  can_create: boolean;
  can_update: boolean;
  can_delete: boolean;
  created_at: string;
  updated_at: string;
};

const colClasses = "px-2 py-2 text-center text-base whitespace-nowrap";
const getRoleColor = (role: string) =>
  ROLES.find(r => r.value === role)?.color || "bg-gray-300";

const AdminRolePermissionsPanel: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editPerm, setEditPerm] = useState<Permission | null>(null);

  // קריאה מה-DB
  const { data: permissions = [], isLoading } = useQuery({
    queryKey: ["role-permissions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("role_permissions")
        .select("*")
        .order("role", { ascending: true });
      if (error) throw error;
      return data as Permission[];
    }
  });

  // עדכון הרשאה בודדת (מיידי)
  const updateSinglePermission = useMutation({
    mutationFn: async ({
      permId,
      key,
      value
    }: { permId: string; key: keyof Omit<Permission, "id" | "role" | "resource" | "created_at" | "updated_at">; value: boolean }) => {
      const { error } = await supabase
        .from("role_permissions")
        .update({ [key]: value })
        .eq("id", permId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["role-permissions"] }),
    onError: err =>
      toast({ title: "שגיאה", description: String(err), variant: "destructive" }),
  });

  // הוספה/עדכון
  const upsertMutation = useMutation({
    mutationFn: async (perm: Omit<Permission, "id" | "created_at" | "updated_at">) => {
      if (editPerm && editPerm.id) {
        const { error } = await supabase
          .from("role_permissions")
          .update(perm)
          .eq("id", editPerm.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("role_permissions")
          .insert([perm]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["role-permissions"] });
      setDrawerOpen(false);
      setEditPerm(null);
      toast({ title: "עודכן", description: "הרשאה נשמרה!" });
    },
    onError: err =>
      toast({ title: "שגיאה", description: String(err), variant: "destructive" }),
  });

  // מחיקה
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("role_permissions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["role-permissions"] });
      toast({ title: "נמחק", description: "הרשאה הוסרה" });
    }
  });

  // בניית מטריצה - השלמת כל תפקיד+מודול (גם חסרים)
  const matrix: Record<string, Record<string, Permission | null>> = {};
  ROLES.forEach(r => {
    matrix[r.value] = {};
    RESOURCES.forEach(res => {
      matrix[r.value][res.value] =
        permissions.find(p => p.role === r.value && p.resource === res.value) || null;
    });
  });

  return (
    <Card className="shadow-2xl border-2 rounded-3xl p-2 sm:p-8 min-h-[80vh] bg-white dark:bg-gray-950 transition">
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
          <CardTitle className="flex items-center gap-3 text-3xl font-extrabold">
            <Shield className="w-7 h-7 text-green-700 drop-shadow" />
            מרכז הרשאות מערכת
          </CardTitle>
          <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
            <DrawerTrigger asChild>
              <Button
                className="bg-green-700 hover:bg-green-800 text-white px-5 py-2 font-bold rounded-xl"
                onClick={() => { setEditPerm(null); setDrawerOpen(true); }}>
                <Plus className="w-5 h-5 ml-2" /> הוספת הרשאה
              </Button>
            </DrawerTrigger>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle className="text-xl font-bold">{editPerm ? "עריכת הרשאה" : "הרשאה חדשה"}</DrawerTitle>
              </DrawerHeader>
              <RolePermissionForm
                initial={editPerm}
                onSave={perm => upsertMutation.mutate(perm)}
                onClose={() => setDrawerOpen(false)}
              />
            </DrawerContent>
          </Drawer>
        </div>
        <div className="mt-2 text-sm text-gray-400">הגדר והרכב הרשאות לכל תפקיד ולכל מודול במערכת.</div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto border rounded-xl shadow bg-white dark:bg-gray-900 transition-all">
          <Table className="min-w-[1050px]">
            <TableHeader>
              <TableRow>
                <TableHead className="text-right text-xl w-32">תפקיד</TableHead>
                {RESOURCES.map(res => (
                  <TableHead key={res.value} className="text-center text-base w-44">{res.label}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {ROLES.map(role => (
                <TableRow key={role.value} className="group hover:bg-blue-50 dark:hover:bg-blue-900 transition">
                  <TableCell className={`font-bold ${getRoleColor(role.value)} text-white text-lg rounded-xl text-center`}>
                    {role.label}
                  </TableCell>
                  {RESOURCES.map(res => {
                    const perm = matrix[role.value][res.value];
                    return (
                      <TableCell key={res.value} className={colClasses + " align-middle"}>
                        {perm ? (
                          <div className="flex flex-col items-center gap-1">
                            <PermissionToggle label="קריאה" value={perm.can_read} onChange={v => updateSinglePermission.mutate({ permId: perm.id, key: "can_read", value: v })} />
                            <PermissionToggle label="יצירה" value={perm.can_create} onChange={v => updateSinglePermission.mutate({ permId: perm.id, key: "can_create", value: v })} />
                            <PermissionToggle label="עדכון" value={perm.can_update} onChange={v => updateSinglePermission.mutate({ permId: perm.id, key: "can_update", value: v })} />
                            <PermissionToggle label="מחיקה" value={perm.can_delete} onChange={v => updateSinglePermission.mutate({ permId: perm.id, key: "can_delete", value: v })} />
                            <div className="flex gap-1 mt-1">
                              <Button size="icon" variant="ghost" onClick={() => { setEditPerm(perm); setDrawerOpen(true); }} title="ערוך">
                                <Pencil className="w-4 h-4 text-blue-600" />
                              </Button>
                              <Button size="icon" variant="ghost" onClick={() => window.confirm("למחוק הרשאה?") && deleteMutation.mutate(perm.id)} title="מחק">
                                <Trash2 className="w-4 h-4 text-red-600" />
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-1">
                            <Badge variant="outline" className="text-xs text-gray-400 mb-1">אין הרשאה</Badge>
                            <Button
                              variant="ghost"
                              size="xs"
                              onClick={() => {
                                setEditPerm({
                                  id: "",
                                  role: role.value,
                                  resource: res.value,
                                  can_read: false,
                                  can_create: false,
                                  can_update: false,
                                  can_delete: false,
                                  created_at: "",
                                  updated_at: ""
                                });
                                setDrawerOpen(true);
                              }}>
                              הוסף +
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

// כפתור/סוויץ' צבעוני להרשאה
const PermissionToggle: React.FC<{ label: string; value: boolean; onChange: (val: boolean) => void }> = ({ label, value, onChange }) => (
  <div className="flex items-center gap-1">
    <span className="text-xs">{label}</span>
    <Switch checked={value} onCheckedChange={onChange} />
    {value
      ? <Check className="w-4 h-4 text-green-600" />
      : <XCircle className="w-4 h-4 text-red-500" />
    }
  </div>
);

// טופס Drawer להוספה/עריכה
const RolePermissionForm: React.FC<{
  initial?: Permission | null;
  onSave: (perm: Omit<Permission, "id" | "created_at" | "updated_at">) => void;
  onClose: () => void;
}> = ({ initial, onSave, onClose }) => {
  const [form, setForm] = useState<Omit<Permission, "id" | "created_at" | "updated_at">>({
    role: initial?.role || "",
    resource: initial?.resource || "",
    can_read: initial?.can_read ?? true,
    can_create: initial?.can_create ?? false,
    can_update: initial?.can_update ?? false,
    can_delete: initial?.can_delete ?? false,
  });

  const handleChange = (key: keyof typeof form, val: any) => setForm(f => ({ ...f, [key]: val }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.role || !form.resource) return;
    onSave(form);
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4">
      <div className="flex gap-3">
        <Select value={form.role} onValueChange={v => handleChange("role", v)}>
          <SelectTrigger className="w-28"><SelectValue placeholder="תפקיד" /></SelectTrigger>
          <SelectContent>
            {ROLES.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={form.resource} onValueChange={v => handleChange("resource", v)}>
          <SelectTrigger className="w-36"><SelectValue placeholder="מודול" /></SelectTrigger>
          <SelectContent>
            {RESOURCES.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-wrap gap-2 mt-2">
        <PermissionToggle label="קריאה" value={form.can_read} onChange={v => handleChange("can_read", v)} />
        <PermissionToggle label="יצירה" value={form.can_create} onChange={v => handleChange("can_create", v)} />
        <PermissionToggle label="עדכון" value={form.can_update} onChange={v => handleChange("can_update", v)} />
        <PermissionToggle label="מחיקה" value={form.can_delete} onChange={v => handleChange("can_delete", v)} />
      </div>
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onClose}>ביטול</Button>
        <Button type="submit" className="bg-green-700 text-white">{initial ? "עדכן" : "הוסף"}</Button>
      </div>
    </form>
  );
};

export default AdminRolePermissionsPanel;
