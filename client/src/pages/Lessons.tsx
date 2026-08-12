import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, ClipboardList, Trash2, CheckCircle2, Clock, ArrowLeft } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useLocation } from "wouter";

const gradeLevels = ["السنة الأولى متوسط", "السنة الثانية متوسط", "السنة الثالثة متوسط", "السنة الرابعة متوسط"];
const subjects = ["التاريخ والجغرافيا", "الجغرافيا", "التربية المدنية", "التاريخ والجغرافيا والتربية المدنية"];

export default function Lessons() {
  const [, setLocation] = useLocation();
  const [isAdding, setIsAdding] = useState(false);
  const [filterCompleted, setFilterCompleted] = useState<string>("all");
  const [newLesson, setNewLesson] = useState({
    classId: undefined as number | undefined,
    title: "",
    subject: subjects[0],
    gradeLevel: gradeLevels[0],
    unitTitle: "",
    unitNumber: undefined as number | undefined,
    lessonNumber: undefined as number | undefined,
    content: "",
    plan: "",
    objectives: "",
    duration: "",
    notes: "",
  });

  const utils = trpc.useUtils();
  const { data: lessons, isLoading } = trpc.lessons.list.useQuery(
    filterCompleted === "completed" ? { isCompleted: true } : filterCompleted === "pending" ? { isCompleted: false } : undefined
  );
  const { data: classesList } = trpc.classes.list.useQuery();

  const createMutation = trpc.lessons.create.useMutation({
    onSuccess: () => {
      utils.lessons.list.invalidate();
      toast.success("تمت إضافة الدرس");
      setIsAdding(false);
      setNewLesson({ classId: undefined, title: "", subject: subjects[0], gradeLevel: gradeLevels[0], unitTitle: "", unitNumber: undefined, lessonNumber: undefined, content: "", plan: "", objectives: "", duration: "", notes: "" });
    },
    onError: () => toast.error("خطأ في إضافة الدرس"),
  });

  const toggleMutation = trpc.lessons.toggleCompleted.useMutation({
    onSuccess: () => utils.lessons.list.invalidate(),
  });

  const deleteMutation = trpc.lessons.delete.useMutation({
    onSuccess: () => { utils.lessons.list.invalidate(); toast.success("تم حذف الدرس"); },
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">الدروس</h1>
          <p className="text-muted-foreground mt-1">إدارة وتتبع الدروس المنجزة</p>
        </div>
        <Dialog open={isAdding} onOpenChange={setIsAdding}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 ml-2" />درس جديد</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>درس جديد</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>عنوان الدرس</Label>
                <Input value={newLesson.title} onChange={e => setNewLesson({ ...newLesson, title: e.target.value })} placeholder="عنوان الدرس" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>المادة</Label>
                  <Select value={newLesson.subject} onValueChange={v => setNewLesson({ ...newLesson, subject: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{subjects.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>المستوى</Label>
                  <Select value={newLesson.gradeLevel} onValueChange={v => setNewLesson({ ...newLesson, gradeLevel: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{gradeLevels.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>عنوان الوحدة</Label>
                  <Input value={newLesson.unitTitle} onChange={e => setNewLesson({ ...newLesson, unitTitle: e.target.value })} />
                </div>
                <div><Label>المدة</Label>
                  <Input value={newLesson.duration} onChange={e => setNewLesson({ ...newLesson, duration: e.target.value })} placeholder="1 ساعة" />
                </div>
              </div>
              <div><Label>الأهداف</Label>
                <Textarea value={newLesson.objectives} onChange={e => setNewLesson({ ...newLesson, objectives: e.target.value })} rows={2} placeholder="أهداف التعلم" />
              </div>
              <div><Label>الخطة</Label>
                <Textarea value={newLesson.plan} onChange={e => setNewLesson({ ...newLesson, plan: e.target.value })} rows={4} placeholder="خطة الدرس" />
              </div>
              <div><Label>المحتوى</Label>
                <Textarea value={newLesson.content} onChange={e => setNewLesson({ ...newLesson, content: e.target.value })} rows={4} placeholder="محتوى الدرس" />
              </div>
              <Button onClick={() => createMutation.mutate(newLesson as any)} disabled={createMutation.isPending || !newLesson.title}>
                {createMutation.isPending ? "جاري الإضافة..." : "إنشاء"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        <Button variant={filterCompleted === "all" ? "default" : "outline"} size="sm" onClick={() => setFilterCompleted("all")}>الكل</Button>
        <Button variant={filterCompleted === "pending" ? "default" : "outline"} size="sm" onClick={() => setFilterCompleted("pending")}>معلّقة</Button>
        <Button variant={filterCompleted === "completed" ? "default" : "outline"} size="sm" onClick={() => setFilterCompleted("completed")}>منجزة</Button>
      </div>

      {isLoading ? <div className="text-center py-12 text-muted-foreground">جاري التحميل...</div>
      : lessons && lessons.length > 0 ? (
        <div className="space-y-3">
          {lessons.map(lesson => (
            <Card key={lesson.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setLocation(`/lessons/${lesson.id}`)}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <ClipboardList className="w-4 h-4 text-primary" />
                      <h3 className="font-semibold">{lesson.title}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded ${lesson.isCompleted ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {lesson.isCompleted ? 'منجز' : 'معلّق'}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {lesson.subject && <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{lesson.subject}</span>}
                      {lesson.gradeLevel && <span className="text-xs bg-muted px-2 py-0.5 rounded">{lesson.gradeLevel}</span>}
                      {lesson.unitTitle && <span className="text-xs bg-muted px-2 py-0.5 rounded">{lesson.unitTitle}</span>}
                      {lesson.duration && <span className="text-xs bg-muted px-2 py-0.5 rounded">{lesson.duration}</span>}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); toggleMutation.mutate({ id: lesson.id, isCompleted: !lesson.isCompleted }); }}>
                      {lesson.isCompleted ? <Clock className="w-4 h-4 text-amber-500" /> : <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); deleteMutation.mutate({ id: lesson.id }); }}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card><CardContent className="p-12 text-center">
          <ClipboardList className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">لا توجد دروس</h3>
          <p className="text-muted-foreground">أضف درسك الأول</p>
        </CardContent></Card>
      )}
    </div>
  );
}
