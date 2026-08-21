import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { startLogin } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import {
  LayoutDashboard,
  LogOut,
  PanelLeft,
  BookOpen,
  FileText,
  Sparkles,
  ClipboardList,
  Library,
  Eye,
  Settings,
  GraduationCap,
  BarChart3,
  CalendarDays,
  Users,
  Award,
  ClipboardCheck,
  Moon,
  Sun,
} from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { useTheme } from "@/contexts/ThemeContext";
import { DashboardLayoutSkeleton } from './DashboardLayoutSkeleton';
import { PwaInstallPrompt } from "./PwaInstallPrompt";
import { Button } from "./ui/button";

const menuItems = [
  { icon: LayoutDashboard, label: "اليوم", path: "/dashboard" },
  { icon: CalendarDays, label: "الأسبوع", path: "/weekly-plan" },
  { icon: FileText, label: "المخططات", path: "/annual-plans" },
  { icon: ClipboardCheck, label: "التقويم", path: "/assessment" },
  { icon: Library, label: "المكتبة", path: "/content-library" },
  { icon: Users, label: "النتائج", path: "/student-results" },
  { icon: ClipboardList, label: "دفتر التنقيط", path: "/gradebook" },
  { icon: BookOpen, label: "التجارب", path: "/experiment-log" },
  { icon: Award, label: "الكفاءات", path: "/competencies" },
];

