import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { SearchableSchoolSelect } from "@/components/ui/searchable-school-select";
import { Eye, LogOut, UserCheck, GraduationCap, Send, Bell, X } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { CURRENT_YEAR } from "@shared/constants";

interface School {
  id: string;
  name: string;
  country: string;
  state?: string;
  city: string;
  yearFounded: number;
}

export default function RequestAlumniStatus() {
  const [, setLocation] = useLocation();
  const [user, setUser] = useState<any>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const queryClient = useQueryClient();
  
  // Load form data from localStorage on component mount
  const [formData, setFormData] = useState(() => {
    const savedFormData = localStorage.getItem("alumni-request-form");
    if (savedFormData) {
      return JSON.parse(savedFormData);
    }
    return {
      selectedSchool: "",
      firstName: "",
      middleName: "",
      lastName: "",
      noNameChange: false,
      admissionYear: "",
      graduationYear: "",
      didNotGraduate: false,
      postHeld: "",
      studentName: "",
      studentAdmissionYear: "",
      additionalInfo: ""
    };
  });

  // Fetch alumni badges to check for verified and pending status
  const { data: alumniBadges = [] } = useQuery<any[]>({
    queryKey: ["/api/alumni-badges", user?.id],
    enabled: !!user,
  });

  // Get actual account status from user data
  const getAccountStatus = () => {
    if (!user || !user.userType) return 'Unknown';
    
    // Count verified and total badges
    const verifiedBadges = alumniBadges.filter((badge: any) => badge.status === 'verified');
    const totalBadges = alumniBadges.length;
    
    switch (user.userType.toLowerCase()) {
      case 'student':
        return 'Student';
      case 'viewer':
        if (totalBadges > 0) {
          // User has alumni badges (either verified or pending)
          return `Alumni(${verifiedBadges.length})`;
        } else {
          return 'Viewer';
        }
      case 'school':
        return 'School Admin';
      case 'super_admin':
        return 'Super Admin';
      default:
        return 'Unknown';
    }
  };
  
  const accountStatus = getAccountStatus();

  const { toast } = useToast();

  // Fetch real schools from API
  const { data: schools = [] } = useQuery<School[]>({
    queryKey: ["/api/schools"],
    enabled: !!user,
  });

  // Fetch notifications
  const { data: notifications = [] } = useQuery<any[]>({
    queryKey: ["/api/notifications", user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (!user?.id) return [];
      const res = await fetch(`/api/notifications/${user.id}`);
      if (!res.ok) throw new Error("Failed to fetch notifications");
      return res.json();
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Generate years dynamically based on selected school's founding year
  const currentYear = CURRENT_YEAR;
  const selectedSchool = schools.find(school => school.id === formData.selectedSchool);
  const schoolFoundingYear = selectedSchool?.yearFounded || 1980;
  
  // Only show years from school founding year to current year to avoid paradoxes
  // Generate years in descending order from current year to school founding year
  const years = Array.from({ length: currentYear - schoolFoundingYear + 1 }, (_, i) => {
    return (currentYear - i).toString();
  });

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      setLocation("/");
      return;
    }
    setUser(JSON.parse(userData));
  }, [setLocation]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    setLocation("/");
  };

  const handleBackToDashboard = () => {
    setLocation("/viewer-dashboard");
  };

  // Mark notification as read mutation
  const markNotificationReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      await apiRequest("PATCH", `/api/notifications/${notificationId}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications", user?.id] });
    },
  });

  const handleMarkNotificationRead = (notificationId: string) => {
    markNotificationReadMutation.mutate(notificationId);
  };

  const unreadNotificationCount = notifications.filter((n: any) => !n.isRead).length;

  const handleInputChange = (field: string, value: string | boolean) => {
    let newFormData = {
      ...formData,
      [field]: value
    };
    
    // Reset year fields when school changes to avoid paradoxes
    if (field === "selectedSchool") {
      newFormData = {
        ...newFormData,
        admissionYear: "",
        graduationYear: "",
        didNotGraduate: false,
        studentAdmissionYear: ""
      };
    }
    
    // Clear graduation year when "did not graduate" is checked
    if (field === "didNotGraduate" && value === true) {
      newFormData = {
        ...newFormData,
        graduationYear: "did-not-graduate"
      };
    }
    
    // Clear "did not graduate" when graduation year is selected
    if (field === "graduationYear" && value !== "did-not-graduate") {
      newFormData = {
        ...newFormData,
        didNotGraduate: false
      };
    }
    
    setFormData(newFormData);
    // Persist form data to localStorage
    localStorage.setItem("alumni-request-form", JSON.stringify(newFormData));
  };

  // Mutation for creating alumni request
  const createAlumniRequestMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/alumni-requests", data);
    },
    onSuccess: () => {
      // Clear form data from localStorage
      localStorage.removeItem("alumni-request-form");
      
      // Invalidate alumni badges to show the new pending badge
      queryClient.invalidateQueries({ queryKey: ["/api/alumni-badges", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications", user?.id] });
      
      toast({
        title: "Request Submitted!",
        description: "Your alumni status request has been submitted successfully. You will receive a response within 3-5 business days.",
      });
      setLocation("/viewer-dashboard");
    },
    onError: (error: any) => {
      toast({
        title: "Submission Failed",
        description: error.message || "Unknown error occurred",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    // Basic validation
    if (!formData.selectedSchool || !formData.admissionYear || (!formData.graduationYear && !formData.didNotGraduate)) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    // Check for duplicate school before submitting
    const selectedSchoolObj = schools.find(school => school.id === formData.selectedSchool);
    if (selectedSchoolObj) {
      // This check will be done server-side, but we can add client-side feedback too
      console.log('Submitting request for school:', selectedSchoolObj.name);
    }

    // Prepare data for new alumni request API
    const requestData = {
      userId: user?.id,
      schoolId: formData.selectedSchool,
      fullName: user?.fullName, // Use the name from user account instead of form input
      admissionYear: formData.admissionYear,
      graduationYear: formData.graduationYear,
      postHeld: formData.postHeld || null,
      studentName: formData.studentName || null,
      studentAdmissionYear: formData.studentAdmissionYear || null,
      additionalInfo: formData.additionalInfo || null,
      status: "pending"
    };

    createAlumniRequestMutation.mutate(requestData);
  };

  const selectedSchoolName = schools.find(school => school.id === formData.selectedSchool)?.name || "this school";

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
              <div className="flex items-center">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <UserCheck className="text-white text-sm" />
                </div>
                <h1 className="ml-2 sm:ml-3 text-sm sm:text-xl font-semibold text-white">Request Alumni Status</h1>
              </div>

              <div className="flex items-center space-x-1 sm:space-x-4">
                {/* Mobile Circle Status Indicator - Show only on small screens */}
                <div className="sm:hidden relative">
                  {accountStatus.startsWith("Alumni") ? (
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                      {alumniBadges.filter((b: any) => b.status === "verified").length}
                    </div>
                  ) : (
                    <div className="w-6 h-6 bg-blue-500 rounded-full"></div>
                  )}
                </div>
                
                {/* Desktop Account Status Indicator - Hidden on small screens */}
                <div className={`hidden sm:block px-2 sm:px-3 py-1 rounded-full text-xs font-medium ${
                  accountStatus.startsWith("Alumni") 
                    ? "bg-green-500/20 text-green-200 border border-green-400/30" 
                    : "bg-blue-500/20 text-blue-200 border border-blue-400/30"
                }`}>
                  <span className="hidden md:inline">Account Status: </span>{accountStatus}
                </div>
                
                {/* Notification Bell */}
                <div className="relative">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="relative text-white hover:bg-white/20"
                    data-testid="button-notifications"
                  >
                    <Bell className="h-5 w-5" />
                    {unreadNotificationCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {unreadNotificationCount}
                      </span>
                    )}
                  </Button>
                  
                  {/* Notifications Dropdown */}
                  {showNotifications && (
                    <div className="absolute right-0 mt-2 w-72 sm:w-80 max-w-[calc(100vw-2rem)] bg-white rounded-lg shadow-lg border border-gray-200 z-50" style={{ right: '0', left: 'auto', marginRight: '0.5rem' }}>
                      <div className="p-4 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setShowNotifications(false)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="p-4 text-center text-gray-500">
                            No notifications yet
                          </div>
                        ) : (
                          notifications.map((notification: any) => (
                            <div 
                              key={notification.id} 
                              className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                                !notification.isRead ? 'bg-blue-50' : ''
                              }`}
                              onClick={() => {
                                if (!notification.isRead) {
                                  handleMarkNotificationRead(notification.id);
                                }
                              }}
                              data-testid={`notification-${notification.id}`}
                            >
                              <div className="flex items-start space-x-3">
                                <div className={`w-2 h-2 rounded-full mt-2 ${
                                  !notification.isRead ? 'bg-blue-500' : 'bg-gray-300'
                                }`} />
                                <div className="flex-1">
                                  <h4 className="text-sm font-medium text-gray-900">
                                    {notification.title}
                                  </h4>
                                  <p className="text-sm text-gray-600 mt-1">
                                    {notification.message}
                                  </p>
                                  <p className="text-xs text-gray-400 mt-2">
                                    {new Date(notification.createdAt || '').toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
                
                <span className="text-xs sm:text-sm font-medium text-white hidden xs:block">
                  {user.fullName.split(" ")[0]}
                </span>
                <Button variant="ghost" size="sm" onClick={handleLogout} className="text-white hover:bg-white/20">
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </header>

      <div className="max-w-4xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8">
        {/* Welcome Section */}
        <div className="mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-3xl font-bold text-gray-900">
            Request Alumni Status
          </h2>
          <p className="text-sm sm:text-base text-gray-600 mt-2">Please provide the following information to verify your alumni status</p>
        </div>

        {/* Back to Dashboard Button */}
        <div className="mb-6 sm:mb-8">
          <Button 
            onClick={handleBackToDashboard}
            variant="outline"
            className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm px-3 sm:px-4"
          >
            <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
            <span>Back to Dashboard</span>
          </Button>
        </div>

        {/* Request Form */}
        <Card className="shadow-sm">
          <CardContent className="p-4 sm:p-8">
            <div className="flex items-center space-x-2 mb-6">
              <GraduationCap className="h-5 w-5 text-blue-500" />
              <h3 className="text-lg font-semibold text-gray-900">Alumni Verification Form</h3>
            </div>

            <div className="space-y-6">
              {/* School Selection */}
              <div>
                <Label className="block text-sm font-medium text-gray-700 mb-2">
                  Select School <span className="text-red-500">*</span>
                </Label>
                <SearchableSchoolSelect
                  schools={schools}
                  value={formData.selectedSchool}
                  onValueChange={(value) => handleInputChange("selectedSchool", value)}
                  placeholder="Search for the school you attended..."
                  className="w-full"
                />
              </div>



              {/* Name Information */}
              <div className="space-y-4 border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900">Name Information</h3>
                <p className="text-sm text-gray-600">
                  If your name has changed since graduation (e.g., due to marriage), provide your name as it was during school.
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="text"
                      placeholder="First name"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange("firstName", e.target.value)}
                      disabled={formData.noNameChange}
                      className={formData.noNameChange ? "bg-gray-50" : ""}
                    />
                  </div>
                  
                  <div>
                    <Label className="block text-sm font-medium text-gray-700 mb-2">
                      Middle Name
                    </Label>
                    <Input
                      type="text"
                      placeholder="Middle name (if any)"
                      value={formData.middleName}
                      onChange={(e) => handleInputChange("middleName", e.target.value)}
                      disabled={formData.noNameChange}
                      className={formData.noNameChange ? "bg-gray-50" : ""}
                    />
                  </div>
                  
                  <div>
                    <Label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="text"
                      placeholder="Last name"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange("lastName", e.target.value)}
                      disabled={formData.noNameChange}
                      className={formData.noNameChange ? "bg-gray-50" : ""}
                    />
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="noNameChange"
                    checked={formData.noNameChange}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      if (checked) {
                        handleInputChange("firstName", user?.firstName || "");
                        handleInputChange("middleName", user?.middleName || "");
                        handleInputChange("lastName", user?.lastName || "");
                      }
                      handleInputChange("noNameChange", checked);
                    }}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="noNameChange" className="text-sm text-gray-700">
                    I have not had any name change since graduation
                  </Label>
                </div>
              </div>

              {/* Admission and Graduation Years */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <Label className="block text-sm font-medium text-gray-700 mb-2">
                    Admission Year <span className="text-red-500">*</span>
                  </Label>
                  <Select 
                    value={formData.admissionYear} 
                    onValueChange={(value) => handleInputChange("admissionYear", value)}
                    disabled={!formData.selectedSchool}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={!formData.selectedSchool ? "Select school first" : "Select admission year"} />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="block text-sm font-medium text-gray-700 mb-2">
                    Graduation Year <span className="text-red-500">*</span>
                  </Label>
                  
                  <Select 
                    value={formData.didNotGraduate ? "" : formData.graduationYear} 
                    onValueChange={(value) => handleInputChange("graduationYear", value)}
                    disabled={!formData.selectedSchool || formData.didNotGraduate}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={
                        !formData.selectedSchool ? "Select school first" : 
                        formData.didNotGraduate ? "Graduation year not applicable" :
                        "Select graduation year"
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {/* Checkbox for "Did not graduate" */}
                  <div className="flex items-center space-x-2 mt-3">
                    <Checkbox 
                      id="did-not-graduate" 
                      checked={formData.didNotGraduate}
                      onCheckedChange={(checked) => handleInputChange("didNotGraduate", checked === true)}
                      disabled={!formData.selectedSchool}
                    />
                    <label 
                      htmlFor="did-not-graduate" 
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      I did not graduate from {selectedSchoolName}
                    </label>
                  </div>
                </div>
              </div>

              {/* Post Held */}
              <div>
                <Label className="block text-sm font-medium text-gray-700 mb-2">
                  Post Held (Optional)
                </Label>
                <Input
                  type="text"
                  placeholder="e.g., Head Boy, Class Captain, Sports Captain, etc."
                  value={formData.postHeld}
                  onChange={(e) => handleInputChange("postHeld", e.target.value)}
                  className="w-full"
                />
              </div>

              {/* Student Reference */}
              <div className="bg-gray-50 p-4 sm:p-6 rounded-lg">
                <h4 className="text-md font-medium text-gray-900 mb-4">Student Reference (Optional)</h4>
                <p className="text-sm text-gray-600 mb-4">
                  Providing a student reference can help us verify your attendance at the school.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <Label className="block text-sm font-medium text-gray-700 mb-2">
                      Name of Student You Remember
                    </Label>
                    <Input
                      type="text"
                      placeholder="Full name of a fellow student"
                      value={formData.studentName}
                      onChange={(e) => handleInputChange("studentName", e.target.value)}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <Label className="block text-sm font-medium text-gray-700 mb-2">
                      Their Admission Year
                    </Label>
                    <Select 
                      value={formData.studentAdmissionYear} 
                      onValueChange={(value) => handleInputChange("studentAdmissionYear", value)}
                      disabled={!formData.selectedSchool || !formData.studentName.trim()}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={
                          !formData.selectedSchool ? "Select school first" : 
                          !formData.studentName.trim() ? "Enter student name first" :
                          "Select their admission year"
                        } />
                      </SelectTrigger>
                      <SelectContent>
                        {years.map((year) => (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div>
                <Label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Information (Optional)
                </Label>
                <Textarea
                  placeholder="Any additional information that might help verify your attendance (e.g., house you belonged to, favorite teacher, memorable events, etc.)"
                  value={formData.additionalInfo}
                  onChange={(e) => handleInputChange("additionalInfo", e.target.value)}
                  className="w-full h-24"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-6 border-t border-gray-200">
                <div className="flex flex-col gap-4 justify-between">
                  <div className="text-sm text-gray-600">
                    <p>* Required fields</p>
                    <p>Your request will be reviewed within 3-5 business days.</p>
                  </div>
                  <Button 
                    onClick={handleSubmit}
                    disabled={createAlumniRequestMutation.isPending}
                    className="bg-blue-500 hover:bg-blue-600 flex items-center justify-center space-x-2 px-6 sm:px-8 py-2 sm:py-3 w-full sm:w-auto disabled:opacity-50"
                    data-testid="button-submit-alumni-request"
                  >
                    <Send className="h-4 w-4" />
                    <span>{createAlumniRequestMutation.isPending ? "Submitting..." : "Submit Request"}</span>
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      </div>
    </div>
  );
}