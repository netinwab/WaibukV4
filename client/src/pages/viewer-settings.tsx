import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, User, CreditCard, Bell, Shield, Menu, Eye, EyeOff, Edit, Check, X, Settings, ShoppingCart, LogOut, MenuIcon } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useCurrency, Currency } from "@/contexts/CurrencyContext";
import type { User as UserType, AlumniBadge, Notification } from "@shared/schema";

export default function ViewerSettings() {
  const [, setLocation] = useLocation();
  const [user, setUser] = useState<UserType | null>(null);
  const [activeTab, setActiveTab] = useState("profile");
  const [showHamburgerMenu, setShowHamburgerMenu] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const { toast } = useToast();
  const { userCurrency, setUserCurrency, formatPrice } = useCurrency();

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    email: "",
    username: "",
    fullName: "",
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
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  // Fetch alumni badges for account status
  const { data: alumniBadges = [] } = useQuery<AlumniBadge[]>({
    queryKey: ['/api/alumni-badges'],
    enabled: !!user
  });

  // Fetch notifications
  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ['/api/notifications', user?.id],
    enabled: !!user
  });

  const unreadNotificationCount = notifications.filter(n => !n.isRead).length;

  // Mark notification as read mutation
  const markNotificationReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      await apiRequest("PATCH", `/api/notifications/${notificationId}`, { isRead: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications', user?.id] });
    }
  });

  const handleMarkNotificationRead = (notificationId: string) => {
    markNotificationReadMutation.mutate(notificationId);
  };

  // Determine account status
  const accountStatus = alumniBadges.filter(badge => badge.status === "verified").length > 0 ? "Alumni" : "Viewer";

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
      fullName: parsedUser.fullName || ""
    }));
  }, [setLocation]);

  const handleBackClick = () => {
    setLocation("/viewer-dashboard");
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
        fullName: updatedUser.fullName || ""
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
          <CardTitle className="text-lg sm:text-xl">Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6 pt-0">
          {/* Full Name Field */}
          <div className="grid gap-2">
            <Label htmlFor="fullName" data-testid="label-full-name" className="text-sm font-medium">Full Name</Label>
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
          <CardTitle className="text-lg sm:text-xl">Currency Preference</CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          <div className="grid gap-3">
            <Label htmlFor="currency" className="text-sm font-medium">Preferred Currency</Label>
            <Select value={userCurrency} onValueChange={(value: Currency) => setUserCurrency(value)}>
              <SelectTrigger className="h-10 sm:h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD ($)</SelectItem>
                <SelectItem value="NGN">NGN (₦)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Prices will be displayed in your preferred currency.
            </p>
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
      {/* Header - Match viewer-dashboard structure */}
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
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBackClick}
                className="text-white hover:bg-white/20 flex-shrink-0 mr-2"
                data-testid="button-back"
              >
                <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
              
              {/* Mobile sidebar toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowSidebar(!showSidebar)}
                className="text-white hover:bg-white/20 lg:hidden flex-shrink-0 mr-2"
                data-testid="button-sidebar-toggle"
              >
                <MenuIcon className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
              
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                <Settings className="text-white text-xs sm:text-sm" />
              </div>
              <h1 className="ml-2 sm:ml-3 text-sm sm:text-xl font-semibold text-white truncate">Settings</h1>
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
                {user?.fullName || "User"}
              </span>
              
              {/* Hamburger Menu */}
              <div className="relative">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowHamburgerMenu(!showHamburgerMenu)}
                  className="text-white hover:bg-white/20 p-1 sm:p-2"
                  data-testid="button-hamburger-menu"
                >
                  <Menu className="h-4 w-4" />
                </Button>
                
                {/* Hamburger Menu Dropdown */}
                {showHamburgerMenu && (
                  <div 
                    className="hamburger-dropdown fixed top-16 right-4 w-48 bg-white rounded-lg shadow-xl border border-gray-200 z-[99999]"
                    style={{ display: 'block', visibility: 'visible' }}
                  >
                    <div className="py-1">
                      <button
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => {
                          setShowHamburgerMenu(false);
                          setLocation("/viewer-settings");
                        }}
                        data-testid="menu-settings"
                      >
                        <Settings className="h-4 w-4 mr-3" />
                        Settings
                      </button>
                      <button
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => {
                          setShowHamburgerMenu(false);
                          setLocation("/cart");
                        }}
                        data-testid="menu-cart"
                      >
                        <ShoppingCart className="h-4 w-4 mr-3" />
                        Cart
                      </button>
                      <div className="border-t border-gray-100"></div>
                      <button
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => {
                          setShowHamburgerMenu(false);
                          handleLogout();
                        }}
                        data-testid="menu-logout"
                      >
                        <LogOut className="h-4 w-4 mr-3" />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

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
                Profile
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
                Profile
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