const mobileQuickActions = [
  { icon: LayoutDashboard, label: "اليوم", path: "/dashboard" },
  { icon: CalendarDays, label: "الأسبوع", path: "/weekly-plan" },
  { icon: ClipboardCheck, label: "التقويم", path: "/assessment" },
  { icon: Library, label: "المكتبة", path: "/content-library" },
];

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 260;
const MIN_WIDTH = 200;
const MAX_WIDTH = 360;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const { loading, user } = useAuth();

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  if (loading) {
    return <DashboardLayoutSkeleton />
  }

  if (!user) {
    return (
      <div className="nibras-glow-pattern nibras-login-portal flex items-center justify-center min-h-screen bg-background">
        <div className="nibras-login-card flex flex-col items-center gap-8 p-8 max-w-md w-full">
          <div className="text-center space-y-3">
            <img
              src="/manus-storage/nibras-bilingual-lockup_8f848dcc.png"
              alt="نبراس | NIBRAS"
              className="h-16 w-auto mb-2"
            />
            <p className="text-sm text-muted-foreground">
              مساعد التدريس الذكي لمعلمي الدراسات الاجتماعية
            </p>
          </div>
          <Button
            onClick={() => startLogin()}
            size="lg"
            className="w-full shadow-lg hover:shadow-xl transition-all"
          >
            تسجيل الدخول
          </Button>
          {import.meta.env.DEV && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full mt-2 text-xs text-muted-foreground"
              onClick={() => {
                window.location.href = "/api/dev/login-as-owner";
              }}
            >
              دخول تجريبي (تطوير فقط)
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider
      className="min-w-0 max-w-full overflow-x-hidden"
      style={
        {
          "--sidebar-width": `${sidebarWidth}px`,
        } as CSSProperties
      }
    >
      <DashboardLayoutContent setSidebarWidth={setSidebarWidth}>
        {children}
      </DashboardLayoutContent>
    </SidebarProvider>
  );
}

type DashboardLayoutContentProps = {
  children: React.ReactNode;
  setSidebarWidth: (width: number) => void;
};

function DashboardLayoutContent({
  children,
  setSidebarWidth,
}: DashboardLayoutContentProps) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme, switchable } = useTheme();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const activeMenuItem = menuItems.find(item => item.path === location);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (isCollapsed) {
      setIsResizing(false);
    }
  }, [isCollapsed]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const sidebarRight = sidebarRef.current?.getBoundingClientRect().right ?? 0;
      const newWidth = sidebarRight - e.clientX;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);

  return (
    <>
      <div className="contents md:relative" ref={isMobile ? undefined : sidebarRef}>
        <Sidebar
          collapsible="icon"
          side="right"
          className="border-l-0 border-r"
          disableTransition={isResizing}
        >
          <SidebarHeader className="h-16 justify-center">
            <div className="flex items-center gap-3 px-2 transition-all w-full">
              <button
                onClick={toggleSidebar}
                className="h-8 w-8 flex items-center justify-center hover:bg-accent rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0"
                aria-label="تبديل التنقل"
              >
                <PanelLeft className="h-4 w-4 text-muted-foreground" />
              </button>
              {!isCollapsed ? (
                <div className="flex items-center gap-2 min-w-0">
                  <img
                    src="/manus-storage/nibras-bilingual-lockup_8f848dcc.png"
                    alt="نبراس | NIBRAS"
                    className="h-8 w-auto shrink-0"
                  />
                </div>
              ) : null}
            </div>
          </SidebarHeader>

          <SidebarContent className="gap-0 overflow-y-auto">
            <SidebarMenu className="px-2 py-1">
              {menuItems.map(item => {
                const isActive = location === item.path;
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      isActive={isActive}
                      onClick={() => setLocation(item.path)}
                      tooltip={item.label}
                      className="office-sidebar-item h-10 transition-all"
                      data-active={isActive}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      <span className="text-sm">{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter className="p-3 space-y-2">
            {switchable ? (
              <button
                onClick={toggleTheme}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-accent/50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="تبديل الوضع الليلي"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary shrink-0">
                  {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </span>
                <span className="min-w-0 group-data-[collapsible=icon]:hidden">
                  {theme === "dark" ? "الوضع النهاري" : "الوضع الليلي"}
                </span>
              </button>
            ) : null}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 rounded-lg px-1 py-1 hover:bg-accent/50 transition-colors w-full text-right group-data-[collapsible=icon]:justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                    <p className="text-sm font-medium truncate leading-none">
                      {user?.name || "معلم"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate mt-1.5">
                      {user?.email || "-"}
                    </p>
                  </div>
                  <Avatar className="h-9 w-9 border shrink-0">
                    <AvatarFallback className="text-xs font-medium">
                      {(user?.name || "م")[0]}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {switchable && (
                  <DropdownMenuItem onClick={toggleTheme} className="cursor-pointer">
                    {theme === "dark" ? <Sun className="ml-2 h-4 w-4" /> : <Moon className="ml-2 h-4 w-4" />}
                    <span>{theme === "dark" ? "الوضع النهاري" : "الوضع الليلي"}</span>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => setLocation("/profile")} className="cursor-pointer">
                  <Settings className="ml-2 h-4 w-4" />
                  <span>الملف الشخصي</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={logout}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="ml-2 h-4 w-4" />
                  <span>تسجيل الخروج</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>
        {!isMobile && <div
          className={`absolute top-0 left-0 w-1 h-full cursor-col-resize hover:bg-primary/20 transition-colors ${isCollapsed ? "hidden" : ""}`}
          onMouseDown={() => {
            if (isCollapsed) return;
            setIsResizing(true);
          }}
          style={{ zIndex: 50 }}
        />}
      </div>

      <SidebarInset className="min-w-0 max-w-full overflow-x-hidden">
          <div className="flex border-b h-14 items-center justify-between bg-background/95 px-3 backdrop-blur supports-[backdrop-filter]:backdrop-blur sticky top-0 z-40 md:hidden">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="h-9 w-9 rounded-lg bg-background" />
              <div className="flex items-center gap-3">
                <div className="flex flex-col gap-1">
                  <span className="tracking-tight text-foreground text-sm font-semibold">
                    {activeMenuItem?.label ?? "نبراس"}
                  </span>
                </div>
              </div>
            </div>
            {switchable ? (
              <button
                onClick={toggleTheme}
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-background text-muted-foreground hover:bg-muted transition-colors"
                aria-label="تبديل الوضع الليلي"
              >
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
            ) : null}
          </div>
	        <main className="office-surface flex-1 p-4 pb-24 md:p-6">
	          <PwaInstallPrompt />
	          {children}
	        </main>
          <nav
            className="nibras-mobile-nav fixed bottom-0 inset-x-0 z-50 grid grid-cols-4 border-t px-2 pb-[max(0.4rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur md:hidden"
            aria-label="إجراءات الحصة السريعة"
          >
            {mobileQuickActions.map((action) => {
              const isActive = location === action.path;
              return (
                <button
                  key={action.path}
                  onClick={() => setLocation(action.path)}
                  className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl text-xs transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${isActive ? "bg-primary/10 text-primary font-semibold" : "text-muted-foreground hover:bg-muted"}`}
                  aria-current={isActive ? "page" : undefined}
                >
                  <action.icon className="h-5 w-5" />
                  <span>{action.label}</span>
                </button>
              );
            })}
          </nav>
      </SidebarInset>
    </>
  );
}
