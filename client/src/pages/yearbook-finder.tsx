import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Eye, LogOut, BookOpen, Calendar, GraduationCap, Search, MapPin, Building, ShoppingCart, Grid3X3, List } from "lucide-react";
import type { School, AlumniBadge } from "@shared/schema";
import { CheckoutOverlay } from "@/components/CheckoutOverlay";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { CURRENT_YEAR } from "@shared/constants";

export default function YearbookFinder() {
  const [, setLocation] = useLocation();
  const [user, setUser] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSchoolId, setSelectedSchoolId] = useState("");
  const [showCheckout, setShowCheckout] = useState(false);
  const [selectedYearForPurchase, setSelectedYearForPurchase] = useState<string>("");
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const { toast } = useToast();

  const currentYear = CURRENT_YEAR;
  
  // Get school parameter from URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const schoolParam = urlParams.get('school');
    if (schoolParam) {
      setSelectedSchoolId(schoolParam);
    }
  }, []);

  // Fetch user's alumni badges to determine account status
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

  // Fetch school data if schoolId is provided
  const { data: selectedSchool } = useQuery<School>({
    queryKey: ["/api/schools", selectedSchoolId],
    enabled: !!selectedSchoolId,
  });

  const accountStatus = alumniBadges.length > 0 ? "Alumni" : "Viewer";
  
  // Find alumni info for the selected school
  const alumniInfo = selectedSchool ? alumniBadges.find(badge => 
    badge.school === selectedSchool.name
  ) : null;

  // Fetch viewer's purchased years
  const { data: viewerPurchases = [] } = useQuery({
    queryKey: ["/api/viewer-year-purchases", user?.id, selectedSchoolId],
    enabled: !!user && !!selectedSchoolId,
    queryFn: async () => {
      if (!user?.id || !selectedSchoolId) return [];
      const res = await fetch(`/api/viewer-year-purchases/${user.id}/${selectedSchoolId}`);
      if (!res.ok) return [];
      return res.json();
    },
  });

  // Fetch school's purchased years to check availability
  const { data: schoolPurchasedYears = [] } = useQuery({
    queryKey: ["/api/year-purchases/school", selectedSchoolId],
    enabled: !!selectedSchoolId,
    queryFn: async () => {
      if (!selectedSchoolId) return [];
      const res = await fetch(`/api/year-purchases/school/${selectedSchoolId}`);
      if (!res.ok) return [];
      return res.json();
    },
  });

  // Check which years have published yearbooks (for viewers to access)
  const { data: publishedYearbooks = [] } = useQuery({
    queryKey: ["/api/published-yearbooks-list", selectedSchoolId],
    enabled: !!selectedSchoolId,
    staleTime: 0, // Force fresh data
    cacheTime: 0, // Don't cache
    queryFn: async () => {
      if (!selectedSchoolId) return [];
      const res = await fetch(`/api/published-yearbooks-list/${selectedSchoolId}?t=${Date.now()}`);
      if (!res.ok) return [];
      return res.json();
    },
  });

  // Generate years from school's founding year to current year
  const schoolFoundingYear = selectedSchool?.yearFounded || 1980;
  const startYear = Math.max(1980, schoolFoundingYear);
  const endYear = currentYear; // Show years up to current year
  
  const years = Array.from({ length: endYear - startYear + 1 }, (_, i) => {
    const year = endYear - i;
    
    // Check if this year has been published by the school
    const isPublished = publishedYearbooks.some((p: any) => p.year === year && p.isPublished);
    
    // Check if this year has been purchased by this viewer for this school
    const viewerYearPurchase = viewerPurchases.find((p: any) => p.year === year && p.schoolId === selectedSchoolId);
    const viewerPurchased = !!viewerYearPurchase?.purchased;
    
    // Simplified logic: viewers only care about published vs not published
    const accessible = isPublished && viewerPurchased;
    const canPurchase = isPublished && !viewerPurchased;
    
    return {
      year,
      purchased: viewerPurchased,
      isPublished,
      price: 4.99, // Viewers pay $4.99 per year
      accessible,
      canPurchase,
      status: viewerPurchased ? 'Purchased' : (isPublished ? 'Published' : 'Not Published')
    };
  });

  // Filter years based on search term
  const filteredYears = years.filter(yearData => 
    yearData.year.toString().includes(searchTerm)
  );

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

  const handleYearSelect = (yearData: any) => {
    if (!yearData.accessible && yearData.canPurchase) {
      // Only allow purchase if school has already purchased this year
      setSelectedYearForPurchase(yearData.year.toString());
      setShowCheckout(true);
      return;
    }
    
    if (!yearData.accessible && !yearData.canPurchase) {
      // Simplified message - just tell them it's not published
      toast({
        title: "Yearbook not published",
        description: "This yearbook has not been published by the school yet.",
        variant: "destructive",
      });
      return;
    }
    
    // Include school parameter if available
    const schoolParam = selectedSchoolId ? `?school=${selectedSchoolId}` : '';
    setLocation(`/waibuk/${yearData.year}${schoolParam}`);
  };

  const handleConfirmPurchase = async (year: string) => {
    try {
      // Create or update viewer year purchase
      const yearNum = parseInt(year);
      let existingPurchase = viewerPurchases.find((p: any) => p.year === yearNum && p.schoolId === selectedSchoolId);
      
      if (!existingPurchase) {
        // Create new viewer year purchase record
        const purchaseData = {
          userId: user?.id || "",
          schoolId: selectedSchoolId || "",
          year: yearNum,
          purchased: true,
          price: "4.99",
          purchaseDate: new Date()
        };
        
        await apiRequest("POST", "/api/viewer-year-purchases", purchaseData);
      } else {
        // Update existing record to purchased
        await apiRequest("PATCH", `/api/viewer-year-purchases/${existingPurchase.id}`, {
          purchased: true
        });
      }
      
      // Invalidate cache to refresh the UI
      queryClient.invalidateQueries({ queryKey: ["/api/viewer-year-purchases", user?.id, selectedSchoolId] });
      
      toast({ 
        title: "Purchase successful!", 
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
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                <BookOpen className="text-white text-xs sm:text-sm" />
              </div>
              <h1 className="ml-2 sm:ml-3 text-sm sm:text-xl font-semibold text-white truncate">Yearbook Finder</h1>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-4">
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
              
              <span className="text-xs sm:text-sm font-medium text-white truncate">
                {user.fullName.split(" ")[0]}
              </span>
              <Button variant="ghost" size="sm" onClick={handleLogout} className="text-white hover:bg-white/20 p-1 sm:p-2">
                <LogOut className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8">
        {/* Welcome Section */}
        <div className="mb-4 sm:mb-8">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
            {selectedSchool ? `${selectedSchool.name} Yearbooks` : "Browse Yearbooks by Year"}
          </h2>
          <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">
            {selectedSchool 
              ? `Explore memories and moments from ${selectedSchool.name}` 
              : "Select a year to view available yearbooks and memories"
            }
          </p>

          {/* School Information */}
          {selectedSchool && (
            <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-gray-50 rounded-lg border">
              <div className="flex items-start space-x-2 sm:space-x-3">
                <Building className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600 mt-0.5 flex-shrink-0" />
                <div className="space-y-1 sm:space-y-2 min-w-0 flex-1">
                  <h3 className="text-sm sm:text-base font-semibold text-gray-900 break-words">{selectedSchool.name}</h3>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 text-xs sm:text-sm text-gray-600 space-y-1 sm:space-y-0">
                    <div className="flex items-center space-x-1">
                      <MapPin className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                      <span className="break-words">{selectedSchool.city}, {selectedSchool.country}</span>
                    </div>
                    <span className="hidden sm:inline">•</span>
                    <span>Founded {selectedSchool.yearFounded}</span>
                  </div>
                  {selectedSchool.address && (
                    <p className="text-xs sm:text-sm text-gray-600 break-words">{selectedSchool.address}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Alumni Graduation Info */}
          {accountStatus === "Alumni" && alumniInfo && (
            <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 mt-2 sm:mt-3 text-green-700">
              <div className="flex items-center space-x-2">
                <GraduationCap className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="text-xs sm:text-sm font-medium break-words">
                  {selectedSchool?.name || "Unknown School"} Class of {alumniInfo.graduationYear}
                </span>
              </div>
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full self-start sm:self-auto">
                {alumniInfo.status === 'verified' ? 'Verified Alumni' : 'Pending Verification'}
              </span>
            </div>
          )}
        </div>

        {/* Search Bar */}
        <div className="mb-4 sm:mb-8">
          <div className="relative max-w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Search years (e.g. 2020)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full text-sm sm:text-base"
            />
          </div>
        </div>

        {/* Back to Dashboard Button */}
        <div className="mb-4 sm:mb-8">
          <Button 
            onClick={handleBackToDashboard}
            variant="outline"
            className="flex items-center space-x-2 text-sm sm:text-base px-3 py-2 sm:px-4"
            size="sm"
          >
            <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
            <span>Back to Dashboard</span>
          </Button>
        </div>

        {/* Years Grid */}
        <Card className="shadow-sm">
          <CardContent className="p-3 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 space-y-2 sm:space-y-0">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 break-words">
                {selectedSchool 
                  ? `${selectedSchool.name} Yearbooks by Year` 
                  : "Available Years"
                }
              </h3>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-600">
                  <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span>{filteredYears.length} Years Available</span>
                </div>
                {/* View Mode Toggle */}
                <div className="flex items-center bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600 hover:text-gray-800'}`}
                    title="Grid View"
                  >
                    <Grid3X3 className="h-3 w-3 sm:h-4 sm:w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600 hover:text-gray-800'}`}
                    title="List View"
                  >
                    <List className="h-3 w-3 sm:h-4 sm:w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Years Display */}
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2 sm:gap-4">
                {filteredYears.map((yearData) => (
                  <div key={yearData.year} className="relative">
                    <Button
                      onClick={() => handleYearSelect(yearData)}
                      disabled={!yearData.accessible && !yearData.canPurchase}
                      className={`w-full h-20 sm:h-24 flex flex-col items-center justify-center transition-all duration-200 ${
                        yearData.accessible 
                          ? "bg-white hover:bg-secondary hover:text-white text-gray-900 border border-gray-200 shadow-sm"
                          : yearData.canPurchase 
                          ? "bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-300 shadow-sm"
                          : "bg-gray-200 text-gray-400 border border-gray-300 cursor-not-allowed opacity-50"
                      }`}
                      variant="outline"
                      data-testid={`button-year-${yearData.year}`}
                    >
                      <span className="text-base sm:text-lg font-bold">{yearData.year}</span>
                      <span className="text-xs opacity-70 mt-1 flex items-center text-center px-1">
                        {yearData.accessible ? (
                          <><Eye className="h-2 w-2 sm:h-3 sm:w-3 mr-1 flex-shrink-0" /><span className="hidden sm:inline">View Yearbook</span><span className="sm:hidden">View</span></>
                        ) : yearData.canPurchase ? (
                          <><ShoppingCart className="h-2 w-2 sm:h-3 sm:w-3 mr-1 flex-shrink-0" />${yearData.price.toFixed(2)}</>
                        ) : null}
                      </span>
                    </Button>
                    {/* Status badge */}
                    <div className={`absolute top-0.5 sm:top-1 right-0.5 sm:right-1 px-1 sm:px-1.5 py-0.5 rounded text-xs font-medium ${
                      yearData.status === 'Purchased' 
                        ? "bg-green-100 text-green-800"
                        : "bg-orange-100 text-orange-800"
                    }`}>
                      {yearData.status}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredYears.map((yearData) => (
                  <div key={yearData.year} className="flex items-center justify-between p-3 sm:p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <span className="text-lg sm:text-xl font-bold text-gray-900">{yearData.year}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          yearData.status === 'Purchased' 
                            ? "bg-green-100 text-green-800"
                            : "bg-orange-100 text-orange-800"
                        }`}>
                          {yearData.status}
                        </span>
                        {yearData.canPurchase && (
                          <span className="text-sm font-semibold text-blue-600">
                            ${yearData.price.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      onClick={() => handleYearSelect(yearData)}
                      disabled={!yearData.accessible && !yearData.canPurchase}
                      className={`${
                        yearData.accessible 
                          ? "bg-white hover:bg-blue-600 hover:text-white text-gray-900 border border-gray-200"
                          : yearData.canPurchase 
                          ? "bg-blue-600 hover:bg-blue-700 text-white"
                          : "bg-gray-200 text-gray-400 cursor-not-allowed"
                      }`}
                      variant={yearData.accessible ? "outline" : "default"}
                      size="sm"
                      data-testid={`button-year-${yearData.year}`}
                    >
                      {yearData.accessible ? (
                        <><Eye className="h-4 w-4 mr-2" />View Yearbook</>
                      ) : yearData.canPurchase ? (
                        <><ShoppingCart className="h-4 w-4 mr-2" />Purchase</>
                      ) : (
                        <>{yearData.status}</>
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* No results message */}
            {filteredYears.length === 0 && searchTerm && (
              <div className="text-center py-6 sm:py-8">
                <p className="text-sm sm:text-base text-gray-500">No years found matching "{searchTerm}"</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Checkout Overlay */}
        {showCheckout && selectedYearForPurchase && (
          <CheckoutOverlay
            isOpen={showCheckout}
            onClose={() => setShowCheckout(false)}
            year={selectedYearForPurchase}
            price={4.99}
            isFree={false}
            onConfirmPurchase={handleConfirmPurchase}
            userType="viewer"
          />
        )}
      </div>
      </div>
    </div>
  );
}