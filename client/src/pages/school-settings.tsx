import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, User, CreditCard, Bell, Shield, Menu, Eye, EyeOff, Edit, Check, X, LogOut, MenuIcon } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useCurrency, Currency } from "@/contexts/CurrencyContext";
import type { User as UserType } from "@shared/schema";

export default function SchoolSettings() {
  const [, setLocation] = useLocation();
  const [user, setUser] = useState<UserType | null>(null);
  const [activeTab, setActiveTab] = useState("profile");
  const [showHamburgerMenu, setShowHamburgerMenu] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const { toast } = useToast();
  const { userCurrency, setUserCurrency, formatPrice } = useCurrency();

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    email: "",
    username: "",
    fullName: "",
    schoolName: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Individual field editing states
  const [editingField, setEditingField] = useState<string | null>(null);
  const [tempValues, setTempValues] = useState({
    email: "",
    username: "",
    fullName: "",
    schoolName: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      setLocation("/");
      return;
    }
    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);
    
    // Initialize profile form with current user data
    setProfileForm(prev => ({
      ...prev,
      email: parsedUser.email || "",
      username: parsedUser.username || "",
      fullName: parsedUser.fullName || "",
      schoolName: parsedUser.schoolName || ""
    }));
  }, [setLocation]);

  const handleBackClick = () => {
    setLocation("/school-dashboard");
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    setLocation("/");
  };

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!user) throw new Error("No user found");
      
      const response = await apiRequest("PATCH", `/api/users/${user.id}`, data);
      return response.json();
    },
    onSuccess: (updatedUser) => {
      // Update localStorage
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);
      
      // Update form state
      setProfileForm(prev => ({
        ...prev,
        email: updatedUser.email || "",
        username: updatedUser.username || "",
        fullName: updatedUser.fullName || "",
        schoolName: updatedUser.fullName || ""
      }));
      
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
      
      // Reset editing state
      setEditingField(null);
      setIsUpdatingProfile(false);
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
      setIsUpdatingProfile(false);
    }
  });

  const handleSaveField = (field: string) => {
    if (!user) return;
    
    const value = tempValues[field as keyof typeof tempValues];
    if (!value.trim()) {
      toast({
        title: "Invalid input",
        description: "Field cannot be empty",
        variant: "destructive",
      });
      return;
    }

    setIsUpdatingProfile(true);
    updateProfileMutation.mutate({ [field]: value });
  };

  const handleCancelEdit = (field: string) => {
    setEditingField(null);
    setTempValues(prev => ({
      ...prev,
      [field]: profileForm[field as keyof typeof profileForm]
    }));
  };

  const startEditing = (field: string) => {
    setEditingField(field);
    setTempValues(prev => ({
      ...prev,
      [field]: profileForm[field as keyof typeof profileForm]
    }));
  };

  const renderProfileTab = () => (
    <div className="space-y-4 sm:space-y-6 max-w-4xl">
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-lg sm:text-xl">School Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6 pt-0">
          {/* School Name Field */}
          <div className="grid gap-2">
            <Label htmlFor="schoolName" data-testid="label-school-name" className="text-sm font-medium">School Name</Label>
            <div className="flex items-center gap-2">
              {editingField === "schoolName" ? (
                <>
                  <Input
                    id="schoolName"
                    value={tempValues.schoolName}
                    onChange={(e) => setTempValues(prev => ({ ...prev, schoolName: e.target.value }))}
                    className="flex-1 h-10 sm:h-11"
                    data-testid="input-school-name-edit"
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleSaveField("schoolName")}
                    disabled={isUpdatingProfile}
                    data-testid="button-save-school-name"
                    className="h-10 w-10 sm:h-11 sm:w-11 flex-shrink-0"
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleCancelEdit("schoolName")}
                    disabled={isUpdatingProfile}
                    data-testid="button-cancel-school-name"
                    className="h-10 w-10 sm:h-11 sm:w-11 flex-shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <>
                  <Input
                    id="schoolName"
                    value={profileForm.schoolName}
                    readOnly
                    className="flex-1 bg-gray-50 h-10 sm:h-11"
                    data-testid="input-school-name"
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => startEditing("schoolName")}
                    data-testid="button-edit-school-name"
                    className="h-10 w-10 sm:h-11 sm:w-11 flex-shrink-0 touch-manipulation"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Administrator Name Field */}
          <div className="grid gap-2">
            <Label htmlFor="fullName" data-testid="label-full-name" className="text-sm font-medium">Administrator Name</Label>
            <div className="flex items-center gap-2">
              {editingField === "fullName" ? (
                <>
                  <Input
                    id="fullName"
                    value={tempValues.fullName}
                    onChange={(e) => setTempValues(prev => ({ ...prev, fullName: e.target.value }))}
                    className="flex-1 h-10 sm:h-11"
                    data-testid="input-full-name-edit"
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleSaveField("fullName")}
                    disabled={isUpdatingProfile}
                    data-testid="button-save-full-name"
                    className="h-10 w-10 sm:h-11 sm:w-11 flex-shrink-0"
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleCancelEdit("fullName")}
                    disabled={isUpdatingProfile}
                    data-testid="button-cancel-full-name"
                    className="h-10 w-10 sm:h-11 sm:w-11 flex-shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <>
                  <Input
                    id="fullName"
                    value={profileForm.fullName}
                    readOnly
                    className="flex-1 bg-gray-50 h-10 sm:h-11"
                    data-testid="input-full-name"
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => startEditing("fullName")}
                    data-testid="button-edit-full-name"
                    className="h-10 w-10 sm:h-11 sm:w-11 flex-shrink-0 touch-manipulation"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Username Field */}
          <div className="grid gap-2">
            <Label htmlFor="username" data-testid="label-username" className="text-sm font-medium">Username</Label>
            <div className="flex items-center gap-2">
              {editingField === "username" ? (
                <>
                  <Input
                    id="username"
                    value={tempValues.username}
                    onChange={(e) => setTempValues(prev => ({ ...prev, username: e.target.value }))}
                    className="flex-1 h-10 sm:h-11"
                    data-testid="input-username-edit"
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleSaveField("username")}
                    disabled={isUpdatingProfile}
                    data-testid="button-save-username"
                    className="h-10 w-10 sm:h-11 sm:w-11 flex-shrink-0"
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleCancelEdit("username")}
                    disabled={isUpdatingProfile}
                    data-testid="button-cancel-username"
                    className="h-10 w-10 sm:h-11 sm:w-11 flex-shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <>
                  <Input
                    id="username"
                    value={profileForm.username}
                    readOnly
                    className="flex-1 bg-gray-50 h-10 sm:h-11"
                    data-testid="input-username"
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => startEditing("username")}
                    data-testid="button-edit-username"
                    className="h-10 w-10 sm:h-11 sm:w-11 flex-shrink-0 touch-manipulation"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Email Field */}
          <div className="grid gap-2">
            <Label htmlFor="email" data-testid="label-email" className="text-sm font-medium">Email</Label>
            <div className="flex items-center gap-2">
              {editingField === "email" ? (
                <>
                  <Input
                    id="email"
                    type="email"
                    value={tempValues.email}
                    onChange={(e) => setTempValues(prev => ({ ...prev, email: e.target.value }))}
                    className="flex-1 h-10 sm:h-11"
                    data-testid="input-email-edit"
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleSaveField("email")}
                    disabled={isUpdatingProfile}
                    data-testid="button-save-email"
                    className="h-10 w-10 sm:h-11 sm:w-11 flex-shrink-0"
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleCancelEdit("email")}
                    disabled={isUpdatingProfile}
                    data-testid="button-cancel-email"
                    className="h-10 w-10 sm:h-11 sm:w-11 flex-shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <>
                  <Input
                    id="email"
                    type="email"
                    value={profileForm.email}
                    readOnly
                    className="flex-1 bg-gray-50 h-10 sm:h-11"
                    data-testid="input-email"
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => startEditing("email")}
                    data-testid="button-edit-email"
                    className="h-10 w-10 sm:h-11 sm:w-11 flex-shrink-0 touch-manipulation"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-lg sm:text-xl">Revenue Settings</CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          <div className="space-y-4">
            <p className="text-xs sm:text-sm text-muted-foreground">
              Manage your school's revenue sharing and payment settings.
            </p>
            <Button 
              variant="outline" 
              onClick={() => setLocation("/revenue-sharing-setup")}
              data-testid="button-revenue-sharing"
              className="h-10 sm:h-11 touch-manipulation"
            >
              Configure Revenue Sharing
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case "profile":
        return renderProfileTab();
      default:
        return renderProfileTab();
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 shadow-sm border-b border-gray-200 relative">
        <div className="flex items-center justify-between p-3 sm:p-4 relative z-10">
          <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBackClick}
              className="text-white hover:bg-white/20 flex-shrink-0"
              data-testid="button-back"
            >
              <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
            
            {/* Mobile sidebar toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowSidebar(!showSidebar)}
              className="text-white hover:bg-white/20 lg:hidden flex-shrink-0"
              data-testid="button-sidebar-toggle"
            >
              <MenuIcon className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
            
            <h1 className="text-lg sm:text-xl font-semibold text-white truncate">School Settings</h1>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
            <span className="text-xs sm:text-sm font-medium text-white truncate max-w-24 sm:max-w-none" data-testid="text-user-name">
              <span className="hidden sm:inline">{user.fullName || user.username}</span>
              <span className="sm:hidden">{(user.fullName || user.username)?.split(" ")[0]}</span>
            </span>
            
            {/* Hamburger Menu */}
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowHamburgerMenu(!showHamburgerMenu)}
                className="text-white hover:bg-white/20 w-8 h-8 sm:w-10 sm:h-10"
                data-testid="button-hamburger-menu"
              >
                <Menu className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>

              {showHamburgerMenu && (
                <div className="absolute right-0 top-10 sm:top-12 w-44 sm:w-48 bg-white rounded-lg shadow-xl border border-gray-200 z-[9999]">
                  <div className="py-1">
                    <button
                      className="flex items-center w-full px-3 sm:px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => {
                        setShowHamburgerMenu(false);
                        handleLogout();
                      }}
                      data-testid="menu-logout"
                    >
                      <LogOut className="h-4 w-4 mr-2 sm:mr-3" />
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {showSidebar && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setShowSidebar(false)}
        />
      )}

      <div className="flex">
        {/* Left Sidebar - Desktop */}
        <div className="hidden lg:block w-64 min-h-screen bg-card border-r border-border">
          <div className="p-4">
            <nav className="space-y-2">
              <button
                onClick={() => setActiveTab("profile")}
                className={`flex items-center w-full px-3 py-2 text-left rounded-md transition-colors ${
                  activeTab === "profile"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
                data-testid="tab-profile"
              >
                <User className="h-4 w-4 mr-2" />
                School Profile
              </button>
            </nav>
          </div>
        </div>

        {/* Mobile Sidebar */}
        <div className={`fixed top-0 left-0 h-full w-64 bg-card border-r border-border z-50 transform transition-transform duration-300 ease-in-out lg:hidden ${
          showSidebar ? 'translate-x-0' : '-translate-x-full'
        }`}>
          <div className="p-4 pt-20">
            <nav className="space-y-2">
              <button
                onClick={() => {
                  setActiveTab("profile");
                  setShowSidebar(false);
                }}
                className={`flex items-center w-full px-3 py-3 text-left rounded-md transition-colors touch-manipulation ${
                  activeTab === "profile"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
                data-testid="tab-profile-mobile"
              >
                <User className="h-5 w-5 mr-3" />
                School Profile
              </button>
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <div className="p-4 sm:p-6">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
}