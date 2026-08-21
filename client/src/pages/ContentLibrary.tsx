import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Library, Copy, Trash2, Eye, FileText, Search, MoreHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { truncateMarkdown } from "@/components/MarkdownRenderer";
import { OfficeHeader } from "@/components/OfficeChrome";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  lessonPlan: "bg-brand-ink-100 text-brand-ink-700",
  activity: "bg-emerald-100 text-emerald-700",
  homework: "bg-purple-100 text-purple-700",
  classQuestions: "bg-amber-100 text-amber-700",
  differentiation: "bg-pink-100 text-pink-700",
  quiz: "bg-cyan-100 text-cyan-700",
  exam: "bg-red-100 text-red-700",
  rubric: "bg-brand-wax-100 text-brand-wax-800",
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
      <OfficeHeader
        title="مكتبة المحتوى"
        subtitle="أرشيفك التربوي — جميع الموارد المُولّدة والمخزّنة"
      />

      <div className="nibras-library-tools flex flex-col md:flex-row gap-3">
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
          <p className="nibras-library-result-count">{filtered.length} موردًا في متناولك</p>
          {filtered.map(resource => (
            <Card
              key={resource.id}
              className="nibras-resource-card cursor-pointer"
              onClick={() => setLocation(`/content-library/${resource.id}`)}
            >
              <CardContent className="p-0">
                <div className="flex items-start justify-between gap-3 p-4 md:p-5">
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="nibras-resource-kind">
                        <FileText className="size-3.5" />
                        {typeLabels[resource.type] || resource.type}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(resource.createdAt).toLocaleDateString("ar-DZ")}
                      </span>
                    </div>
                    <h3 className="nibras-resource-title">{resource.title}</h3>
                    <p className="mt-2 line-clamp-2 text-sm leading-7 text-muted-foreground">
                      {truncateMarkdown(resource.content ?? "", 220)}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {Array.isArray(resource.tags) && resource.tags.slice(0, 3).map((tag: string, i: number) => (
                        <span key={i} className="nibras-resource-tag">{tag}</span>
                      ))}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="nibras-resource-open"
                      onClick={(e) => { e.stopPropagation(); setLocation(`/content-library/${resource.id}`); }}
                    >
                      <Eye className="size-3.5" />
                      <span className="hidden sm:inline">فتح</span>
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label="إجراءات المورد" onClick={(e) => e.stopPropagation()}>
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        <DropdownMenuItem onSelect={() => duplicateMutation.mutate({ id: resource.id })}>
                          <Copy /> إنشاء نسخة
                        </DropdownMenuItem>
                        <DropdownMenuItem variant="destructive" onSelect={() => deleteMutation.mutate({ id: resource.id })}>
                          <Trash2 /> حذف المورد
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
