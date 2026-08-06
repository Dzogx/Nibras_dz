import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, GraduationCap, Users, Trash2, Pencil } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const gradeLevels = ["السنة الأولى متوسط", "السنة الثانية متوسط", "السنة الثالثة متوسط", "السنة الرابعة متوسط"];
const subjects = ["التاريخ والجغرافيا", "التربية المدنية", "التاريخ والجغرافيا والتربية المدنية"];

export default function Classes() {
  const [isAdding, setIsAdding] = useState(false);
  const [editClassId, setEditClassId] = useState<number | null>(null);
  const [newClass, setNewClass] = useState({
    name: "",
    gradeLevel: gradeLevels[0],
    section: "",
    subject: subjects[0],
    academicYear: "2025-2026",
    studentCount: undefined as number | undefined,
  });

  const utils = trpc.useUtils();
  const { data: classesList, isLoading } = trpc.classes.list.useQuery();

  const createMutation = trpc.classes.create.useMutation({
    onSuccess: () => {
      utils.classes.list.invalidate();
      toast.success("تمت إضافة الفصل");
      setIsAdding(false);
      setNewClass({ name: "", gradeLevel: gradeLevels[0], section: "", subject: subjects[0], academicYear: "2025-2026", studentCount: undefined });
    },
    onError: () => toast.error("خطأ في إضافة الفصل"),
  });

  const updateMutation = trpc.classes.update.useMutation({
    onSuccess: () => {
      utils.classes.list.invalidate();
      toast.success("تم تحديث الفصل");
      setEditClassId(null);
    },
    onError: () => toast.error("خطأ في التحديث"),
  });

  const deleteMutation = trpc.classes.delete.useMutation({
    onSuccess: () => {
      utils.classes.list.invalidate();
      toast.success("تم حذف الفصل");
    },
  });

  const startEdit = (cls: any) => {
    setEditClassId(cls.id);
    setNewClass({
      name: cls.name || "",
      gradeLevel: cls.gradeLevel || gradeLevels[0],
      section: cls.section || "",
      subject: cls.subject || subjects[0],
      academicYear: cls.academicYear || "2025-2026",
      studentCount: cls.studentCount || undefined,
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">إدارة الفصول</h1>
          <p className="text-muted-foreground mt-1">إنشاء وإدارة الفصول الدراسية</p>
        </div>
        <Dialog open={isAdding} onOpenChange={setIsAdding}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 ml-2" />
              إضافة فصل
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>إضافة فصل جديد</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div><Label>اسم الفصل</Label>
                <Input value={newClass.name} onChange={e => setNewClass({ ...newClass, name: e.target.value })} placeholder="مثال: 1 متوسط 1" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>المستوى</Label>
                  <Select value={newClass.gradeLevel} onValueChange={v => setNewClass({ ...newClass, gradeLevel: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{gradeLevels.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>القسم</Label>
                  <Input value={newClass.section} onChange={e => setNewClass({ ...newClass, section: e.target.value })} placeholder="القسم" />
                </div>
              </div>
              <div><Label>المادة</Label>
                <Select value={newClass.subject} onValueChange={v => setNewClass({ ...newClass, subject: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{subjects.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>عدد التلاميذ</Label>
                <Input type="number" value={newClass.studentCount || ""} onChange={e => setNewClass({ ...newClass, studentCount: e.target.value ? parseInt(e.target.value) : undefined })} placeholder="عدد التلاميذ" />
              </div>
              <Button onClick={() => createMutation.mutate(newClass as any)} disabled={createMutation.isPending || !newClass.name}>
                {createMutation.isPending ? "جاري الإضافة..." : "إضافة"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={editClassId !== null} onOpenChange={open => { if (!open) setEditClassId(null); }}>
          <DialogContent>
            <DialogHeader><DialogTitle>تعديل الفصل</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>اسم الفصل</Label>
                <Input value={newClass.name} onChange={e => setNewClass({ ...newClass, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>المستوى</Label>
                  <Select value={newClass.gradeLevel} onValueChange={v => setNewClass({ ...newClass, gradeLevel: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{gradeLevels.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>القسم</Label>
                  <Input value={newClass.section} onChange={e => setNewClass({ ...newClass, section: e.target.value })} />
                </div>
              </div>
              <div><Label>المادة</Label>
                <Select value={newClass.subject} onValueChange={v => setNewClass({ ...newClass, subject: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{subjects.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>عدد التلاميذ</Label>
                <Input type="number" value={newClass.studentCount || ""} onChange={e => setNewClass({ ...newClass, studentCount: e.target.value ? parseInt(e.target.value) : undefined })} />
              </div>
              <Button onClick={() => updateMutation.mutate({ id: editClassId!, ...newClass } as any)} disabled={updateMutation.isPending || !newClass.name}>
                {updateMutation.isPending ? "جاري الحفظ..." : "حفظ التغييرات"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? <div className="text-center py-12 text-muted-foreground">جاري التحميل...</div>
      : classesList && classesList.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {classesList.map((cls) => (
            <Card key={cls.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-primary" />
                    {cls.name}
                  </CardTitle>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => startEdit(cls)}>
                      <Pencil className="w-4 h-4 text-muted-foreground" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate({ id: cls.id })}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between"><span className="text-muted-foreground">المستوى:</span><span>{cls.gradeLevel}</span></div>
                  <div className="flex items-center justify-between"><span className="text-muted-foreground">المادة:</span><span>{cls.subject}</span></div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground"><Users className="w-3 h-3 inline ml-1" />عدد التلاميذ:</span>
                    <span>{cls.studentCount || "-"}</span>
                  </div>
                  <div className="flex items-center justify-between"><span className="text-muted-foreground">العام:</span><span>{cls.academicYear}</span></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card><CardContent className="p-12 text-center">
          <GraduationCap className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">لا توجد فصول</h3>
          <p className="text-muted-foreground">أضف فصلك الأول للبدء</p>
        </CardContent></Card>
      )}
    </div>
  );
}
