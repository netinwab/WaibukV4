import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "../lib/queryClient";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Textarea } from "../components/ui/textarea";
import { Switch } from "../components/ui/switch";
import { 
  GraduationCap, 
  LogOut, 
  UserPlus, 
  Users, 
  Calendar, 
  ShoppingCart, 
  Upload, 
  Images, 
  Edit, 
  Trash2,
  Eye,
  UserCheck,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Loader2,
  Settings,
  Grid3X3,
  List
} from "lucide-react";
import type { User, School, Memory, AlumniRequest, AlumniBadge } from "@shared/schema";
import { useToast } from "../hooks/use-toast";
import { CheckoutOverlay } from "../components/CheckoutOverlay";
import { CURRENT_YEAR, SCHOOL_YEAR_PRICE } from "@shared/constants";

export default function SchoolDashboard() {
  const [, setLocation] = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState("students");
  const [yearViewMode, setYearViewMode] = useState<'grid' | 'list'>('grid');
  
  // Check for tab parameter in URL on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get('tab');
    if (tab && ['students', 'years', 'memories', 'viewers', 'profile'].includes(tab)) {
      setActiveTab(tab);
    }
  }, []);
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [showAddViewer, setShowAddViewer] = useState(false);
  const [yearSearchTerm, setYearSearchTerm] = useState(""); // Added search state
  const [alumniSearchTerm, setAlumniSearchTerm] = useState(""); // Alumni search state
  const [selectedRequest, setSelectedRequest] = useState<AlumniRequest | null>(null);
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showSchoolCodePassword, setShowSchoolCodePassword] = useState(false);
  const [schoolCodePassword, setSchoolCodePassword] = useState("");
  const [editableSchoolData, setEditableSchoolData] = useState({ email: "", city: "" });
  const [isEditingSchool, setIsEditingSchool] = useState(false);
  const [schoolCodeVisible, setSchoolCodeVisible] = useState(false);
  const [selectedYearForPurchase, setSelectedYearForPurchase] = useState<string>("");
  const [schoolProfileForm, setSchoolProfileForm] = useState({
    address: "",
    state: ""
  });
  const [isDarkMode, setIsDarkMode] = useState(false);
  const { toast } = useToast();

  // Dark mode toggle function
  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    if (!isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('darkMode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('darkMode', 'false');
    }
  };

  // Load dark mode preference on component mount
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode === 'true') {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  // Form states
  const [newStudent, setNewStudent] = useState({ username: "", password: "", fullName: "", grade: "", class: "" });
  const [newViewer, setNewViewer] = useState({ username: "", password: "", fullName: "" });
  const [selectedYear, setSelectedYear] = useState("2024");

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      setLocation("/");
      return;
    }
    const parsedUser = JSON.parse(userData);
    
    // Verify this is a school admin account, not a viewer or student account  
    if (parsedUser.userType !== "school") {
      console.log("Non-school account detected in school dashboard, redirecting to correct dashboard");
      localStorage.removeItem("user"); // Clear the session
      setLocation("/");
      return;
    }
    setUser(parsedUser);
  }, [setLocation]);

  const currentYear = CURRENT_YEAR;

  // Fetch school info to get founding year (moved before alumni queries)
  const { data: school } = useQuery<School>({
    queryKey: ["/api/schools", user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (!user?.id) throw new Error("No user");
      const res = await fetch(`/api/schools/${user.id}`);
      if (!res.ok) throw new Error("Failed to fetch school");
      return res.json();
    },
  });

  // Fetch alumni requests for this school (moved after school query)
  const { data: allRequests = [] } = useQuery<AlumniRequest[]>({
    queryKey: ["/api/alumni-requests", school?.id],
    enabled: !!school?.id,
    queryFn: async () => {
      if (!school?.id) return [];
      const res = await fetch(`/api/alumni-requests/school/${school.id}`);
      if (!res.ok) throw new Error("Failed to fetch alumni requests");
      return res.json();
    },
  });

  // Filter only pending requests
  const pendingRequests = allRequests.filter(request => request.status === 'pending');

  // Fetch pending alumni request count for notification badge
  const { data: requestCountData } = useQuery<{ pendingCount: number }>({
    queryKey: ["/api/alumni-requests/count", school?.id],
    enabled: !!school?.id,
    queryFn: async () => {
      if (!school?.id) return { pendingCount: 0 };
      const res = await fetch(`/api/alumni-requests/school/${school.id}/count`);
      if (!res.ok) throw new Error("Failed to fetch request count");
      return res.json();
    },
  });

  const pendingRequestCount = requestCountData?.pendingCount || 0;

  // Alumni request mutations (moved after school query)
  const approveAlumniRequestMutation = useMutation({
    mutationFn: async ({ requestId, reviewNotes }: { requestId: string; reviewNotes?: string }) => {
      await apiRequest("PATCH", `/api/alumni-requests/${requestId}/approve`, {
        reviewedBy: user?.id,
        reviewNotes
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/alumni-requests", school?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/alumni-requests/count", school?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/alumni-badges/school", school?.id] });
      toast({ title: "Alumni request approved successfully" });
    },
  });

  const denyAlumniRequestMutation = useMutation({
    mutationFn: async ({ requestId, reviewNotes }: { requestId: string; reviewNotes?: string }) => {
      await apiRequest("PATCH", `/api/alumni-requests/${requestId}/deny`, {
        reviewedBy: user?.id,
        reviewNotes
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/alumni-requests", school?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/alumni-requests/count", school?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/alumni-badges/school", school?.id] });
      toast({ title: "Alumni request denied successfully" });
    },
  });

  // Mock data for demonstration
  const mockStudents = [
    { id: "1", fullName: "Nwabuisi Netochukwu", username: "neto_nwab", grade: "Grade 12", class: "12-A", enrollmentYear: 2018 },
    { id: "2", fullName: "Sarah Johnson", username: "sarah_j", grade: "Grade 12", class: "12-A", enrollmentYear: 2020 },
    { id: "3", fullName: "Mike Chen", username: "mike_c", grade: "Grade 11", class: "11-B", enrollmentYear: 2021 },
    { id: "4", fullName: "Emma Davis", username: "emma_d", grade: "Grade 10", class: "10-A", enrollmentYear: 2022 },
    { id: "5", fullName: "Baron Davis", username: "baron_d", grade: "Grade 10", class: "10-A", enrollmentYear: 2022 }
  ]; 
const mockMemories = [
  { id: "1", title: "Graduation Day", eventDate: "June 2024", year: "2024", category: "graduation" },
    { id: "2", title: "Science Fair", eventDate: "March 2024", year: "2024", category: "academic" },
    { id: "3", title: "Sports Day", eventDate: "February 2024", year: "2024", category: "sports" },
    { id: "4", title: "Art Exhibition", eventDate: "November 2023", year: "2023", category: "arts" }
  ];
//years here remember to add more down to 2000 and also add a search bar to search for a specific year

  // Fetch purchased years for this school
  const { data: purchasedYears = [] } = useQuery({
    queryKey: ["/api/year-purchases", school?.id],
    enabled: !!school,
    queryFn: async () => {
      if (!user?.id) return [];
      const res = await fetch(`/api/year-purchases/school/${school?.id}`);
      if (!res.ok) return [];
      return res.json();
    },
  });

  // Generate years from school's founding year to current year (2026)
  // Only generate years if we have school data
  const mockYears = !school ? [] : (() => {
    const schoolFoundingYear = school.yearFounded;
    // Use the actual founding year, with minimum of 1980 if school was founded before 1980
    const startYear = schoolFoundingYear < 1980 ? 1980 : schoolFoundingYear;
    // Show years up to current year
    const endYear = currentYear;
    
    return Array.from({ length: endYear - startYear + 1 }, (_, i) => {
      const year = endYear - i; // Generate in descending order
      
      // Skip years before the school was founded or after current year
      if (year < startYear || year > endYear) return null;
    
    // Check if this year has been purchased
    const yearPurchase = purchasedYears.find((p: any) => p.year === year);
    const purchased = !!yearPurchase?.purchased;
    
    // All years require payment - no free years
    const isFree = false;
    
    let status;
    if (purchased) {
      status = year === currentYear ? "Active" : "Archived"; // Current year is active
    } else {
      status = "Available";
    }
    
      return { 
        year: year.toString(), 
        purchased, 
        status, 
        price: SCHOOL_YEAR_PRICE, // All years cost the school year price
        isFree 
      };
    }).filter(Boolean); // Remove null entries
  })();

  // Filter years based on search term
  const filteredYears = mockYears.filter((year: any) => 
    year && year.year.includes(yearSearchTerm)
  );

  console.log(mockYears);

  //gpt coded part end

  // Fetch alumni badges for this school (only verified alumni)
  const { data: allAlumniBadges = [] } = useQuery<AlumniBadge[]>({
    queryKey: ["/api/alumni-badges/school", school?.id],
    enabled: !!school?.id,
    queryFn: async () => {
      if (!school?.id) return [];
      const res = await fetch(`/api/alumni-badges/school/${school.id}`);
      if (!res.ok) throw new Error("Failed to fetch alumni badges");
      return res.json();
    },
  });

  // Filter to only show verified alumni in the current alumni list
  const alumniBadges = allAlumniBadges.filter(badge => badge.status === 'verified');

  // Update school profile mutation
  const updateSchoolProfileMutation = useMutation({
    mutationFn: async (updates: { address?: string; state?: string }) => {
      await apiRequest("PATCH", `/api/schools/${user?.id}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/schools", user?.id] });
      toast({ title: "Profile updated successfully" });
      setSchoolProfileForm({ address: "", state: "" });
    },
    onError: () => {
      toast({ title: "Failed to update profile", variant: "destructive" });
    },
  });

  // Delete alumni badge mutation
  const deleteAlumniBadgeMutation = useMutation({
    mutationFn: async (badgeId: string) => {
      await apiRequest("DELETE", `/api/alumni-badges/${badgeId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/alumni-badges/school", school?.id] });
      toast({ title: "Alumni badge deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete alumni badge", variant: "destructive" });
    },
  });

  const handleLogout = () => {
    localStorage.removeItem("user");
    setLocation("/");
  };

  const handleAddStudent = () => {
    // In real implementation, this would make API call
    console.log("Adding student:", newStudent);
    setNewStudent({ username: "", password: "", fullName: "", grade: "", class: "" });
    setShowAddStudent(false);
  };


  const handleAddViewer = () => {
    // In real implementation, this would make API call
    console.log("Adding viewer:", newViewer);
    setNewViewer({ username: "", password: "", fullName: "" });
    setShowAddViewer(false);
  };

  const handleApproveRequest = (requestId: string) => {
    approveAlumniRequestMutation.mutate({ requestId });
  };

  const handleDenyRequest = (requestId: string) => {
    denyAlumniRequestMutation.mutate({ requestId });
  };

  const handleViewRequest = (request: AlumniRequest) => {
    setSelectedRequest(request);
    setShowRequestDialog(true);
  };

  const handleVerifyPassword = async () => {
    try {
      // Verify password with server
      const response = await apiRequest("POST", "/api/auth/verify-password", {
        username: user?.username,
        password: schoolCodePassword
      });
      
      const data = await response.json();
      if (data.verified) {
        setSchoolCodeVisible(true);
        setShowSchoolCodePassword(false);
        setSchoolCodePassword("");
        console.log("School code should be visible:", school?.schoolCode);
        toast({
          title: "Password Verified", 
          description: `School code: ${school?.schoolCode || 'No code available'}`,
        });
      } else {
        toast({
          title: "Incorrect Password",
          description: "Please enter the correct password.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Verification Failed",
        description: "Could not verify password. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleBuyYear = (year: string) => {
    setSelectedYearForPurchase(year);
    setShowCheckout(true);
  };

  const handleEditSchoolInfo = () => {
    setEditableSchoolData({
      email: school?.email || "",
      city: school?.city || ""
    });
    setIsEditingSchool(true);
  };

  const handleSaveSchoolInfo = async () => {
    try {
      // Use the school ID from the school data, not the user ID
      const schoolId = school?.id;
      if (!schoolId) {
        toast({
          title: "Error",
          description: "School information not found.",
          variant: "destructive",
        });
        return;
      }
      
      await apiRequest("PATCH", `/api/schools/${schoolId}`, editableSchoolData);
      queryClient.invalidateQueries({ queryKey: ["/api/schools", user?.id] });
      setIsEditingSchool(false);
      toast({
        title: "School information updated",
        description: "Changes have been saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Update failed",
        description: "Could not save changes. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleManageYear = (year: string) => {
    // Navigate to yearbook management page for purchased year
    setLocation(`/yearbook-manage/${year}?school=${school?.id}`);
  };

  const handleConfirmPurchase = async (year: string) => {
    const yearData = mockYears.find(y => y && y.year === year);
    const isFree = yearData?.isFree || false;
    
    try {
      // First, create or find existing year purchase record
      const yearNum = parseInt(year);
      let existingPurchase = purchasedYears.find((p: any) => p.year === yearNum);
      
      if (!existingPurchase) {
        // Create new year purchase record
        const purchaseData = {
          schoolId: school?.id || "",
          year: yearNum,
          purchased: true,
          price: isFree ? "0.00" : "4.99",
          purchaseDate: new Date().toISOString()
        };
        
        await apiRequest("POST", "/api/year-purchases", purchaseData);
      } else {
        // Update existing record to purchased
        await apiRequest("PATCH", `/api/year-purchases/${existingPurchase.id}`, {
          purchased: true
        });
      }
      
      // Invalidate cache to refresh the UI
      queryClient.invalidateQueries({ queryKey: ["/api/year-purchases", school?.id] });
      // Also invalidate yearbook queries to ensure fresh data when managing the year
      queryClient.invalidateQueries({ queryKey: ["/api/yearbooks", school?.id, year] });
      queryClient.invalidateQueries({ queryKey: ["/api/yearbooks"] });
      
      toast({ 
        title: isFree ? "Access activated!" : "Purchase successful!", 
        description: `You now have access to ${year} yearbook content.`
      });
      
      setShowCheckout(false);
    } catch (error) {
      toast({ 
        title: "Purchase failed", 
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
      throw error;
    }
  };


  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* Main Animated Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-20 left-20 w-32 h-32 bg-white rounded-full opacity-20 animate-float"></div>
          <div className="absolute top-60 right-40 w-24 h-24 bg-white rounded-full opacity-20 animate-float-delayed"></div>
          <div className="absolute bottom-40 left-40 w-20 h-20 bg-white rounded-full opacity-20 animate-float"></div>
          <div className="absolute bottom-20 right-20 w-16 h-16 bg-white rounded-full opacity-20 animate-float-delayed"></div>
        </div>
      </div>
      
      {/* Main Content Container */}
      <div className="relative z-10 min-h-screen bg-white/95 backdrop-blur-sm">
      {/* Header */}
      <header className="bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 shadow-sm border-b border-gray-200 relative overflow-hidden">
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full">
            <div className="absolute top-2 left-10 w-8 h-8 bg-white rounded-full opacity-5 animate-float"></div>
            <div className="absolute top-3 right-20 w-6 h-6 bg-white rounded-full opacity-5 animate-float-delayed"></div>
            <div className="absolute bottom-2 left-20 w-5 h-5 bg-white rounded-full opacity-5 animate-float"></div>
            <div className="absolute bottom-1 right-10 w-4 h-4 bg-white rounded-full opacity-5 animate-float-delayed"></div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 relative z-10">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <div className="flex items-center min-w-0 flex-1">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                <GraduationCap className="text-white text-sm sm:text-base" />
              </div>
              <h1 className="ml-2 sm:ml-3 text-sm sm:text-xl font-semibold text-white truncate">ADMINISTRATOR PORTAL</h1>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
              <span className="text-xs sm:text-sm font-medium text-white truncate max-w-20 sm:max-w-none">{user.fullName.split(" ")[0]}</span>
              <Button variant="ghost" size="sm" onClick={handleLogout} className="text-white hover:bg-white/20 p-2">
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs - Moved to top for website-like navigation */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6">
          <div className="flex justify-center sm:justify-start gap-1 sm:gap-2 py-4 overflow-x-auto">
            {[
              { id: "students", label: "Students", icon: Users },
              { id: "years", label: "Years", icon: Calendar },
              { id: "memories", label: "Photos", icon: Images },
              { id: "viewers", label: "Alumni", icon: UserCheck },
              { id: "profile", label: "Profile", icon: Settings }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-medium border-b-2 flex items-center space-x-1 sm:space-x-2 whitespace-nowrap transition-colors min-w-fit ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600 bg-blue-50"
                    : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
                }`}
                data-testid={`tab-${tab.id}`}
              >
                <tab.icon className="h-4 w-4 sm:h-4 sm:w-4" />
                <span className="hidden xs:inline">{tab.label}</span>
                {/* Red notification badge for alumni requests */}
                {tab.id === "viewers" && pendingRequestCount > 0 && (
                  <span 
                    className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center"
                    data-testid="notification-badge-pending-requests"
                  >
                    {pendingRequestCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8">

        {/* Student Management Tab */}
        {activeTab === "students" && (
          <div className="space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-2 sm:space-y-0">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Student Management</h2>
              <Button onClick={() => setShowAddStudent(true)} className="w-full sm:w-auto">
                <UserPlus className="h-4 w-4 mr-2" />
                Add New Student
              </Button>
            </div>

            {showAddStudent && (
              <Card>
                <CardHeader>
                  <CardTitle>Add New Student Account</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input
                        id="fullName"
                        value={newStudent.fullName}
                        onChange={(e) => setNewStudent({...newStudent, fullName: e.target.value})}
                        placeholder="Student's full name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        value={newStudent.username}
                        onChange={(e) => setNewStudent({...newStudent, username: e.target.value})}
                        placeholder="Login username"
                      />
                    </div>
                    <div>
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        value={newStudent.password}
                        onChange={(e) => setNewStudent({...newStudent, password: e.target.value})}
                        placeholder="Login password"
                      />
                    </div>
                    <div>
                      <Label htmlFor="grade">Grade</Label>
                      <Select value={newStudent.grade} onValueChange={(value) => setNewStudent({...newStudent, grade: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select grade" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Grade 7">Grade 7</SelectItem>
                          <SelectItem value="Grade 8">Grade 8</SelectItem>
                          <SelectItem value="Grade 9">Grade 9</SelectItem>
                          <SelectItem value="Grade 10">Grade 10</SelectItem>
                          <SelectItem value="Grade 11">Grade 11</SelectItem>
                          <SelectItem value="Grade 12">Grade 12</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="class">Class</Label>
                      <Input
                        id="class"
                        value={newStudent.class}
                        onChange={(e) => setNewStudent({...newStudent, class: e.target.value})}
                        placeholder="e.g., 12-A"
                      />
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button onClick={handleAddStudent}>Add Student</Button>
                    <Button variant="outline" onClick={() => setShowAddStudent(false)}>Cancel</Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Current Students</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {mockStudents.map((student) => (
                    <div key={student.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <h4 className="font-medium">{student.fullName}</h4>
                        <p className="text-sm text-gray-600">{student.grade} - {student.class}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button size="sm" variant="outline">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Year Management Tab */}
        {activeTab === "years" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Year Management</h2>
            </div>

            {/* Search Bar */}
            <div className="mb-6">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search years (e.g., 2020)"
                  value={yearSearchTerm}
                  onChange={(e) => setYearSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full"
                />
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Available Years</span>
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-600">{filteredYears.length} years available</span>
                    {/* View Mode Toggle */}
                    <div className="flex items-center bg-gray-100 rounded-lg p-1">
                      <button
                        onClick={() => setYearViewMode('grid')}
                        className={`p-1.5 rounded ${yearViewMode === 'grid' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600 hover:text-gray-800'}`}
                        title="Grid View"
                      >
                        <Grid3X3 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setYearViewMode('list')}
                        className={`p-1.5 rounded ${yearViewMode === 'list' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600 hover:text-gray-800'}`}
                        title="List View"
                      >
                        <List className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {yearViewMode === 'grid' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredYears.map((year) => year && (
                      <div key={`year-${year.year}`} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold">{year.year}</h3>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            year.status === "Active" 
                              ? "bg-green-100 text-green-800" 
                              : year.status === "Archived"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-gray-100 text-gray-800"
                          }`}>
                            {year.status}
                          </span>
                        </div>

                        {/* Show pricing info for unpurchased years */}
                        {!year.purchased && (
                          <div className="text-center">
                            <span className="text-lg font-bold text-blue-600">
                              ${year.price.toFixed(2)}
                            </span>
                          </div>
                        )}

                        <div className="flex space-x-2">
                          {year.purchased ? (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => handleManageYear(year.year)}
                              className="flex-1"
                              data-testid={`button-manage-year-${year.year}`}
                            >
                              <Settings className="h-4 w-4 mr-1" />
                              Manage
                            </Button>
                          ) : (
                            <Button 
                              size="sm" 
                              onClick={() => handleBuyYear(year.year)}
                              className="flex-1"
                              data-testid={`button-buy-year-${year.year}`}
                            >
                              <ShoppingCart className="h-4 w-4 mr-1" />
                              Buy ${year.price.toFixed(2)}
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredYears.map((year) => year && (
                      <div key={`year-${year.year}`} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="flex items-center space-x-4">
                          <div className="flex-shrink-0">
                            <span className="text-xl font-bold text-gray-900">{year.year}</span>
                          </div>
                          <div className="flex items-center space-x-3">
                            <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                              year.status === "Active" 
                                ? "bg-green-100 text-green-800" 
                                : year.status === "Archived"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-gray-100 text-gray-800"
                            }`}>
                              {year.status}
                            </span>
                            {!year.purchased && (
                              <span className="text-lg font-bold text-blue-600">
                                ${year.price.toFixed(2)}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          {year.purchased ? (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => handleManageYear(year.year)}
                              data-testid={`button-manage-year-${year.year}`}
                            >
                              <Settings className="h-4 w-4 mr-2" />
                              Manage Year
                            </Button>
                          ) : (
                            <Button 
                              size="sm" 
                              onClick={() => handleBuyYear(year.year)}
                              data-testid={`button-buy-year-${year.year}`}
                            >
                              <ShoppingCart className="h-4 w-4 mr-2" />
                              Purchase ${year.price.toFixed(2)}
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* No results message */}
                {filteredYears.length === 0 && yearSearchTerm && (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No years found matching "{yearSearchTerm}"</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Photos & Memories Tab */}
        {activeTab === "memories" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Photos & Memories</h2>
              <div className="text-sm text-gray-600">
                Manage photos and memories by year • 20MB limit per year
              </div>
            </div>

            {/* Search Bar */}
            <div className="mb-6">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search years (e.g., 2020)"
                  value={yearSearchTerm}
                  onChange={(e) => setYearSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full"
                />
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Available Years</span>
                  <span className="text-sm font-normal text-gray-600">Free storage for all years</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {filteredYears.map((year) => (
                    <div key={year.year || 'unknown'} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <div className="flex flex-col">
                            <h3 className="text-lg font-medium text-gray-900">Year {year.year || 'Unknown'}</h3>
                            <p className="text-sm text-gray-600">
                              Photos & memories storage • 0 MB / 20 MB used
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="text-right">
                          <p className="text-sm text-green-600 font-medium">Free</p>
                          <p className="text-xs text-gray-500">20MB storage</p>
                        </div>
                        <Button 
                          onClick={() => setLocation(`/photos-memories-manage?year=${year.year || 'unknown'}&school=${school?.id}`)}
                          data-testid={`button-manage-memories-${year.year || 'unknown'}`}
                        >
                          <Settings className="h-4 w-4 mr-1" />
                          Manage
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* No results message */}
                {filteredYears.length === 0 && yearSearchTerm && (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No years found matching "{yearSearchTerm}"</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Alumni Authentication Tab */}
        {activeTab === "viewers" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Alumni Authentication</h2>
              <Button onClick={() => setShowAddViewer(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                Add Viewer Account
              </Button>
            </div>

            {/* Pending Alumni Upgrade Requests */}
            {pendingRequests.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Clock className="h-5 w-5 mr-2 text-orange-500" />
                    Pending Alumni Upgrade Requests ({pendingRequests.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {pendingRequests.map((request) => (
                      <div key={request.id} className="flex items-center justify-between p-4 bg-orange-50 border border-orange-200 rounded-lg">
                        <div>
                          <h4 className="font-medium text-gray-900">{request.fullName}</h4>
                          <p className="text-sm text-gray-600">Requested on {new Date(request.createdAt || "").toLocaleDateString()}</p>
                          <p className="text-xs text-orange-600">Status: {request.status}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleViewRequest(request)}
                            className="text-blue-600 border-blue-200 hover:bg-blue-50"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button 
                            size="sm" 
                            onClick={() => handleApproveRequest(request.id)}
                            disabled={approveAlumniRequestMutation.isPending}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleDenyRequest(request.id)}
                            disabled={denyAlumniRequestMutation.isPending}
                            className="text-red-600 border-red-200 hover:bg-red-50"
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Deny
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {showAddViewer && (
              <Card>
                <CardHeader>
                  <CardTitle>Add New Viewer Account</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="viewerFullName">Full Name</Label>
                      <Input
                        id="viewerFullName"
                        value={newViewer.fullName}
                        onChange={(e) => setNewViewer({...newViewer, fullName: e.target.value})}
                        placeholder="Viewer's full name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="viewerUsername">Username</Label>
                      <Input
                        id="viewerUsername"
                        value={newViewer.username}
                        onChange={(e) => setNewViewer({...newViewer, username: e.target.value})}
                        placeholder="Login username"
                      />
                    </div>
                    <div>
                      <Label htmlFor="viewerPassword">Password</Label>
                      <Input
                        id="viewerPassword"
                        type="password"
                        value={newViewer.password}
                        onChange={(e) => setNewViewer({...newViewer, password: e.target.value})}
                        placeholder="Login password"
                      />
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button onClick={handleAddViewer}>Add Viewer</Button>
                    <Button variant="outline" onClick={() => setShowAddViewer(false)}>Cancel</Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Current Alumni Accounts</span>
                  <span className="text-sm text-gray-600">{alumniBadges.length} total</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Search Bar */}
                <div className="mb-6">
                  <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      type="text"
                      placeholder="Search alumni by name or year..."
                      value={alumniSearchTerm}
                      onChange={(e) => setAlumniSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 w-full"
                    />
                  </div>
                </div>

                {(() => {
                  if (alumniBadges.length === 0) {
                    return <p className="text-gray-500 text-center py-4">No alumni accounts found</p>;
                  }

                  // Filter alumni based on search term
                  const filteredAlumni = alumniBadges.filter((badge) => {
                    const searchLower = alumniSearchTerm.toLowerCase();
                    const fullName = badge.fullName?.toLowerCase() || '';
                    const graduationYear = badge.graduationYear?.toString() || '';
                    const admissionYear = badge.admissionYear?.toString() || '';
                    
                    return fullName.includes(searchLower) || 
                           graduationYear.includes(searchLower) || 
                           admissionYear.includes(searchLower);
                  });

                  // Separate into graduated and non-graduated
                  const graduated = filteredAlumni.filter(badge => 
                    badge.graduationYear && badge.graduationYear !== "Did not graduate from " + badge.school
                  );
                  const nonGraduated = filteredAlumni.filter(badge => 
                    badge.graduationYear && badge.graduationYear.startsWith("Did not graduate from")
                  );

                  // Sort graduated alumni by graduation year (most recent first), then by school name
                  const sortedGraduated = graduated.sort((a, b) => {
                    const yearA = parseInt(a.graduationYear) || 0;
                    const yearB = parseInt(b.graduationYear) || 0;
                    if (yearA !== yearB) return yearB - yearA; // Most recent first
                    return (a.school || '').localeCompare(b.school || '');
                  });

                  // Sort non-graduated by school name
                  const sortedNonGraduated = nonGraduated.sort((a, b) => 
                    (a.school || '').localeCompare(b.school || '')
                  );

                  // Filter based on school founding year if available
                  const schoolFoundingYear = school?.yearFounded;
                  const filteredByFoundingYear = schoolFoundingYear ? 
                    sortedGraduated.filter(badge => {
                      const gradYear = parseInt(badge.graduationYear);
                      return !gradYear || gradYear >= schoolFoundingYear;
                    }) : sortedGraduated;

                  return (
                    <div className="space-y-6">
                      {/* Graduated Alumni Section */}
                      {filteredByFoundingYear.length > 0 && (
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                            <GraduationCap className="h-5 w-5 mr-2 text-green-600" />
                            Graduated Alumni ({filteredByFoundingYear.length})
                          </h4>
                          <div className="space-y-2">
                            {filteredByFoundingYear.map((badge) => (
                              <div key={badge.id} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                                <div>
                                  <h4 className="font-medium text-gray-900">{badge.fullName}</h4>
                                  <p className="text-sm text-gray-600">
                                    Class of {badge.graduationYear} • 
                                    <span className={`ml-1 font-medium ${
                                      badge.status === 'verified' ? 'text-green-600' : 'text-yellow-600'
                                    }`}>
                                      {badge.status === 'verified' ? 'Verified' : 'Pending'}
                                    </span>
                                  </p>
                                  <p className="text-xs text-gray-500 mt-1">Admitted: {badge.admissionYear}</p>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => deleteAlumniBadgeMutation.mutate(badge.id)}
                                    disabled={deleteAlumniBadgeMutation.isPending}
                                    className="text-red-600 border-red-200 hover:bg-red-50"
                                  >
                                    {deleteAlumniBadgeMutation.isPending ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <Trash2 className="h-4 w-4" />
                                    )}
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Non-Graduated Alumni Section */}
                      {sortedNonGraduated.length > 0 && (
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                            <UserCheck className="h-5 w-5 mr-2 text-blue-600" />
                            Did Not Graduate from {school?.name} ({sortedNonGraduated.length})
                          </h4>
                          <div className="space-y-2">
                            {sortedNonGraduated.map((badge) => (
                              <div key={badge.id} className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                <div>
                                  <h4 className="font-medium text-gray-900">{badge.fullName}</h4>
                                  <p className="text-sm text-gray-600">
                                    Did not graduate • 
                                    <span className={`ml-1 font-medium ${
                                      badge.status === 'verified' ? 'text-green-600' : 'text-yellow-600'
                                    }`}>
                                      {badge.status === 'verified' ? 'Verified' : 'Pending'}
                                    </span>
                                  </p>
                                  <p className="text-xs text-gray-500 mt-1">Admitted: {badge.admissionYear}</p>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => deleteAlumniBadgeMutation.mutate(badge.id)}
                                    disabled={deleteAlumniBadgeMutation.isPending}
                                    className="text-red-600 border-red-200 hover:bg-red-50"
                                  >
                                    {deleteAlumniBadgeMutation.isPending ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <Trash2 className="h-4 w-4" />
                                    )}
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* No results message */}
                      {filteredAlumni.length === 0 && alumniSearchTerm && (
                        <p className="text-gray-500 text-center py-4">No alumni found matching "{alumniSearchTerm}"</p>
                      )}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          </div>
        )}
        
        {/* Profile Tab */}
        {activeTab === "profile" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">School Profile</h2>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  School Information
                  <div className="space-x-2">
                    {isEditingSchool ? (
                      <>
                        <Button size="sm" variant="outline" onClick={() => setIsEditingSchool(false)}>
                          Cancel
                        </Button>
                        <Button size="sm" onClick={handleSaveSchoolInfo}>
                          Save
                        </Button>
                      </>
                    ) : (
                      <Button size="sm" variant="outline" onClick={handleEditSchoolInfo}>
                        Edit
                      </Button>
                    )}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="schoolName">School Name</Label>
                    <Input
                      id="schoolName"
                      value={school?.name || ""}
                      disabled
                      className="bg-gray-50"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      value={isEditingSchool ? editableSchoolData.email : (school?.email || "")}
                      disabled={!isEditingSchool}
                      className={isEditingSchool ? "" : "bg-gray-50"}
                      onChange={(e) => setEditableSchoolData(prev => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      value={school?.country || ""}
                      disabled
                      className="bg-gray-50"
                    />
                  </div>
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={isEditingSchool ? editableSchoolData.city : (school?.city || "")}
                      disabled={!isEditingSchool}
                      className={isEditingSchool ? "" : "bg-gray-50"}
                      onChange={(e) => setEditableSchoolData(prev => ({ ...prev, city: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="yearFounded">Year Founded</Label>
                    <Input
                      id="yearFounded"
                      value={school?.yearFounded || ""}
                      disabled
                      className="bg-gray-50"
                    />
                  </div>
                  <div>
                    <Label htmlFor="schoolCode">School Code</Label>
                    <div className="flex space-x-2">
                      <Input
                        id="schoolCode"
                        value={schoolCodeVisible ? (school?.schoolCode || "") : "••••••••••"}
                        disabled
                        className="bg-gray-50 flex-1"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSchoolCodeVisible(!schoolCodeVisible)}
                        className="px-3"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Editable Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="address">Address (Optional)</Label>
                    <Textarea
                      id="address"
                      value={schoolProfileForm.address || school?.address || ""}
                      onChange={(e) => setSchoolProfileForm({...schoolProfileForm, address: e.target.value})}
                      placeholder="Enter school address"
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">State/Province (Optional)</Label>
                    <Input
                      id="state"
                      value={schoolProfileForm.state || school?.state || ""}
                      onChange={(e) => setSchoolProfileForm({...schoolProfileForm, state: e.target.value})}
                      placeholder="Enter state or province"
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button 
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={() => {
                      updateSchoolProfileMutation.mutate({
                        address: schoolProfileForm.address || undefined,
                        state: schoolProfileForm.state || undefined
                      });
                    }}
                    disabled={updateSchoolProfileMutation.isPending}
                  >
                    {updateSchoolProfileMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Theme Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Theme Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-gray-900">Dark Mode</h4>
                    <p className="text-xs text-gray-600">
                      Switch between light and dark themes for better viewing experience
                    </p>
                  </div>
                  <Switch 
                    checked={isDarkMode}
                    onCheckedChange={toggleDarkMode}
                    className="ml-4"
                    data-testid="switch-dark-mode"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        
        {/* Request Details Dialog */}
        <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Alumni Status Request Details</DialogTitle>
              <DialogDescription>
                Review the submitted alumni verification information
              </DialogDescription>
            </DialogHeader>
            
            {selectedRequest && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Full Name</Label>
                    <p className="text-gray-900">{selectedRequest.fullName}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Status</Label>
                    <p className={`text-sm font-medium ${
                      selectedRequest.status === 'pending' ? 'text-orange-600' :
                      selectedRequest.status === 'approved' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {selectedRequest.status.charAt(0).toUpperCase() + selectedRequest.status.slice(1)}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Admission Year</Label>
                    <p className="text-gray-900">{selectedRequest.admissionYear}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Graduation Year</Label>
                    <p className="text-gray-900">{selectedRequest.graduationYear}</p>
                  </div>
                </div>
                
                {selectedRequest.postHeld && (
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Post Held</Label>
                    <p className="text-gray-900">{selectedRequest.postHeld}</p>
                  </div>
                )}
                
                {selectedRequest.studentName && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Student Reference Name</Label>
                      <p className="text-gray-900">{selectedRequest.studentName}</p>
                    </div>
                    {selectedRequest.studentAdmissionYear && (
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Reference Admission Year</Label>
                        <p className="text-gray-900">{selectedRequest.studentAdmissionYear}</p>
                      </div>
                    )}
                  </div>
                )}
                
                {selectedRequest.additionalInfo && (
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Additional Information</Label>
                    <p className="text-gray-900 bg-gray-50 p-3 rounded-md">{selectedRequest.additionalInfo}</p>
                  </div>
                )}
                
                <div>
                  <Label className="text-sm font-medium text-gray-700">Request Date</Label>
                  <p className="text-gray-900">{new Date(selectedRequest.createdAt || "").toLocaleDateString()}</p>
                </div>
                
                {selectedRequest.status === 'pending' && (
                  <div className="flex gap-3 pt-4 border-t border-gray-200">
                    <Button 
                      onClick={() => {
                        handleApproveRequest(selectedRequest.id);
                        setShowRequestDialog(false);
                      }}
                      disabled={approveAlumniRequestMutation.isPending}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve Request
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => {
                        handleDenyRequest(selectedRequest.id);
                        setShowRequestDialog(false);
                      }}
                      disabled={denyAlumniRequestMutation.isPending}
                      className="text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Deny Request
                    </Button>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* School Code Password Dialog */}
        <Dialog open={showSchoolCodePassword} onOpenChange={setShowSchoolCodePassword}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Enter Password to View School Code</DialogTitle>
              <DialogDescription>
                For security purposes, please enter your password to view the school code.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={schoolCodePassword}
                  onChange={(e) => setSchoolCodePassword(e.target.value)}
                  placeholder="Enter your password"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleVerifyPassword();
                    }
                  }}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => {
                  setShowSchoolCodePassword(false);
                  setSchoolCodePassword("");
                }}>
                  Cancel
                </Button>
                <Button onClick={handleVerifyPassword}>
                  Verify
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Checkout Overlay */}
        {showCheckout && selectedYearForPurchase && (
          <CheckoutOverlay
            isOpen={showCheckout}
            onClose={() => setShowCheckout(false)}
            year={selectedYearForPurchase}
            price={mockYears.find(y => y && y.year === selectedYearForPurchase)?.price || 14.99}
            isFree={false}
            onConfirmPurchase={handleConfirmPurchase}
            userType="school"
          />
        )}
      </div>
    </div>
    </div>
  );
}