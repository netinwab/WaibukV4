import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
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
import YearbookFinder from "@/pages/yearbook-finder";
import RequestAlumniStatus from "@/pages/request-alumni-status";
import YearbookViewer from "@/pages/yearbook-viewer";
import YearbookManage from "@/pages/yearbook-manage";
import PhotosMemoriesManage from "@/pages/photos-memories-manage";
import SuperAdmin from "@/pages/super-admin";

import NotFound from "@/pages/not-found";


function Router() {
  return (
    <Switch>
      <Route path="/" component={LoginPage} />
      <Route path="/signup" component={Signup} />
      <Route path="/school-signup" component={SchoolSignup} />
      <Route path="/viewer-signup" component={ViewerSignup} />
      <Route path="/viewer-dashboard" component={ViewerDashboard} />
     
      <Route path="/waibuk/:year" component={DynamicYearbookViewer} />
      

      


      




      



      


      




      
      <Route path="/yearbook-finder" component={YearbookFinder} />
      <Route path="/school-dashboard" component={SchoolDashboard} />
      <Route path="/request-alumni-status" component={RequestAlumniStatus} />
      <Route path="/yearbook-viewer/:year" component={YearbookViewer} />
      <Route path="/yearbook-manage/:year" component={YearbookManage} />
      <Route path="/photos-memories-manage" component={PhotosMemoriesManage} />
      <Route path="/super-admin" component={SuperAdmin} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
