import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Settings, User, Save } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

const gradeLevels = ["السنة الأولى متوسط", "السنة الثانية متوسط", "السنة الثالثة متوسط", "السنة الرابعة متوسط"];
const subjects = ["التاريخ والجغرافيا", "التربية المدنية", "التاريخ والجغرافيا والتربية المدنية"];

export default function Profile() {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const { data: profile, isLoading } = trpc.profile.get.useQuery();

  const [form, setForm] = useState({
    displayName: profile?.displayName || "",
    subject: profile?.subject || subjects[0],
    academicYear: profile?.academicYear || "2025-2026",
    school: profile?.school || "",
    province: profile?.province || "",
  });

  // Sync form when profile loads
  if (profile && !form.displayName && profile.displayName) {
    setForm({
      displayName: profile.displayName,
      subject: profile.subject || subjects[0],
      academicYear: profile.academicYear || "2025-2026",
      school: profile.school || "",
      province: profile.province || "",
    });
  }

  const updateMutation = trpc.profile.create.useMutation({
    onSuccess: () => {
      utils.profile.get.invalidate();
      toast.success("تم تحديث الملف الشخصي");
    },
    onError: () => toast.error("خطأ في التحديث"),
  });

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">الملف الشخصي</h1>
        <p className="text-muted-foreground mt-1">إدارة معلومات المعلم</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            معلومات المعلم
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>الاسم</Label>
            <p className="text-sm text-muted-foreground mt-1">{user?.name || "غير محدد"}</p>
          </div>
          <div>
            <Label>البريد الإلكتروني</Label>
            <p className="text-sm text-muted-foreground mt-1">{user?.email || "غير محدد"}</p>
          </div>
          <div>
            <Label>الاسم المعروض</Label>
            <Input value={form.displayName} onChange={e => setForm({ ...form, displayName: e.target.value })} placeholder="مثال: الأستاذ محمد" />
          </div>
          <div>
            <Label>المادة</Label>
            <Select value={form.subject} onValueChange={v => setForm({ ...form, subject: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {subjects.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>العام الأكاديمي</Label>
            <Select value={form.academicYear} onValueChange={v => setForm({ ...form, academicYear: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["2024-2025", "2025-2026", "2026-2027"].map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>المدرسة</Label>
            <Input value={form.school} onChange={e => setForm({ ...form, school: e.target.value })} placeholder="اسم المدرسة" />
          </div>
          <div>
            <Label>الولاية</Label>
            <Input value={form.province} onChange={e => setForm({ ...form, province: e.target.value })} placeholder="الولاية" />
          </div>
          <Button onClick={() => updateMutation.mutate(form as any)} disabled={updateMutation.isPending}>
            <Save className="w-4 h-4 ml-2" />
            {updateMutation.isPending ? "جاري الحفظ..." : "حفظ"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
