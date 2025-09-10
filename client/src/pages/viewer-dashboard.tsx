import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { SearchableSchoolSelect } from "@/components/ui/searchable-school-select";
import { Eye, LogOut, Images, BookOpen, UserCheck, GraduationCap, User, Home, Award, Plus, CreditCard, Trash2, Bell, X, Library, Folder, FolderOpen, Users, Search, Mail, Phone, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCcw, Play, Calendar, Video } from "lucide-react";
import PhotoGallery from "@/components/ui/photo-gallery";
import type { AlumniBadge, User as UserType, School, Memory, Notification, Student } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { CURRENT_YEAR } from "@shared/constants";

export default function ViewerDashboard() {
  const [, setLocation] = useLocation();
  const [selectedSchool, setSelectedSchool] = useState("");
  const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR.toString());
  const [user, setUser] = useState<UserType | null>(null);
  const [activeTab, setActiveTab] = useState("home");
  const [showNotifications, setShowNotifications] = useState(false);
  
  // Phone number editing state
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [editingPhoneNumber, setEditingPhoneNumber] = useState("");
  
  // Alumni tab state
  const [selectedAlumniSchool, setSelectedAlumniSchool] = useState("");
  const [selectedGraduationYear, setSelectedGraduationYear] = useState("");
  const [alumniSearchTerm, setAlumniSearchTerm] = useState("");
  const [expandedSchools, setExpandedSchools] = useState<Set<string>>(new Set());
  const [memoryFilter, setMemoryFilter] = useState<string>('all');
  
  // Image preview modal state
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(-1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
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
  
  // Image preview handlers
  const handleImageClick = (memory: Memory, index: number) => {
    setSelectedImageIndex(index);
    setIsModalOpen(true);
  };

  const navigateToNext = () => {
    if (selectedImageIndex < memories.length - 1) {
      setSelectedImageIndex(selectedImageIndex + 1);
    }
  };

  const navigateToPrevious = () => {
    if (selectedImageIndex > 0) {
      setSelectedImageIndex(selectedImageIndex - 1);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedImageIndex(-1);
    setZoomLevel(1);
    setImagePosition({ x: 0, y: 0 });
  };

  // Zoom control functions
  const zoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.5, 3));
  };

  const zoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.5, 0.5));
  };

  const resetZoom = () => {
    setZoomLevel(1);
    setImagePosition({ x: 0, y: 0 });
  };

  // Mouse drag handlers for panning
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomLevel > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - imagePosition.x, y: e.clientY - imagePosition.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoomLevel > 1) {
      setImagePosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  
  // Handle phone number update
  const handlePhoneNumberUpdate = async () => {
    if (!user) return;
    
    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phoneNumber: editingPhoneNumber }),
      });
      
      if (response.ok) {
        const updatedUser = { ...user, phoneNumber: editingPhoneNumber };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setIsEditingPhone(false);
        toast({
          title: "Phone number updated",
          description: "Your phone number has been successfully updated.",
        });
      } else {
        throw new Error('Failed to update phone number');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update phone number. Please try again.",
        variant: "destructive",
      });
    }
  };

  const startEditingPhone = () => {
    setEditingPhoneNumber(user?.phoneNumber || "");
    setIsEditingPhone(true);
  };

  const cancelEditingPhone = () => {
    setEditingPhoneNumber("");
    setIsEditingPhone(false);
  };
  
  // Handle phone privacy toggle
  const handlePhonePrivacyToggle = async (checked: boolean) => {
    if (!user) return;
    
    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ showPhoneToAlumni: checked }),
      });
      
      if (response.ok) {
        const updatedUser = { ...user, showPhoneToAlumni: checked };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        toast({
          title: "Privacy setting updated",
          description: checked ? "Your phone number will be visible to alumni" : "Your phone number will be hidden from alumni",
        });
      } else {
        throw new Error('Failed to update privacy setting');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update privacy setting. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Mock alumni badges data - replace with your actual user data structure
  const { data: alumniBadges = [] } = useQuery<AlumniBadge[]>({
    queryKey: ["/api/alumni-badges", user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (!user?.id) return [];
      const res = await fetch(`/api/alumni-badges/${user.id}`);
      if (!res.ok) throw new Error("Failed to fetch alumni badges");
      return res.json();
    }
  });


  const maxAlumniBadges = 4;
  const accountStatus = alumniBadges.length > 0 ? "Alumni" : "Viewer";

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      setLocation("/");
      return;
    }
    
    const parsedUser = JSON.parse(userData);
    
    // Verify this is a viewer or student account, not a school admin account
    if (parsedUser.userType === "school") {
      console.log("School admin account detected in viewer dashboard, redirecting to correct dashboard");
      localStorage.removeItem("user"); // Clear the session
      setLocation("/");
      return;
    }
    
    setUser(parsedUser);
    
    // Load previously selected school if it exists
    const savedSchool = localStorage.getItem(`selectedSchool_${parsedUser.id}`);
    if (savedSchool) {
      setSelectedSchool(savedSchool);
    }
  }, [setLocation]);

  const { data: schools = [] } = useQuery<School[]>({
    queryKey: ["/api/schools"],
    enabled: !!user,
  });

  // Fetch notifications
  const { data: notifications = [] } = useQuery<Notification[]>({
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

  const { data: memories = [] } = useQuery<Memory[]>({
    queryKey: ["/api/memories/school", selectedSchool, selectedYear],
    enabled: !!selectedSchool,
  });

  const { data: school } = useQuery<School>({
    queryKey: ["/api/schools", selectedSchool],
    enabled: !!selectedSchool,
  });

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isModalOpen) return;
      
      switch (event.key) {
        case 'ArrowLeft':
          navigateToPrevious();
          break;
        case 'ArrowRight':
          navigateToNext();
          break;
        case 'Escape':
          closeModal();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen, selectedImageIndex, memories.length]);

  // Fetch user's purchased yearbooks
  const { data: purchasedYearbooks = [] } = useQuery({
    queryKey: ["/api/viewer-year-purchases", user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (!user?.id) return [];
      const res = await fetch(`/api/viewer-year-purchases/user/${user.id}`);
      if (!res.ok) throw new Error("Failed to fetch purchased yearbooks");
      return res.json();
    },
  });

  // Fetch students by school and graduation year for alumni tab
  // Query for all students from the selected school (for search across all years)
  const { data: allSchoolStudents = [] } = useQuery<any[]>({
    queryKey: ["/api/students", selectedAlumniSchool, "search"],
    enabled: !!selectedAlumniSchool,
    queryFn: async () => {
      if (!selectedAlumniSchool) return [];
      
      // Ensure we use the correct school ID
      let schoolId = selectedAlumniSchool;
      if (!selectedAlumniSchool.includes('-')) {
        const schoolObj = schools.find(s => s.name === selectedAlumniSchool);
        if (schoolObj) {
          schoolId = schoolObj.id;
        }
      }
      
      const res = await fetch(`/api/students/${schoolId}/search`);
      if (!res.ok) throw new Error("Failed to fetch students");
      return res.json();
    }
  });

  // Query for specific graduation year students
  const { data: yearStudents = [] } = useQuery<any[]>({
    queryKey: ["/api/students", selectedAlumniSchool, selectedGraduationYear],
    enabled: !!selectedAlumniSchool && !!selectedGraduationYear,
    queryFn: async () => {
      if (!selectedAlumniSchool || !selectedGraduationYear) return [];
      
      // Ensure we use the correct school ID
      let schoolId = selectedAlumniSchool;
      if (!selectedAlumniSchool.includes('-')) {
        const schoolObj = schools.find(s => s.name === selectedAlumniSchool);
        if (schoolObj) {
          schoolId = schoolObj.id;
        }
      }
      
      const res = await fetch(`/api/students/${schoolId}/${selectedGraduationYear}`);
      if (!res.ok) throw new Error("Failed to fetch classmates");
      return res.json();
    }
  });

  // Save selected school to localStorage when it changes
  useEffect(() => {
    if (selectedSchool && user?.id) {
      localStorage.setItem(`selectedSchool_${user.id}`, selectedSchool);
    }
  }, [selectedSchool, user?.id]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    setLocation("/");
  };

  const handleYearbookFinder = () => {
    if (!selectedSchool) {
      toast({
        title: "Please select a school",
        description: "Choose a school from the dropdown before browsing yearbooks.",
        variant: "destructive",
      });
      return;
    }
    setLocation(`/yearbook-finder?school=${selectedSchool}`);
  };

  const handleRequestAlumniStatus = () => {
    if (alumniBadges.length >= maxAlumniBadges) {
      alert("You have reached the maximum number of alumni badges (4). Please upgrade your account to add more alumni statuses.");
      return;
    }
    setLocation("/request-alumni-status");
  };

  const handleUpgradeAccount = () => {
    alert("Upgrade feature coming soon! You'll be able to purchase additional alumni badge slots.");
  };

  // Alumni badge deletion
  const deleteAlumniBadgeMutation = useMutation({
    mutationFn: async (badgeId: string) => {
      await apiRequest("DELETE", `/api/alumni-badges/${badgeId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/alumni-badges", user?.id] });
    },
  });

  const handleDeleteAlumniBadge = (badgeId: string) => {
    deleteAlumniBadgeMutation.mutate(badgeId);
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

  const unreadNotificationCount = notifications.filter(n => !n.isRead).length;

  // Generate years dynamically based on selected school's founding year
  const currentYear = CURRENT_YEAR;
  const selectedSchoolObj = schools.find(school => school.id === selectedSchool);
  const schoolFoundingYear = selectedSchoolObj?.yearFounded || currentYear;
  
  // Generate years from current year down to school founding year
  const availableYears = Array.from({ length: currentYear - schoolFoundingYear + 1 }, (_, i) => {
    return (currentYear - i).toString();
  });

  // Reset selected year when school changes
  useEffect(() => {
    if (selectedSchool && selectedSchoolObj) {
      // If the current selected year is not available for this school, reset to current year
      if (!availableYears.includes(selectedYear)) {
        setSelectedYear(currentYear.toString());
      }
    } else {
      // If no school is selected, reset year to default
      setSelectedYear(currentYear.toString());
    }
  }, [selectedSchool, selectedSchoolObj, availableYears]);

  if (!user) return null;

  const renderHomeTab = () => (
    <div className="space-y-8">
      {/* School and Year Selectors */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label className="block text-sm font-medium text-gray-700 mb-2">Select School</Label>
          <SearchableSchoolSelect
            schools={schools}
            value={selectedSchool}
            onValueChange={setSelectedSchool}
            placeholder="Search for a school..."
            className="w-full"
          />
        </div>
        <div>
          <Label className="block text-sm font-medium text-gray-700 mb-2">Select Academic Year</Label>
          <Select 
            value={selectedYear} 
            onValueChange={setSelectedYear}
            disabled={!selectedSchool}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={selectedSchool ? "Select academic year" : "Select a school first"} />
            </SelectTrigger>
            <SelectContent>
              {selectedSchool ? (
                availableYears.map(year => (
                  <SelectItem key={year} value={year}>
                    {year} Academic session
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="no-school" disabled>
                  Please select a school first
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center">
        <Button 
          onClick={handleYearbookFinder}
          className="bg-secondary hover:bg-green-700 flex items-center justify-center space-x-2 sm:space-x-3 px-6 sm:px-12 py-6 sm:py-10 text-base sm:text-xl font-bold w-full sm:w-auto"
        >
          <BookOpen className="h-5 w-5 sm:h-6 sm:w-6" />
          <span>Yearbook Finder</span>
        </Button>

        <Button 
          onClick={handleRequestAlumniStatus}
          variant="outline"
          className="border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white flex items-center justify-center space-x-2 sm:space-x-3 px-6 sm:px-12 py-6 sm:py-10 text-base sm:text-xl font-bold w-full sm:w-auto"
        >
          <UserCheck className="h-5 w-5 sm:h-6 sm:w-6" />
          <span>Request Alumni Status</span>
        </Button>
      </div>

      {/* School Info Card */}
      {school && (
        <Card className="shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">{school.name}</h3>
                <p className="text-gray-600">{school.address}</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-secondary">{school.yearFounded}</div>
                <div className="text-sm text-gray-600">Founded</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Events and Memories Gallery */}
      <Card className="shadow-sm">
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">School Memories & Events ({selectedYear})</h3>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Images className="h-4 w-4" />
              <span>
                {memories.filter(m => m.mediaType === 'image').length} Photos, {memories.filter(m => m.mediaType === 'video').length} Videos
              </span>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex flex-wrap space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
            <button 
              onClick={() => setMemoryFilter('all')}
              className={`px-4 py-2 text-sm font-medium rounded-md ${
                memoryFilter === 'all' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              All Events
            </button>
            <button 
              onClick={() => setMemoryFilter('graduation')}
              className={`px-4 py-2 text-sm font-medium rounded-md ${
                memoryFilter === 'graduation' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Graduation
            </button>
            <button 
              onClick={() => setMemoryFilter('sports')}
              className={`px-4 py-2 text-sm font-medium rounded-md ${
                memoryFilter === 'sports' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Sports
            </button>
            <button 
              onClick={() => setMemoryFilter('arts')}
              className={`px-4 py-2 text-sm font-medium rounded-md ${
                memoryFilter === 'arts' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Arts
            </button>
            <button 
              onClick={() => setMemoryFilter('field_trips')}
              className={`px-4 py-2 text-sm font-medium rounded-md ${
                memoryFilter === 'field_trips' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Field Trips
            </button>
            <button 
              onClick={() => setMemoryFilter('academic')}
              className={`px-4 py-2 text-sm font-medium rounded-md ${
                memoryFilter === 'academic' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Academic
            </button>
          </div>

          {/* Simple Photo Preview Grid */}
          {memories.length > 0 ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3">
                {(memoryFilter === 'all' ? memories : memories.filter(m => m.category === memoryFilter))
                  .slice(0, 12)
                  .map((memory, index) => (
                  <div
                    key={memory.id}
                    className="group relative aspect-square rounded-lg overflow-hidden cursor-pointer hover:scale-105 transition-transform duration-200"
                    onClick={() => handleImageClick(memory, index)}
                  >
                    {memory.mediaType === 'image' && memory.imageUrl ? (
                      <img
                        src={memory.imageUrl}
                        alt={memory.title}
                        className="w-full h-full object-cover"
                      />
                    ) : memory.mediaType === 'video' && memory.videoUrl ? (
                      <div className="relative w-full h-full">
                        <video
                          src={memory.videoUrl}
                          className="w-full h-full object-cover"
                          muted
                        />
                        <div className="absolute top-1 right-1 bg-black/60 rounded-full p-0.5">
                          <Video className="h-2 w-2 text-white" />
                        </div>
                      </div>
                    ) : (
                      <img
                        src={memory.imageUrl || '/placeholder-image.jpg'}
                        alt={memory.title}
                        className="w-full h-full object-cover"
                      />
                    )}
                    
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <ZoomIn className="h-4 w-4 text-white" />
                    </div>
                  </div>
                ))}
              </div>
              
              {/* View All Button */}
              {memories.length > 12 && (
                <div className="text-center">
                  <Button
                    onClick={() => setActiveTab("photos")}
                    variant="outline"
                    className="bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-200"
                  >
                    <Images className="h-4 w-4 mr-2" />
                    View All {memories.length} Photos & Videos
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
              <Images className="mx-auto h-8 w-8 text-gray-400 mb-2" />
              <p className="text-gray-600 text-sm">
                {!selectedSchool 
                  ? "Select a school to view memories" 
                  : `No memories available for ${selectedYear} yet.`
                }
              </p>
            </div>
          )}

          {/* Year Selector - Moved to Bottom */}
          <div className="flex items-center justify-center space-x-2 mt-8 pt-6 border-t border-gray-200">
            <label className="text-sm font-medium text-gray-700">Academic Year:</label>
            <Select 
              value={selectedYear} 
              onValueChange={setSelectedYear}
              disabled={!selectedSchool}
            >
              <SelectTrigger className="w-24" data-testid="select-academic-year-bottom">
                <SelectValue placeholder={selectedSchool ? "" : "---"} />
              </SelectTrigger>
              <SelectContent>
                {selectedSchool ? (
                  availableYears.map(year => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-school-bottom" disabled>
                    Select school first
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderProfileTab = () => (
    <div className="space-y-8">
      {/* User Info */}
      <Card className="shadow-sm">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Information</h3>
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-gray-700">Full Name</Label>
              <p className="text-gray-900">{user?.fullName}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700">Email</Label>
              <p className="text-gray-900">{user?.email || "Not provided"}</p>
            </div>
            <div>
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium text-gray-700">Phone Number</Label>
                {!isEditingPhone && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={startEditingPhone}
                    className="ml-2"
                    data-testid="button-edit-phone"
                  >
                    {user?.phoneNumber ? "Edit" : "Add"}
                  </Button>
                )}
              </div>
              {isEditingPhone ? (
                <div className="mt-2 space-y-2">
                  <Input
                    type="tel"
                    value={editingPhoneNumber}
                    onChange={(e) => setEditingPhoneNumber(e.target.value)}
                    placeholder="Enter phone number"
                    className="w-full"
                    data-testid="input-phone-number"
                  />
                  <div className="flex space-x-2">
                    <Button 
                      size="sm" 
                      onClick={handlePhoneNumberUpdate}
                      data-testid="button-save-phone"
                    >
                      Save
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={cancelEditingPhone}
                      data-testid="button-cancel-phone"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-gray-900" data-testid="text-phone-number">
                  {user?.phoneNumber || "Not provided"}
                </p>
              )}
            </div>
            
            {/* Privacy Settings */}
            <div className="border-t border-gray-100 pt-4">
              <Label className="text-sm font-medium text-gray-700 mb-3 block">Privacy Settings</Label>
              <div className={`flex items-center justify-between p-3 rounded-lg ${
                user?.phoneNumber ? 'bg-gray-50' : 'bg-gray-100'
              }`}>
                <div className="flex-1">
                  <p className={`text-sm font-medium ${
                    user?.phoneNumber ? 'text-gray-900' : 'text-gray-500'
                  }`}>Show phone number to alumni</p>
                  <p className={`text-xs ${
                    user?.phoneNumber ? 'text-gray-600' : 'text-gray-400'
                  }`}>
                    {user?.phoneNumber 
                      ? "Allow other alumni from your schools to see your phone number"
                      : "Add a phone number to enable this privacy setting"
                    }
                  </p>
                </div>
                <Switch 
                  checked={user?.phoneNumber ? (user?.showPhoneToAlumni !== false) : false}
                  onCheckedChange={handlePhonePrivacyToggle}
                  disabled={!user?.phoneNumber}
                  className="ml-4"
                  data-testid="switch-phone-privacy"
                />
              </div>
            </div>
            
            {/* Theme Settings */}
            <div className="border-t border-gray-100 pt-4">
              <Label className="text-sm font-medium text-gray-700 mb-3 block">Theme Settings</Label>
              <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Dark Mode</p>
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
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alumni Badges Section */}
      <Card className="shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <Award className="h-5 w-5 text-green-500" />
              <h3 className="text-lg font-semibold text-gray-900">Alumni Badges</h3>
            </div>
            <div className="text-sm text-gray-600">
              {alumniBadges.length} of {maxAlumniBadges} slots used
            </div>
          </div>

          {/* Alumni Badges Grid */}
          <div className="grid grid-cols-1 gap-4 mb-6 sm:grid-cols-2">
            {/* Existing badges */}
            {alumniBadges.map((badge) => (
              <Card key={badge.id} className={`border-2 ${
                badge.status === "verified" 
                  ? "border-green-200 bg-green-50" 
                  : "border-orange-200 bg-orange-50"
              }`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <GraduationCap className={`h-4 w-4 ${
                          badge.status === "verified" ? "text-green-600" : "text-orange-600"
                        }`} />
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          badge.status === "verified"
                            ? "bg-green-100 text-green-800" 
                            : "bg-orange-100 text-orange-800"
                        }`}>
                          {badge.status === "verified" ? "Approved" : "Pending"}
                        </span>
                      </div>
                      <h4 className="font-semibold text-gray-900 text-sm">{badge.school}</h4>
                      <p className="text-sm text-gray-600">Class of {badge.graduationYear}</p>
                      <p className="text-xs text-gray-500">Admitted: {badge.admissionYear}</p>
                    </div>
                    <div className="ml-2">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Alumni Badge?</AlertDialogTitle>
                            <AlertDialogDescription className="space-y-2">
                              <p>Are you sure you want to delete this alumni badge for <strong>{badge.school}</strong>?</p>
                              <div className="bg-amber-50 border border-amber-200 rounded p-3 text-sm">
                                <p className="font-medium text-amber-800 mb-1">⚠️ Important Warning:</p>
                                <ul className="text-amber-700 space-y-1">
                                  <li>• This action is <strong>irreversible</strong></li>
                                
                                  <li>• You will lose your verified/pending status for this school</li>
                                </ul>
                              </div>
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteAlumniBadge(badge.id)}
                              className="bg-red-500 hover:bg-red-600"
                            >
                              Delete Badge
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Empty slots */}
            {Array.from({ length: maxAlumniBadges - alumniBadges.length }).map((_, index) => (
              <Card key={`empty-${index}`} className="border-2 border-dashed border-gray-300 bg-gray-50">
                <CardContent className="p-4 flex items-center justify-center h-24">
                  <div className="text-center text-gray-400">
                    <Plus className="h-6 w-6 mx-auto mb-1" />
                    <p className="text-xs">Empty Slot</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Badge Actions */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-gray-200">
            <Button 
              onClick={handleRequestAlumniStatus}
              disabled={alumniBadges.length >= maxAlumniBadges}
              className="flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Add Alumni Badge</span>
            </Button>

            {alumniBadges.length >= maxAlumniBadges && (
              <Button 
                onClick={handleUpgradeAccount}
                variant="outline"
                className="border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white flex items-center space-x-2"
              >
                <CreditCard className="h-4 w-4" />
                <span>Upgrade for More Slots</span>
              </Button>
            )}
          </div>

          {alumniBadges.length >= maxAlumniBadges && (
            <p className="text-sm text-amber-600 mt-2 bg-amber-50 p-2 rounded">
              ⚠️ You've reached the maximum number of free alumni badges. Upgrade to add more!
            </p>
          )}

          {alumniBadges.length > 0 && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700">
              <p className="font-medium mb-1">💡 Alumni Badge Information:</p>
              <p>Deleting an alumni badge will require a $15 fee for future applications to any school. Consider carefully before removing verified badges.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderLibraryTab = () => {
    // Group purchased yearbooks by school to create school folders/shelves
    const groupedYearbooks = purchasedYearbooks.reduce((acc: any, yearbook: any) => {
      const schoolName = yearbook.school?.name || 'Unknown School';
      if (!acc[schoolName]) {
        acc[schoolName] = [];
      }
      acc[schoolName].push(yearbook);
      return acc;
    }, {});

    const schoolFolders = Object.keys(groupedYearbooks).sort();

    return (
      <div className="space-y-8">
        {/* Library Header */}
        <Card className="shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Library className="h-6 w-6 text-blue-600" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">My Yearbook Library</h3>
                  <p className="text-sm text-gray-600">
                    {purchasedYearbooks.length} purchased yearbook{purchasedYearbooks.length !== 1 ? 's' : ''} 
                    from {schoolFolders.length} school{schoolFolders.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600">${(purchasedYearbooks.length * 4.99).toFixed(2)}</div>
                <div className="text-sm text-gray-600">Total Spent</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* School Folders */}
        {schoolFolders.length === 0 ? (
          <Card className="shadow-sm">
            <CardContent className="p-8 text-center">
              <Library className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Yearbooks Yet</h3>
              <p className="text-gray-600 mb-4">
                Start building your collection by purchasing yearbooks from schools you're interested in.
              </p>
              <Button 
                onClick={() => setActiveTab("home")}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <BookOpen className="h-4 w-4 mr-2" />
                Browse Yearbooks
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {schoolFolders.map((schoolName) => {
              const schoolYearbooks = groupedYearbooks[schoolName];
              const schoolInfo = schoolYearbooks[0]?.school; // Get school info from first yearbook
              
              return (
                <Card key={schoolName} className="shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-6">
                    {/* School Folder Header */}
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="relative">
                        <Folder className="h-8 w-8 text-blue-500" />
                        <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                          {schoolYearbooks.length}
                        </span>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 truncate">{schoolName}</h4>
                        <p className="text-sm text-gray-600">
                          {schoolInfo?.city}, {schoolInfo?.country}
                        </p>
                      </div>
                    </div>

                    {/* Yearbook Years */}
                    <div className="space-y-2 mb-4">
                      {schoolYearbooks
                        .sort((a: any, b: any) => b.year - a.year) // Most recent first
                        .slice(0, expandedSchools.has(schoolName) ? schoolYearbooks.length : 4) // Show all if expanded, otherwise first 4
                        .map((yearbook: any) => (
                        <Button
                          key={`${schoolName}-${yearbook.year}`}
                          variant="ghost"
                          className="w-full flex items-center justify-between p-3 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors duration-200 border border-blue-200 hover:border-blue-300"
                          onClick={() => {
                            // Navigate to yearbook viewer like yearbook finder does
                            const schoolParam = schoolInfo?.id ? `?school=${schoolInfo.id}` : '';
                            setLocation(`/waibuk/${yearbook.year}${schoolParam}`);
                          }}
                          data-testid={`button-library-year-${yearbook.year}`}
                        >
                          <div className="flex items-center space-x-2">
                            <BookOpen className="h-4 w-4 text-blue-600" />
                            <span className="text-sm font-medium text-gray-900">
                              {yearbook.year} Academic Year
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-gray-500">
                              {new Date(yearbook.purchaseDate).toLocaleDateString()}
                            </span>
                            <Eye className="h-4 w-4 text-blue-600" />
                          </div>
                        </Button>
                      ))}
                      
                      {schoolYearbooks.length > 4 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                          onClick={() => {
                            const newExpanded = new Set(expandedSchools);
                            if (expandedSchools.has(schoolName)) {
                              newExpanded.delete(schoolName);
                            } else {
                              newExpanded.add(schoolName);
                            }
                            setExpandedSchools(newExpanded);
                          }}
                          data-testid={`button-expand-${schoolName.replace(/\s+/g, '-').toLowerCase()}`}
                        >
                          <span className="text-sm">
                            {expandedSchools.has(schoolName) 
                              ? "Show Less" 
                              : `Show ${schoolYearbooks.length - 4} More...`
                            }
                          </span>
                        </Button>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-2">
                      <Button 
                        size="sm" 
                        className="flex-1 bg-blue-600 hover:bg-blue-700"
                        onClick={() => {
                          setSelectedSchool(schoolInfo?.id);
                          setActiveTab("home");
                        }}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          const schoolParam = schoolInfo?.id ? `?school=${schoolInfo.id}` : '';
                          setLocation(`/yearbook-finder${schoolParam}`);
                        }}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add More
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const renderPhotosTab = () => {
    // Generate available years for selected school
    const selectedSchoolObj = schools.find(school => school.id === selectedSchool);
    const schoolFoundingYear = selectedSchoolObj?.yearFounded || new Date().getFullYear();
    const currentYear = new Date().getFullYear();
    
    // Generate years from current year down to school founding year
    const years = Array.from({ length: currentYear - schoolFoundingYear + 1 }, (_, i) => {
      return currentYear - i;
    });

    return (
      <div className="space-y-8">
        {/* School and Year Selectors */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label className="block text-sm font-medium text-gray-700 mb-2">Select School</Label>
            <SearchableSchoolSelect
              schools={schools}
              value={selectedSchool}
              onValueChange={setSelectedSchool}
              placeholder="Choose a school to view memories..."
            />
          </div>
          <div>
            <Label className="block text-sm font-medium text-gray-700 mb-2">Academic Year</Label>
            <Select 
              value={selectedYear} 
              onValueChange={setSelectedYear}
              disabled={!selectedSchool}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={!selectedSchool ? "Select school first" : "Choose year"} />
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

      {/* Enhanced Photo Gallery */}
      {selectedSchool && (
        <div className="space-y-6">
          {/* Gallery Header with Stats */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-100">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {schools.find(s => s.id === selectedSchool)?.name} - {selectedYear}
                </h3>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <Images className="h-4 w-4 text-blue-500" />
                    <span className="font-medium">{memories.filter(m => m.mediaType === 'image').length}</span>
                    <span>Photos</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Play className="h-4 w-4 text-green-500" />
                    <span className="font-medium">{memories.filter(m => m.mediaType === 'video').length}</span>
                    <span>Videos</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4 text-purple-500" />
                    <span className="font-medium">{memories.length}</span>
                    <span>Total Memories</span>
                  </div>
                </div>
              </div>
              
              {/* View Mode Toggle */}
              <div className="flex items-center space-x-2 bg-white rounded-lg p-1 border border-gray-200">
                <button 
                  className="px-3 py-1 text-xs font-medium rounded-md bg-blue-500 text-white"
                >
                  Grid View
                </button>
                <button 
                  className="px-3 py-1 text-xs font-medium rounded-md text-gray-600 hover:bg-gray-100"
                >
                  List View
                </button>
              </div>
            </div>
          </div>

          {/* Enhanced Filter Controls */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex flex-wrap gap-2">
                <Label className="text-sm font-medium text-gray-700 mr-2">Filter by category:</Label>
                {['all', 'sports', 'cultural', 'graduation', 'activities', 'academic'].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setMemoryFilter(filter)}
                    className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors ${
                      memoryFilter === filter
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {filter === 'all' ? 'All' : filter.charAt(0).toUpperCase() + filter.slice(1)}
                  </button>
                ))}
              </div>
              
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search memories..."
                  className="pl-10 pr-4 py-2 w-48 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Enhanced Photo Grid */}
          {memories.length > 0 ? (
            <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
              {(memoryFilter === 'all' ? memories : memories.filter(m => m.category === memoryFilter)).map((memory, index) => (
                <div
                  key={memory.id}
                  className="group relative aspect-square rounded-xl overflow-hidden cursor-pointer hover:scale-105 transition-all duration-300 shadow-md hover:shadow-xl border border-gray-100"
                  onClick={() => handleImageClick(memory, index)}
                >
                  {memory.mediaType === 'image' && memory.imageUrl ? (
                    <img
                      src={memory.imageUrl}
                      alt={memory.title}
                      className="w-full h-full object-cover"
                    />
                  ) : memory.mediaType === 'video' && memory.videoUrl ? (
                    <div className="relative w-full h-full">
                      <video
                        src={memory.videoUrl}
                        className="w-full h-full object-cover"
                        muted
                        onMouseEnter={(e) => {
                          if (e.target instanceof HTMLVideoElement) {
                            e.target.play();
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (e.target instanceof HTMLVideoElement) {
                            e.target.pause();
                            e.target.currentTime = 0;
                          }
                        }}
                      />
                      <div className="absolute top-2 right-2 bg-black/60 rounded-full p-1.5">
                        <Video className="h-3 w-3 text-white" />
                      </div>
                    </div>
                  ) : (
                    <img
                      src={memory.imageUrl || '/placeholder-image.jpg'}
                      alt={memory.title}
                      className="w-full h-full object-cover"
                    />
                  )}
                  
                  {/* Enhanced Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                      <h4 className="font-semibold text-sm mb-1 line-clamp-1">{memory.title}</h4>
                      <p className="text-xs opacity-90 mb-1">{memory.eventDate}</p>
                      {memory.category && (
                        <span className="inline-block px-2 py-0.5 bg-blue-500/80 rounded-full text-xs font-medium capitalize">
                          {memory.category.replace('_', ' ')}
                        </span>
                      )}
                    </div>
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                      <div className="bg-white/90 rounded-full p-2">
                        <ZoomIn className="h-5 w-5 text-gray-800" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
              <Images className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No memories found</h3>
              <p className="text-gray-600">
                {!selectedSchool 
                  ? "Please select a school to view memories" 
                  : `No memories available for ${selectedYear} yet.`
                }
              </p>
            </div>
          )}
        </div>
      )}
    </div>
    );
  };

  const renderAlumniTab = () => {
    // Get verified alumni schools for the dropdown
    const verifiedSchools = alumniBadges.filter(badge => badge.status === 'verified');
    
    // Get all graduation years for selected school (1980 to 2026) + "Did not graduate"
    const getGraduationYears = () => {
      if (!selectedAlumniSchool) return [];
      
      // First try to find by ID, then by name as fallback
      const selectedSchoolObj = schools.find(s => s.id === selectedAlumniSchool) || 
                                schools.find(s => s.name === selectedAlumniSchool);
      
      // If school not found, use default range
      const startYear = selectedSchoolObj ? Math.max(1980, selectedSchoolObj.yearFounded) : 1980;
      const endYear = CURRENT_YEAR; // Current academic year
      
      // Generate years in descending order
      const years = Array.from({ length: endYear - startYear + 1 }, (_, i) => {
        return (endYear - i).toString();
      });
      
      // Add "Did not graduate" option
      years.push("did-not-graduate");
      
      return years;
    };

    // Get user's own graduation year for the selected school
    const userGraduationYear = verifiedSchools.find(badge => {
      const school = schools.find(s => s.id === selectedAlumniSchool);
      return school && badge.school === school.name;
    })?.graduationYear;

    // Determine what students to show and how to filter
    let studentsToShow: any[] = [];
    let isUserOwnClass = false;
    
    if (alumniSearchTerm.trim()) {
      // If there's a search term, search across all students from the school
      studentsToShow = allSchoolStudents.filter((student: any) =>
        student.fullName.toLowerCase().includes(alumniSearchTerm.toLowerCase())
      );
    } else {
      // If no search term, show students from selected year
      studentsToShow = yearStudents;
      isUserOwnClass = selectedGraduationYear === userGraduationYear;
    }

    // Determine the label based on whether it's user's own graduation year
    const getStudentLabel = () => {
      if (alumniSearchTerm.trim()) {
        return `${studentsToShow.length} Students Found`;
      }
      if (selectedGraduationYear === "did-not-graduate") {
        return `${studentsToShow.length} Did Not Graduate`;
      }
      if (isUserOwnClass) {
        return `${studentsToShow.length} Classmates`;
      }
      return `${studentsToShow.length} Alumni Accounts`;
    };

    const filteredClassmates = studentsToShow;

    return (
      <div className="space-y-8">
        {/* Alumni Connection Header */}
        <Card className="shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3 mb-6">
              <Users className="h-6 w-6 text-blue-600" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Alumni Network</h3>
                <p className="text-sm text-gray-600">
                  Connect with your former classmates and explore graduating classes
                </p>
              </div>
            </div>

            {/* School and Year Dropdowns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <Label htmlFor="alumni-school">Select Your Alumni School</Label>
                <Select 
                  value={selectedAlumniSchool} 
                  onValueChange={setSelectedAlumniSchool}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a school..." />
                  </SelectTrigger>
                  <SelectContent>
                    {verifiedSchools.map((badge) => {
                      const school = schools.find(s => s.name === badge.school);
                      return school ? (
                        <SelectItem key={school.id} value={school.id}>
                          {badge.school}
                        </SelectItem>
                      ) : (
                        // If school not found in schools list, create a fallback entry
                        <SelectItem key={badge.id} value={badge.school}>
                          {badge.school}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="graduation-year">Graduation Year</Label>
                <Select 
                  value={selectedGraduationYear} 
                  onValueChange={setSelectedGraduationYear}
                  disabled={!selectedAlumniSchool}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose your class year..." />
                  </SelectTrigger>
                  <SelectContent>
                    {getGraduationYears().map((year) => {
                      if (year === "did-not-graduate") {
                        const schoolName = schools.find(s => s.id === selectedAlumniSchool)?.name || "this school";
                        return (
                          <SelectItem key={year} value={year}>
                            I did not graduate from {schoolName}
                          </SelectItem>
                        );
                      }
                      return (
                        <SelectItem key={year} value={year}>
                          Class of {year}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Search for students */}
            {selectedAlumniSchool && (
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search students across all years..."
                  value={alumniSearchTerm}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAlumniSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Students Display */}
        {selectedAlumniSchool && (selectedGraduationYear || alumniSearchTerm.trim()) && (
          <Card className="shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  {alumniSearchTerm.trim() ? "Search Results" : 
                   selectedGraduationYear === "did-not-graduate" ? "Did Not Graduate" : 
                   `Class of ${selectedGraduationYear}`}
                </h3>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Users className="h-4 w-4" />
                  <span>{getStudentLabel()}</span>
                </div>
              </div>

              {/* Students Grid */}
              {filteredClassmates.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">
                    {alumniSearchTerm.trim() ? "No matching students found" : 
                     selectedGraduationYear === "did-not-graduate" ? "No students to show" :
                     "No students found"}
                  </h4>
                  <p className="text-gray-600">
                    {alumniSearchTerm.trim() 
                      ? `No students match "${alumniSearchTerm}" in this school.`
                      : selectedGraduationYear === "did-not-graduate" 
                        ? "This option is for users who did not graduate from the school."
                        : "There are no registered students for this graduating year yet."
                    }
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {filteredClassmates.map((student) => (
                    <Card key={student.id} className="hover:shadow-lg transition-shadow border border-gray-200">
                      <CardContent className="p-6">
                        <div className="flex flex-col space-y-4">
                          {/* Header with Profile Picture and Name */}
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                              {student.profileImage ? (
                                <img 
                                  src={student.profileImage} 
                                  alt={student.fullName} 
                                  className="w-12 h-12 rounded-full object-cover"
                                />
                              ) : (
                                <User className="h-6 w-6 text-gray-500" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-gray-900 text-sm truncate">
                                {student.fullName}
                              </h4>
                              <p className="text-xs text-gray-600">
                                Class of {student.graduationYear}
                              </p>
                            </div>
                          </div>
                          
                          {/* Contact Information Section */}
                          <div className="space-y-3 border-t border-gray-100 pt-4">
                            {/* Email Section */}
                            {(student as any).email && (
                              <div className="flex items-start space-x-2">
                                <Mail className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs text-gray-500 font-medium">Email</p>
                                  <p className="text-sm text-gray-900 truncate">{(student as any).email}</p>
                                </div>
                              </div>
                            )}
                            
                            {/* Mobile Section */}
                            <div className="flex items-start space-x-2">
                              <Phone className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-gray-500 font-medium">Mobile</p>
                                {(student as any).phoneNumber && (student as any).showPhoneToAlumni !== false ? (
                                  <p className="text-sm text-gray-900">{(student as any).phoneNumber}</p>
                                ) : (student as any).phoneNumber && (student as any).showPhoneToAlumni === false ? (
                                  <p className="text-sm text-gray-400 italic">Hidden</p>
                                ) : (
                                  <p className="text-sm text-gray-400 italic">Not provided</p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* No verified alumni message */}
        {verifiedSchools.length === 0 && (
          <Card className="shadow-sm">
            <CardContent className="p-8 text-center">
              <GraduationCap className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Verified Alumni Status</h3>
              <p className="text-gray-600 mb-4">
                You need to have at least one verified alumni badge to access the Alumni network.
              </p>
              <Button 
                onClick={handleRequestAlumniStatus}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <GraduationCap className="h-4 w-4 mr-2" />
                Request Alumni Status
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

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
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                <Eye className="text-white text-xs sm:text-sm" />
              </div>
              <h1 className="ml-2 sm:ml-3 text-sm sm:text-xl font-semibold text-white truncate">Viewer/Alumni Portal</h1>
            </div>

            <div className="flex items-center space-x-1 sm:space-x-4 flex-shrink-0">
              {/* Mobile Circle Status Indicator - Show only on small screens */}
              <div className="sm:hidden relative">
                {accountStatus === "Alumni" ? (
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {alumniBadges.filter(b => b.status === "verified").length}
                  </div>
                ) : (
                  <div className="w-6 h-6 bg-blue-500 rounded-full"></div>
                )}
              </div>
              
              {/* Desktop Account Status Indicator - Hidden on small screens */}
              <div className={`hidden sm:block px-2 sm:px-3 py-1 rounded-full text-xs font-medium ${
                accountStatus === "Alumni" 
                  ? "bg-green-500/20 text-green-200 border border-green-400/30" 
                  : "bg-blue-500/20 text-blue-200 border border-blue-400/30"
              }`}>
                <span className="hidden md:inline">Account Status: </span>{accountStatus}{accountStatus === "Alumni" ? `(${alumniBadges.filter(b => b.status === "verified").length})` : ""}
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
                        notifications.map((notification) => (
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
              
              <span className="hidden sm:block text-sm font-medium text-white">
                {user?.fullName?.split(" ")[0] || "User"}
              </span>
              <Button variant="ghost" size="sm" onClick={handleLogout} className="text-white hover:bg-white/20 p-1 sm:p-2">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs - Moved to top for website-like navigation */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
          <div className="flex gap-0 sm:gap-1 py-2 sm:py-4 overflow-x-auto scrollbar-hide"
               style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <button
              onClick={() => setActiveTab("home")}
              className={`px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-medium border-b-2 flex items-center space-x-1 sm:space-x-2 whitespace-nowrap transition-colors min-w-fit ${
                activeTab === "home" 
                  ? "border-blue-500 text-blue-600 bg-blue-50" 
                  : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
              }`}
            >
              <Home className="h-4 w-4 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Home</span>
            </button>
            <button
              onClick={() => setActiveTab("library")}
              className={`px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-medium border-b-2 flex items-center space-x-1 sm:space-x-2 whitespace-nowrap transition-colors min-w-fit ${
                activeTab === "library" 
                  ? "border-blue-500 text-blue-600 bg-blue-50" 
                  : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
              }`}
            >
              <Library className="h-4 w-4 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Library</span>
            </button>
            <button
              onClick={() => setActiveTab("profile")}
              className={`px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-medium border-b-2 flex items-center space-x-1 sm:space-x-2 whitespace-nowrap transition-colors min-w-fit ${
                activeTab === "profile" 
                  ? "border-blue-500 text-blue-600 bg-blue-50" 
                  : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
              }`}
            >
              <User className="h-4 w-4 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Profile</span>
            </button>

            <button
              onClick={() => setActiveTab("photos")}
              className={`px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-medium border-b-2 flex items-center space-x-1 sm:space-x-2 whitespace-nowrap transition-colors min-w-fit ${
                activeTab === "photos" 
                  ? "border-blue-500 text-blue-600 bg-blue-50" 
                  : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
              }`}
              data-testid="tab-photos"
            >
              <Images className="h-4 w-4 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Photos</span>
            </button>

            {/* Alumni Tab - Only show if user has verified alumni badges */}
            {alumniBadges.some(badge => badge.status === 'verified') && (
              <button
                onClick={() => setActiveTab("alumni")}
                className={`px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-medium border-b-2 flex items-center space-x-1 sm:space-x-2 whitespace-nowrap transition-colors min-w-fit ${
                  activeTab === "alumni" 
                    ? "border-blue-500 text-blue-600 bg-blue-50" 
                    : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
                }`}
                data-testid="tab-alumni"
              >
                <Users className="h-4 w-4 sm:h-4 sm:w-4" />
                <span className="hidden xs:inline">Alumni</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">
            Welcome, {user?.fullName?.split(" ")[0] || "User"}!
          </h2>
          <p className="text-gray-600 mt-2">
            {activeTab === "home" ? "Browse school memories and events" : 
             activeTab === "library" ? "Your purchased yearbooks organized by school" :
             activeTab === "photos" ? "Enhanced photo gallery with advanced viewing options" :
             activeTab === "alumni" ? "Connect with fellow alumni from your graduating class" :
             "Manage your profile and alumni badges"}
          </p>
        </div>

        {/* Tab Content */}
        {activeTab === "home" ? renderHomeTab() : 
         activeTab === "library" ? renderLibraryTab() : 
         activeTab === "photos" ? renderPhotosTab() :
         activeTab === "alumni" ? renderAlumniTab() :
         renderProfileTab()}
      </div>

      {/* Fullscreen Image Viewer */}
      {isModalOpen && selectedImageIndex >= 0 && memories[selectedImageIndex] && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
          {/* Close Button */}
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-4 right-4 z-20 bg-black/50 text-white hover:bg-black/70 rounded-full"
            onClick={closeModal}
          >
            <X className="h-4 w-4" />
          </Button>

          {/* Image Container - True Fullscreen */}
          <div 
            className="relative flex-1 flex items-center justify-center bg-black overflow-hidden cursor-grab"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{ cursor: isDragging ? 'grabbing' : zoomLevel > 1 ? 'grab' : 'default' }}
          >
            <img
              src={memories[selectedImageIndex].imageUrl || memories[selectedImageIndex].videoUrl || ''}
              alt={memories[selectedImageIndex].title}
              className="max-w-full max-h-full object-contain transition-transform duration-200"
              style={{ 
                transform: `scale(${zoomLevel}) translate(${imagePosition.x / zoomLevel}px, ${imagePosition.y / zoomLevel}px)`,
              }}
              draggable={false}
            />

            {/* Zoom Controls */}
            <div className="absolute top-4 left-4 flex flex-col gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="bg-black/50 text-white hover:bg-black/70 rounded-full w-10 h-10 p-0"
                onClick={zoomIn}
                disabled={zoomLevel >= 3}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="bg-black/50 text-white hover:bg-black/70 rounded-full w-10 h-10 p-0"
                onClick={zoomOut}
                disabled={zoomLevel <= 0.5}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="bg-black/50 text-white hover:bg-black/70 rounded-full w-10 h-10 p-0"
                onClick={resetZoom}
                disabled={zoomLevel === 1}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>

            {/* Navigation Buttons */}
            {selectedImageIndex > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white hover:bg-black/70 rounded-full w-12 h-12"
                onClick={navigateToPrevious}
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
            )}

            {selectedImageIndex < memories.length - 1 && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white hover:bg-black/70 rounded-full w-12 h-12"
                onClick={navigateToNext}
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            )}
          </div>

          {/* Bottom Info Bar */}
          <div className="bg-black/90 text-white px-6 py-4 flex items-center justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-semibold">{memories[selectedImageIndex].title}</h3>
              <p className="text-sm text-gray-300 mt-1">{memories[selectedImageIndex].description}</p>
              <div className="flex items-center space-x-4 mt-2 text-xs text-gray-400">
                <span className="flex items-center space-x-1">
                  <Calendar className="h-3 w-3" />
                  <span>{memories[selectedImageIndex].eventDate}</span>
                </span>
                {memories[selectedImageIndex].category && (
                  <span className="capitalize">{memories[selectedImageIndex].category.replace('_', ' ')}</span>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-xs text-gray-400 ml-4 flex-shrink-0">
                {selectedImageIndex + 1} of {memories.length}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  );
}