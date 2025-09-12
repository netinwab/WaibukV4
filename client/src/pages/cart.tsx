import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2, ShoppingCart, ArrowLeft, BookOpen, Menu, Settings, LogOut, Bell, X } from "lucide-react";
import type { CartItem, School, Notification, AlumniBadge } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { CheckoutSection } from "@/components/CheckoutSection";

export default function Cart() {
  const [, setLocation] = useLocation();
  const [user, setUser] = useState<any>(null);
  const [showHamburgerMenu, setShowHamburgerMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const { toast } = useToast();

  // Fetch user's cart items
  const { data: cartItems = [], isLoading } = useQuery<CartItem[]>({
    queryKey: ["/api/cart", user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (!user?.id) return [];
      const res = await fetch(`/api/cart/${user.id}`);
      if (!res.ok) throw new Error("Failed to fetch cart items");
      return res.json();
    }
  });

  // Fetch schools for cart items to display school names
  const { data: schools = [] } = useQuery<School[]>({
    queryKey: ["/api/schools"],
    queryFn: async () => {
      const res = await fetch("/api/schools");
      if (!res.ok) throw new Error("Failed to fetch schools");
      return res.json();
    }
  });

  // Fetch notifications (only for non-school accounts)
  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ['/api/notifications', user?.id],
    enabled: !!user && user?.userType !== "school"
  });

  // Fetch alumni badges for account status (only for viewer accounts)
  const { data: alumniBadges = [] } = useQuery<AlumniBadge[]>({
    queryKey: ['/api/alumni-badges'],
    enabled: !!user && user?.userType === "viewer"
  });

  const unreadNotificationCount = notifications.filter(n => !n.isRead).length;
  const accountStatus = alumniBadges.length > 0 ? "Alumni" : "Student";

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

  // Remove item from cart mutation with optimistic updates
  const removeItemMutation = useMutation({
    mutationFn: async (cartItemId: string) => {
      await apiRequest("DELETE", `/api/cart/${cartItemId}`);
    },
    onMutate: async (cartItemId) => {
      // Cancel any outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: ["/api/cart", user?.id] });

      // Snapshot the previous value
      const previousCartItems = queryClient.getQueryData<CartItem[]>(["/api/cart", user?.id]);

      // Optimistically remove the item
      queryClient.setQueryData<CartItem[]>(["/api/cart", user?.id], (old = []) =>
        old.filter(item => item.id !== cartItemId)
      );

      // Show immediate success feedback
      toast({
        title: "Item removed! 🗑️",
        description: "Yearbook has been removed from your cart."
      });

      // Return a context object with the snapshotted value
      return { previousCartItems, removedItemId: cartItemId };
    },
    onError: (error, cartItemId, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      queryClient.setQueryData(["/api/cart", user?.id], context?.previousCartItems || []);
      
      toast({
        title: "Failed to remove item",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    },
    onSuccess: () => {
      // Refresh the cart data to ensure consistency
      queryClient.invalidateQueries({ queryKey: ["/api/cart", user?.id] });
    }
  });

  // Clear cart mutation with optimistic updates
  const clearCartMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/cart/clear/${user?.id}`);
    },
    onMutate: async () => {
      // Cancel any outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: ["/api/cart", user?.id] });

      // Snapshot the previous value
      const previousCartItems = queryClient.getQueryData<CartItem[]>(["/api/cart", user?.id]);

      // Optimistically clear the cart
      queryClient.setQueryData<CartItem[]>(["/api/cart", user?.id], []);

      // Show immediate success feedback
      toast({
        title: "Cart cleared! 🧹",
        description: "All items have been removed from your cart."
      });

      // Return a context object with the snapshotted value
      return { previousCartItems };
    },
    onError: (error, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      queryClient.setQueryData(["/api/cart", user?.id], context?.previousCartItems || []);
      
      toast({
        title: "Failed to clear cart",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    },
    onSuccess: () => {
      // Refresh the cart data to ensure consistency
      queryClient.invalidateQueries({ queryKey: ["/api/cart", user?.id] });
    }
  });

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      setLocation("/");
      return;
    }
    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);

    // Check for payment status in URL
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get("payment");
    const reference = urlParams.get("reference");

    if (paymentStatus === "success" && reference) {
      toast({
        title: "Payment successful! 🎉",
        description: `Your payment has been processed successfully. Updating your library...`
      });
      
      // Force refresh all related queries to show updated data
      queryClient.invalidateQueries({ queryKey: ["/api/cart", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/year-purchases"] });
      queryClient.invalidateQueries({ queryKey: ["/api/viewer-purchases"] });
      
      // Clear stored payment reference since it's successful
      localStorage.removeItem('lastPaymentReference');
      
      // Clean up URL params
      window.history.replaceState({}, document.title, window.location.pathname);
      
      // Show additional success feedback
      setTimeout(() => {
        toast({
          title: "Library updated! ✅",
          description: "Your new yearbooks are now available in your library."
        });
      }, 1500);
    } else if (paymentStatus === "failed" && reference) {
      toast({
        title: "Payment failed ❌",
        description: `Your payment could not be processed. Reference: ${reference}. Please try again or contact support.`,
        variant: "destructive"
      });
      // Clean up URL params
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [setLocation, toast]);

  const handleRemoveItem = (cartItemId: string) => {
    removeItemMutation.mutate(cartItemId);
  };

  const handleClearCart = () => {
    if (cartItems.length === 0) return;
    clearCartMutation.mutate();
  };

  const handleBackToDashboard = () => {
    if (user?.userType === "school") {
      setLocation("/school-dashboard");
    } else {
      setLocation("/viewer-dashboard");
    }
  };

  const handleContinueShopping = () => {
    if (user?.userType === "school") {
      setLocation("/school-dashboard");
    } else {
      setLocation("/yearbook-finder");
    }
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => total + parseFloat(item.price || "0"), 0);
  };

  const getSchoolName = (schoolId: string) => {
    const school = schools.find(s => s.id === schoolId);
    return school?.name || "Unknown School";
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
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleBackToDashboard}
                  className="text-white hover:bg-white/20 flex-shrink-0 mr-2"
                  data-testid="button-back"
                >
                  <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
                
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <ShoppingCart className="text-white text-xs sm:text-sm" />
                </div>
                <h1 className="ml-2 sm:ml-3 text-sm sm:text-xl font-semibold text-white truncate">Shopping Cart</h1>
              </div>

              <div className="flex items-center space-x-1 sm:space-x-4 flex-shrink-0">
                {/* Conditional Account Status and Notifications - Only show for viewer accounts */}
                {user?.userType === "viewer" && (
                  <>
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
                  </>
                )}
                
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
                            // Route to user-type specific settings page
                            if (user?.userType === "school") {
                              setLocation("/school-settings");
                            } else {
                              setLocation("/viewer-settings");
                            }
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
                            localStorage.removeItem("user");
                            setLocation("/");
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

        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8">
          {/* Navigation */}
          <div className="mb-4 sm:mb-8 flex flex-col sm:flex-row gap-2 sm:gap-4">
            <Button 
              onClick={handleBackToDashboard}
              variant="outline"
              className="flex items-center space-x-2 text-sm"
              size="sm"
              data-testid="button-back-dashboard"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Dashboard</span>
            </Button>
          </div>

          {/* Cart Content */}
          <Card className="shadow-sm">
            <CardContent className="p-3 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-0">
                  Your Cart ({cartItems.length} items)
                </h2>
                
                {cartItems.length > 0 && (
                  <Button 
                    onClick={handleClearCart}
                    variant="outline"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    size="sm"
                    disabled={clearCartMutation.isPending}
                    data-testid="button-clear-cart"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear Cart
                  </Button>
                )}
              </div>

              {isLoading ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Loading cart items...</p>
                </div>
              ) : cartItems.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingCart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Your cart is empty</h3>
                  <p className="text-gray-500 mb-4">Browse yearbooks and add them to your cart to get started.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Cart Items */}
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">
                          {getSchoolName(item.schoolId)} - Class of {item.year}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Digital Yearbook Access
                        </p>
                        <p className="text-sm font-semibold text-blue-600 mt-1">
                          ${parseFloat(item.price || "0").toFixed(2)}
                        </p>
                      </div>
                      
                      <Button
                        onClick={() => handleRemoveItem(item.id)}
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        disabled={removeItemMutation.isPending}
                        data-testid={`button-remove-${item.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}

                  {/* Cart Summary */}
                  <div className="border-t pt-4 mt-6">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-lg font-semibold text-gray-900">
                        Total: ${calculateTotal().toFixed(2)}
                      </span>
                    </div>
                    
                    <CheckoutSection 
                      cartItems={cartItems} 
                      total={calculateTotal()} 
                      userType={user?.userType || "viewer"}
                      onContinueShopping={handleContinueShopping}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}