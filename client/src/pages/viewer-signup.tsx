import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Eye, CheckCircle, Loader2, Search } from "lucide-react";
import { countries, getCountryByCode, Country } from "@/lib/countries";
import { apiRequest } from "@/lib/queryClient";

export default function ViewerSignup() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Registration state
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Phone number state
  const [selectedPhoneCountry, setSelectedPhoneCountry] = useState<Country | null>(null);
  const [phoneCountrySearch, setPhoneCountrySearch] = useState("");
  const [isPhoneCountryOpen, setIsPhoneCountryOpen] = useState(false);
  
  // Ref for phone country dropdown
  const phoneCountryDropdownRef = useRef<HTMLDivElement>(null);

  // Form state
  const [form, setForm] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    middleName: "",
    lastName: "",
    dateOfBirth: "",
    email: "",
    phoneNumber: "",
    countryCode: "",
  });

  // Form handlers
  const handleFormChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  // Close phone country dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (phoneCountryDropdownRef.current && !phoneCountryDropdownRef.current.contains(event.target as Node)) {
        setIsPhoneCountryOpen(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Filter countries based on search
  const filteredPhoneCountries = countries.filter(country =>
    country.name.toLowerCase().includes(phoneCountrySearch.toLowerCase()) ||
    (country.dialCode && country.dialCode.includes(phoneCountrySearch))
  );

  // Form validation
  const validateForm = () => {
    if (!form.username || form.username.length < 3) {
      setError("Username must be at least 3 characters");
      return false;
    }
    if (!form.password || form.password.length < 6) {
      setError("Password must be at least 6 characters");
      return false;
    }
    if (form.password !== form.confirmPassword) {
      setError("Passwords must match");
      return false;
    }
    if (!form.firstName || !form.lastName) {
      setError("First name and last name are required");
      return false;
    }
    if (!form.dateOfBirth) {
      setError("Date of birth is required");
      return false;
    }
    if (!form.email || !/\S+@\S+\.\S+/.test(form.email)) {
      setError("Valid email is required");
      return false;
    }
    if (!form.phoneNumber || !/^\d{10}$/.test(form.phoneNumber)) {
      setError("Phone number is required and must be 10 digits");
      return false;
    }
    if (!form.countryCode) {
      setError("Country code is required for phone number");
      return false;
    }

    // Validate date of birth is not in the future
    const dobDate = new Date(form.dateOfBirth);
    const today = new Date();
    if (dobDate > today) {
      setError("Date of birth cannot be in the future");
      return false;
    }

    return true;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      // Format phone number with country code
      const formattedPhoneNumber = `(${form.countryCode.replace(/^\+/, "")})${form.phoneNumber}`;
      
      // Create full name
      const fullName = `${form.firstName}${form.middleName ? ` ${form.middleName}` : ""} ${form.lastName}`;
      
      const response = await apiRequest("POST", "/api/auth/signup", {
        userType: "viewer",
        username: form.username,
        password: form.password,
        firstName: form.firstName,
        middleName: form.middleName || "",
        lastName: form.lastName,
        fullName,
        dateOfBirth: form.dateOfBirth,
        email: form.email,
        phoneNumber: formattedPhoneNumber,
      });

      if (response.ok) {
        setRegistrationSuccess(true);
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Registration failed. Please try again.");
      }
    } catch (error: any) {
      setError("Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (registrationSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full">
            <div className="absolute top-20 left-20 w-32 h-32 bg-white rounded-full opacity-5 animate-float"></div>
            <div className="absolute top-60 right-40 w-24 h-24 bg-white rounded-full opacity-5 animate-float-delayed"></div>
            <div className="absolute bottom-40 left-40 w-20 h-20 bg-white rounded-full opacity-5 animate-float"></div>
            <div className="absolute bottom-20 right-20 w-16 h-16 bg-white rounded-full opacity-5 animate-float-delayed"></div>
          </div>
        </div>
        
        <div className="w-full max-w-md relative z-10">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-green-800">Account Created Successfully!</h2>
                  <p className="text-sm text-gray-600 mt-2">
                    Your viewer/alumni account has been created. You can now log in and start exploring school yearbooks and memories.
                  </p>
                </div>
                
                <Button 
                  onClick={() => setLocation("/")}
                  className="w-full bg-green-600 hover:bg-green-700"
                  data-testid="button-continue-login"
                >
                  Continue to Login
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-20 left-20 w-32 h-32 bg-white rounded-full opacity-5 animate-float"></div>
          <div className="absolute top-60 right-40 w-24 h-24 bg-white rounded-full opacity-5 animate-float-delayed"></div>
          <div className="absolute bottom-40 left-40 w-20 h-20 bg-white rounded-full opacity-5 animate-float"></div>
          <div className="absolute bottom-20 right-20 w-16 h-16 bg-white rounded-full opacity-5 animate-float-delayed"></div>
        </div>
      </div>

      <div className="w-full max-w-2xl relative z-10">
        <Card>
          <CardHeader className="text-center">
            <Button
              variant="ghost"
              onClick={() => setLocation("/signup")}
              className="mb-4 text-blue-600 hover:text-blue-800 self-start"
              data-testid="button-back-to-signup"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Account Selection
            </Button>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Eye className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Viewer/Alumni Registration</CardTitle>
            <CardDescription>
              Create your viewer/alumni account to browse school yearbooks and memories. All fields marked with * are required.
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {error && (
              <Alert className="mb-4 border-red-200 bg-red-50">
                <AlertDescription className="text-red-800">{error}</AlertDescription>
              </Alert>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Account Information Section */}
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                  <h3 className="text-xl font-bold text-blue-800 flex items-center gap-2">
                    <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">1</div>
                    Account Information
                  </h3>
                  <p className="text-sm text-blue-600 mt-1">Set up your login credentials</p>
                </div>
                
                {/* Username */}
                <div>
                  <Label className="text-sm font-medium">Username *</Label>
                  <Input
                    type="text"
                    value={form.username}
                    onChange={(e) => handleFormChange("username", e.target.value)}
                    required
                    placeholder="Choose a unique username"
                    data-testid="input-username"
                  />
                </div>

                {/* Password */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Password *</Label>
                    <Input
                      type="password"
                      value={form.password}
                      onChange={(e) => handleFormChange("password", e.target.value)}
                      required
                      placeholder="Enter password"
                      data-testid="input-password"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Confirm Password *</Label>
                    <Input
                      type="password"
                      value={form.confirmPassword}
                      onChange={(e) => handleFormChange("confirmPassword", e.target.value)}
                      required
                      placeholder="Confirm password"
                      data-testid="input-confirm-password"
                    />
                  </div>
                </div>
              </div>

              {/* Personal Information Section */}
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                  <h3 className="text-xl font-bold text-green-800 flex items-center gap-2">
                    <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center text-white text-sm font-bold">2</div>
                    Personal Information
                  </h3>
                  <p className="text-sm text-green-600 mt-1">Tell us about yourself</p>
                </div>
                
                {/* Name */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm font-medium">First Name *</Label>
                    <Input
                      type="text"
                      value={form.firstName}
                      onChange={(e) => handleFormChange("firstName", e.target.value)}
                      required
                      placeholder="First name"
                      data-testid="input-first-name"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Middle Name</Label>
                    <Input
                      type="text"
                      value={form.middleName}
                      onChange={(e) => handleFormChange("middleName", e.target.value)}
                      placeholder="Middle name (optional)"
                      data-testid="input-middle-name"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Last Name *</Label>
                    <Input
                      type="text"
                      value={form.lastName}
                      onChange={(e) => handleFormChange("lastName", e.target.value)}
                      required
                      placeholder="Last name"
                      data-testid="input-last-name"
                    />
                  </div>
                </div>

                {/* Date of Birth */}
                <div>
                  <Label className="text-sm font-medium">Date of Birth *</Label>
                  <Input
                    type="date"
                    value={form.dateOfBirth}
                    onChange={(e) => handleFormChange("dateOfBirth", e.target.value)}
                    required
                    max={new Date().toISOString().split('T')[0]}
                    data-testid="input-date-of-birth"
                  />
                </div>

                {/* Email */}
                <div>
                  <Label className="text-sm font-medium">Email Address *</Label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => handleFormChange("email", e.target.value)}
                    required
                    placeholder="your.email@example.com"
                    data-testid="input-email"
                  />
                </div>

                {/* Phone Number with Country Code */}
                <div>
                  <Label className="text-sm font-medium">Phone Number *</Label>
                  <div className="flex gap-2">
                    {/* Country Code Dropdown */}
                    <div className="relative w-32" ref={phoneCountryDropdownRef}>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsPhoneCountryOpen(!isPhoneCountryOpen)}
                        className="w-full justify-between h-10"
                        data-testid="button-country-code"
                      >
                        {selectedPhoneCountry ? selectedPhoneCountry.dialCode : "Code"}
                        <Search className="h-4 w-4" />
                      </Button>
                      
                      {isPhoneCountryOpen && (
                        <div className="absolute top-full left-0 right-0 z-50 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                          <div className="p-2 border-b">
                            <Input
                              type="text"
                              placeholder="Search countries..."
                              value={phoneCountrySearch}
                              onChange={(e) => setPhoneCountrySearch(e.target.value)}
                              className="h-8"
                            />
                          </div>
                          <div className="py-1">
                            {filteredPhoneCountries.map((country) => (
                              <button
                                key={country.code}
                                type="button"
                                className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm"
                                onClick={() => {
                                  setSelectedPhoneCountry(country);
                                  handleFormChange("countryCode", country.dialCode || "");
                                  setIsPhoneCountryOpen(false);
                                  setPhoneCountrySearch("");
                                }}
                              >
                                <span className="font-medium">{country.dialCode}</span> {country.name}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Phone Number Input */}
                    <Input
                      type="tel"
                      value={form.phoneNumber}
                      onChange={(e) => handleFormChange("phoneNumber", e.target.value.replace(/\D/g, ''))}
                      required
                      placeholder="1234567890"
                      maxLength={10}
                      className="flex-1"
                      data-testid="input-phone-number"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Phone number is required for viewer accounts and must be 10 digits
                  </p>
                </div>
              </div>

              {/* Submit Button */}
              <Button 
                type="submit" 
                disabled={isLoading} 
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold"
                data-testid="button-create-account"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  "Create Viewer/Alumni Account"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}