import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import LoginPage from "@/pages/login";
import Signup from "@/pages/signup";
import SchoolSignup from "@/pages/school-signup";
import ViewerSignup from "@/pages/viewer-signup";


//yearbooks end
import DynamicYearbookViewer from "@/pages/dynamic-yearbook-viewer";





//yearbooks pdf
// import testpdf from "@/pages/0620_w23_qp_42.pdf";

//yearbooks pdf end
import ViewerDashboard from "@/pages/viewer-dashboard";
import SchoolDashboard from "@/pages/school-dashboard";
import StudentDashboard from "@/pages/student-dashboard";
import YearbookFinder from "@/pages/yearbook-finder";
import Cart from "@/pages/cart";
import RequestAlumniStatus from "@/pages/request-alumni-status";
import YearbookViewer from "@/pages/yearbook-viewer";
import YearbookManage from "@/pages/yearbook-manage";
import PhotosMemoriesManage from "@/pages/photos-memories-manage";
import SuperAdmin from "@/pages/super-admin";
import ViewerSettings from "@/pages/viewer-settings";
import SchoolSettings from "@/pages/school-settings";
import RevenueShareSetup from "@/pages/revenue-sharing-setup";

import NotFound from "@/pages/not-found";


function Router() {
  return (
    <Switch>
      <Route path="/" component={LoginPage} />
      <Route path="/signup" component={Signup} />
      <Route path="/school-signup" component={SchoolSignup} />
      <Route path="/viewer-signup" component={ViewerSignup} />
      <Route path="/viewer-dashboard" component={ViewerDashboard} />
      <Route path="/student-dashboard" component={StudentDashboard} />
     
      <Route path="/waibuk/:year" component={DynamicYearbookViewer} />
      

      


      




      



      


      




      
      <Route path="/yearbook-finder" component={YearbookFinder} />
      <Route path="/cart" component={Cart} />
      <Route path="/school-dashboard" component={SchoolDashboard} />
      <Route path="/request-alumni-status" component={RequestAlumniStatus} />
      <Route path="/yearbook-viewer/:year" component={YearbookViewer} />
      <Route path="/yearbook-manage/:year" component={YearbookManage} />
      <Route path="/photos-memories-manage" component={PhotosMemoriesManage} />
      <Route path="/super-admin" component={SuperAdmin} />
      <Route path="/viewer-settings" component={ViewerSettings} />
      <Route path="/school-settings" component={SchoolSettings} />
      <Route path="/revenue-sharing-setup" component={RevenueShareSetup} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <CurrencyProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </CurrencyProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
