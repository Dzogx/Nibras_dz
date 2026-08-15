import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Library, Copy, Trash2, Eye, Pencil, FileText, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useLocation } from "wouter";

const typeLabels: Record<string, string> = {
  lessonPlan: "خطة درس",
  activity: "نشاط تعلم",
  homework: "واجب منزلي",
  classQuestions: "أسئلة صفية",
  differentiation: "استراتيجيات تمييز",
  quiz: "اختبار قصير",
  exam: "امتحان",
  rubric: "معايير تقييم",
  answerKey: "مفتاح إجابات",
  inspectorReview: "مراجعة مفتش",
};

const typeColors: Record<string, string> = {
  lessonPlan: "bg-brand-navy-100 text-brand-navy-700",
  activity: "bg-emerald-100 text-emerald-700",
  homework: "bg-purple-100 text-purple-700",
  classQuestions: "bg-amber-100 text-amber-700",
  differentiation: "bg-pink-100 text-pink-700",
  quiz: "bg-cyan-100 text-cyan-700",
  exam: "bg-red-100 text-red-700",
  rubric: "bg-brand-gold-100 text-brand-gold-800",
  answerKey: "bg-green-100 text-green-700",
  inspectorReview: "bg-gray-100 text-gray-700",
};

export default function ContentLibrary() {
  const [, setLocation] = useLocation();
  const [filterType, setFilterType] = useState("");
  const [search, setSearch] = useState("");

  const utils = trpc.useUtils();
  const { data: resources, isLoading } = trpc.aiResources.list.useQuery(
    filterType !== "all" ? { type: filterType } : undefined
  );

  const deleteMutation = trpc.aiResources.delete.useMutation({
    onSuccess: () => { utils.aiResources.list.invalidate(); toast.success("تم الحذف"); },
  });

  const duplicateMutation = trpc.aiResources.duplicate.useMutation({
    onSuccess: () => { utils.aiResources.list.invalidate(); toast.success("تم النسخ"); },
  });

  const filtered = resources?.filter(r =>
    !search || r.title.toLowerCase().includes(search.toLowerCase())
  ) || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">مكتبة المحتوى</h1>
        <p className="text-muted-foreground mt-1">جميع الموارد المُولّدة والمخزّنة</p>
      </div>

      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث في المحتوى..." className="pr-10" />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="جميع الأنواع" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع الأنواع</SelectItem>
            {Object.entries(typeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? <div className="text-center py-12 text-muted-foreground">جاري التحميل...</div>
      : filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map(resource => (
            <Card key={resource.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setLocation(`/content-library/${resource.id}`)}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary" />
                      <h3 className="font-semibold">{resource.title}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded ${typeColors[resource.type] || 'bg-muted'}`}>
                        {typeLabels[resource.type] || resource.type}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {Array.isArray(resource.tags) && resource.tags.map((tag: string, i: number) => (
                        <span key={i} className="text-xs bg-muted px-2 py-0.5 rounded">{tag}</span>
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{resource.content}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(resource.createdAt).toLocaleDateString("ar-DZ")}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); duplicateMutation.mutate({ id: resource.id }); }}>
                      <Copy className="w-4 h-4 text-muted-foreground" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); deleteMutation.mutate({ id: resource.id }); }}>
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
          <Library className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">المكتبة فارغة</h3>
          <p className="text-muted-foreground">الموارد المُولّدة ستظهر هنا</p>
        </CardContent></Card>
      )}
    </div>
  );
}
