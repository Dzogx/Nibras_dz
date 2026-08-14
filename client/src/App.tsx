import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import Curriculum from "./pages/Curriculum";
import Classes from "./pages/Classes";
import AnnualPlans from "./pages/AnnualPlans";
import Lessons from "./pages/Lessons";
import LessonGenerator from "./pages/LessonGenerator";
import Assessment from "./pages/Assessment";
import ContentLibrary from "./pages/ContentLibrary";
import Inspector from "./pages/Inspector";
import Results from "./pages/Results";
import Profile from "./pages/Profile";
import LessonDetail from "./pages/LessonDetail";
import AnnualPlanDetail from "./pages/AnnualPlanDetail";
import ResourceDetail from "./pages/ResourceDetail";
import Verify from "./pages/Verify";
import AnswerPage from "./pages/AnswerPage";

function Router() {
  return (
    <Switch>
      <Route path="/dashboard">
        {() => <DashboardLayout><Dashboard /></DashboardLayout>}
      </Route>
      <Route path="/curriculum">
        {() => <DashboardLayout><Curriculum /></DashboardLayout>}
      </Route>
      <Route path="/classes">
        {() => <DashboardLayout><Classes /></DashboardLayout>}
      </Route>
      <Route path="/annual-plans">
        {() => <DashboardLayout><AnnualPlans /></DashboardLayout>}
      </Route>
      <Route path="/annual-plans/:id">
        {(params) => <DashboardLayout><AnnualPlanDetail id={params.id} /></DashboardLayout>}
      </Route>
      <Route path="/lessons">
        {() => <DashboardLayout><Lessons /></DashboardLayout>}
      </Route>
      <Route path="/lessons/:id">
        {(params) => <DashboardLayout><LessonDetail id={params.id} /></DashboardLayout>}
      </Route>
      <Route path="/lesson-generator">
        {() => <DashboardLayout><LessonGenerator /></DashboardLayout>}
      </Route>
      <Route path="/assessment">
        {() => <DashboardLayout><Assessment /></DashboardLayout>}
      </Route>
      <Route path="/content-library">
        {() => <DashboardLayout><ContentLibrary /></DashboardLayout>}
      </Route>
      <Route path="/content-library/:id">
        {(params) => <DashboardLayout><ResourceDetail id={params.id} /></DashboardLayout>}
      </Route>
      <Route path="/inspector">
        {() => <DashboardLayout><Inspector /></DashboardLayout>}
      </Route>
      <Route path="/results">
        {() => <DashboardLayout><Results /></DashboardLayout>}
      </Route>
      <Route path="/profile">
        {() => <DashboardLayout><Profile /></DashboardLayout>}
      </Route>
      {/* صفحات عامة (بدون مصادقة) للتحقق من الوثائق عبر QR */}
      <Route path="/verify" component={Verify} />
      <Route path="/verify/answer/:serial" component={AnswerPage} />
      <Route path={"/"}>
        {() => { window.location.href = "/dashboard"; return null; }}
      </Route>
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster position="top-center" />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
