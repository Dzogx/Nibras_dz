import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, BookOpen, FileText, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const subjects = ["التاريخ والجغرافيا", "التربية المدنية", "التاريخ والجغرافيا والتربية المدنية"];
const gradeLevels = ["السنة الأولى متوسط", "السنة الثانية متوسط", "السنة الثالثة متوسط", "السنة الرابعة متوسط"];
const docTypes = [
  { value: "", label: "جميع الأنواع" },
  { value: "document", label: "وثيقة" },
  { value: "annualPlan", label: "خطة سنوية" },
  { value: "competency", label: "كفاءة" },
  { value: "unit", label: "وحدة" },
  { value: "lesson", label: "درس" },
];

export default function Curriculum() {
  const [search, setSearch] = useState("");
  const [subject, setSubject] = useState("");
  const [gradeLevel, setGradeLevel] = useState("");
  const [type, setType] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const [newDoc, setNewDoc] = useState({
    title: "",
    type: "document",
    subject: "التاريخ والجغرافيا",
    gradeLevel: "السنة الأولى متوسط",
    content: "",
    sourceReference: "",
  });

  const utils = trpc.useUtils();
  const { data: documents, isLoading } = trpc.curriculum.list.useQuery({
    search: search || undefined,
    subject: subject || undefined,
    gradeLevel: gradeLevel || undefined,
    type: type || undefined,
  });

  const createMutation = trpc.curriculum.create.useMutation({
    onSuccess: () => {
      utils.curriculum.list.invalidate();
      toast.success("تمت إضافة الوثيقة بنجاح");
      setIsAdding(false);
      setNewDoc({ title: "", type: "document", subject: "التاريخ والجغرافيا", gradeLevel: "السنة الأولى متوسط", content: "", sourceReference: "" });
    },
    onError: () => toast.error("خطأ في إضافة الوثيقة"),
  });

  const deleteMutation = trpc.curriculum.delete.useMutation({
    onSuccess: () => {
      utils.curriculum.list.invalidate();
      toast.success("تم حذف الوثيقة");
    },
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">قاعدة المنهج</h1>
          <p className="text-muted-foreground mt-1">وثائق المنهج الرسمي والخطط والكفايات</p>
        </div>
        <Dialog open={isAdding} onOpenChange={setIsAdding}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 ml-2" />
              إضافة وثيقة
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>إضافة وثيقة منهج جديدة</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>العنوان</Label>
                <Input value={newDoc.title} onChange={e => setNewDoc({ ...newDoc, title: e.target.value })} placeholder="عنوان الوثيقة" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>النوع</Label>
                  <Select value={newDoc.type} onValueChange={v => setNewDoc({ ...newDoc, type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {docTypes.slice(1).map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>المادة</Label>
                  <Select value={newDoc.subject} onValueChange={v => setNewDoc({ ...newDoc, subject: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {subjects.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>المستوى</Label>
                <Select value={newDoc.gradeLevel} onValueChange={v => setNewDoc({ ...newDoc, gradeLevel: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {gradeLevels.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>المحتوى</Label>
                <Textarea value={newDoc.content} onChange={e => setNewDoc({ ...newDoc, content: e.target.value })} placeholder="محتوى الوثيقة..." rows={6} />
              </div>
              <div>
                <Label>المرجع</Label>
                <Input value={newDoc.sourceReference} onChange={e => setNewDoc({ ...newDoc, sourceReference: e.target.value })} placeholder="المرجع الرسمي" />
              </div>
              <Button onClick={() => createMutation.mutate(newDoc as any)} disabled={createMutation.isPending || !newDoc.title || !newDoc.content}>
                {createMutation.isPending ? "جاري الإضافة..." : "إضافة"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search & Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="بحث في وثائق المنهج..."
                className="pr-10"
              />
            </div>
            <Select value={subject} onValueChange={setSubject}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="المادة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">جميع المواد</SelectItem>
                {subjects.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={gradeLevel} onValueChange={setGradeLevel}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="المستوى" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">جميع المستويات</SelectItem>
                {gradeLevels.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="النوع" />
              </SelectTrigger>
              <SelectContent>
                {docTypes.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Documents List */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">جاري التحميل...</div>
      ) : documents && documents.length > 0 ? (
        <div className="space-y-3">
          {documents.map((doc) => (
            <Card key={doc.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-primary" />
                      <h3 className="font-semibold">{doc.title}</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{doc.type}</span>
                      <span className="text-xs bg-muted px-2 py-0.5 rounded">{doc.subject}</span>
                      <span className="text-xs bg-muted px-2 py-0.5 rounded">{doc.gradeLevel}</span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-3 mt-2">
                      {doc.content}
                    </p>
                    {doc.sourceReference && (
                      <p className="text-xs text-muted-foreground">المرجع: {doc.sourceReference}</p>
                    )}
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate({ id: doc.id })}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">لا توجد وثائق</h3>
            <p className="text-muted-foreground">أضف وثائق المنهج الرسمي للبدء</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
