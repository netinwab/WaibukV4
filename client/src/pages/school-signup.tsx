import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, School, CheckCircle, Loader2, Search, Copy, Download, Upload } from "lucide-react";
import { countries, statesByCountry, getCountryByCode, Country, State } from "@/lib/countries";
import { apiRequest } from "@/lib/queryClient";
import { CURRENT_YEAR } from "@shared/constants";

export default function SchoolSignup() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Registration state
  const [registrationSuccess, setRegistrationSuccess] = useState<{user: any, school: any, schoolCode: string} | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [selectedState, setSelectedState] = useState<State | null>(null);
  const [countrySearch, setCountrySearch] = useState("");
  const [stateSearch, setStateSearch] = useState("");
  const [isCountryOpen, setIsCountryOpen] = useState(false);
  const [isStateOpen, setIsStateOpen] = useState(false);
  
  // For copy functionality
  const [copySuccess, setCopySuccess] = useState(false);
  
  // Form state
  const [form, setForm] = useState({
    schoolName: "",
    city: "",
    email: "",
    address: "",
    yearFounded: "",
    adminUsername: "",
    adminPassword: "",
    confirmPassword: "",
    registrationNumber: "", // New field
    accreditationDocument: null as File | null, // New field
  });

  // Form handlers
  const handleFormChange = (field: string, value: string | File | null) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  // Copy to clipboard function
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
      toast({
        title: "Copied!",
        description: "School code copied to clipboard",
      });
    } catch (err) {
      toast({
        title: "Copy failed",
        description: "Could not copy to clipboard",
        variant: "destructive",
      });
    }
  };

  // Download school code as text file
  const downloadSchoolCode = (schoolCode: string, schoolName: string) => {
    const element = document.createElement('a');
    const file = new Blob([schoolCode], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${schoolName.replace(/\s+/g, '_')}_school_code.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Validate password match
    if (form.adminPassword !== form.confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    // Validate required fields
    if (!selectedCountry || !form.schoolName || !form.city || !form.email || 
        !form.yearFounded || !form.adminUsername || !form.adminPassword) {
      setError("Please fill in all required fields");
      setIsLoading(false);
      return;
    }

    // Validate state if required
    if (selectedCountry && statesByCountry[selectedCountry.code] && !selectedState) {
      setError("Please select a state/province");
      setIsLoading(false);
      return;
    }

    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('username', form.adminUsername);
      formData.append('password', form.adminPassword);
      formData.append('schoolName', form.schoolName);
      formData.append('country', selectedCountry.name);
      formData.append('state', selectedState?.name || "");
      formData.append('city', form.city);
      formData.append('email', form.email);
      formData.append('address', form.address);
      formData.append('yearFounded', form.yearFounded);
      formData.append('registrationNumber', form.registrationNumber);
      
      // Add file if selected
      if (form.accreditationDocument) {
        formData.append('accreditationDocument', form.accreditationDocument);
      }

      const response = await fetch("/api/auth/school-register", {
        method: "POST",
        body: formData, // Don't set Content-Type, let browser set it with boundary
      });

      const data = await response.json();
      
      // Set success state with school code
      setRegistrationSuccess(data);
      
      // Reset form
      setForm({
        schoolName: "",
        city: "",
        email: "",
        address: "",
        yearFounded: "",
        adminUsername: "",
        adminPassword: "",
        confirmPassword: "",
        registrationNumber: "",
        accreditationDocument: null,
      });
      setSelectedCountry(null);
      setSelectedState(null);
      
    } catch (error: any) {
      setError("School registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Filter countries based on search
  const filteredCountries = countries.filter(country =>
    country.name.toLowerCase().includes(countrySearch.toLowerCase())
  );

  // Filter states based on search
  const availableStates = selectedCountry ? statesByCountry[selectedCountry.code] || [] : [];
  const filteredStates = availableStates.filter(state =>
    state.name.toLowerCase().includes(stateSearch.toLowerCase())
  );

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
                  <h2 className="text-xl font-bold text-green-800">Request Sent Successfully!</h2>
                  <p className="text-sm text-gray-600 mt-2">
                    Your school registration request has been submitted and is pending approval by our moderators. You should receive an E-mail notification in 2-10 business days once your request is processed.  
                  </p>
                </div>
                
                
                
                <Button 
                  onClick={() => setLocation("/")}
                  className="w-full bg-green-600 hover:bg-green-700"
                  data-testid="button-continue-login"
                >
                  Ok
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
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Account Selection
            </Button>
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <School className="w-8 h-8 text-orange-600" />
            </div>
            <CardTitle className="text-2xl">School Administrator Registration</CardTitle>
            <CardDescription>
              Register your school and create an administrator account. All fields marked with * are required.
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {error && (
              <Alert className="mb-4 border-red-200 bg-red-50">
                <AlertDescription className="text-red-800">{error}</AlertDescription>
              </Alert>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* School Information Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">School Information</h3>
                
                {/* School Name */}
                <div>
                  <Label className="text-sm font-medium">School Name *</Label>
                  <Input
                    type="text"
                    value={form.schoolName}
                    onChange={(e) => handleFormChange('schoolName', e.target.value)}
                    required
                    placeholder="Enter full school name"
                    className="mt-1"
                    data-testid="input-school-name"
                  />
                </div>

                {/* School Registration Number */}
                <div>
                  <Label className="text-sm font-medium">School Registration Number</Label>
                  <Input
                    type="text"
                    value={form.registrationNumber}
                    onChange={(e) => handleFormChange('registrationNumber', e.target.value)}
                    placeholder="Enter registration number (optional)"
                    className="mt-1"
                    data-testid="input-registration-number"
                  />
                </div>

                {/* Year Founded */}
                <div>
                  <Label className="text-sm font-medium">Year Founded *</Label>
                  <Select 
                    value={form.yearFounded} 
                    onValueChange={(value) => handleFormChange('yearFounded', value)}
                  >
                    <SelectTrigger className="mt-1" data-testid="select-year-founded">
                      <SelectValue placeholder="Select founding year" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {Array.from({ length: CURRENT_YEAR - 1900 + 1 }, (_, i) => {
                        const year = CURRENT_YEAR - i;
                        return (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                {/* Country Dropdown */}
                <div>
                  <Label className="text-sm font-medium">Country *</Label>
                  <div className="relative mt-1">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full justify-between"
                      onClick={() => setIsCountryOpen(!isCountryOpen)}
                      data-testid="button-country-select"
                    >
                      <span className="flex items-center space-x-2">
                        {selectedCountry ? (
                          <>
                            <span>{selectedCountry.flag}</span>
                            <span>{selectedCountry.name}</span>
                          </>
                        ) : (
                          <span className="text-gray-500">Select a country</span>
                        )}
                      </span>
                      <Search className="h-4 w-4" />
                    </Button>
                    
                    {isCountryOpen && (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-hidden">
                        <div className="p-2 border-b border-gray-200">
                          <Input
                            type="text"
                            placeholder="Search countries..."
                            value={countrySearch}
                            onChange={(e) => setCountrySearch(e.target.value)}
                            className="w-full"
                            data-testid="input-country-search"
                          />
                        </div>
                        <div className="max-h-40 overflow-y-auto">
                          {filteredCountries.map((country) => (
                            <button
                              key={country.code}
                              type="button"
                              className="w-full text-left px-3 py-2 hover:bg-gray-100 flex items-center space-x-2"
                              onClick={() => {
                                setSelectedCountry(country);
                                setSelectedState(null);
                                setIsCountryOpen(false);
                                setCountrySearch("");
                              }}
                              data-testid={`option-country-${country.code}`}
                            >
                              <span>{country.flag}</span>
                              <span>{country.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* State Dropdown (if applicable) */}
                {selectedCountry && availableStates.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium">State/Province *</Label>
                    <div className="relative mt-1">
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full justify-between"
                        onClick={() => setIsStateOpen(!isStateOpen)}
                        data-testid="button-state-select"
                      >
                        <span>{selectedState ? selectedState.name : "Select a state/province"}</span>
                        <Search className="h-4 w-4" />
                      </Button>
                      
                      {isStateOpen && (
                        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-hidden">
                          <div className="p-2 border-b border-gray-200">
                            <Input
                              type="text"
                              placeholder="Search states..."
                              value={stateSearch}
                              onChange={(e) => setStateSearch(e.target.value)}
                              className="w-full"
                              data-testid="input-state-search"
                            />
                          </div>
                          <div className="max-h-40 overflow-y-auto">
                            {filteredStates.map((state) => (
                              <button
                                key={state.code}
                                type="button"
                                className="w-full text-left px-3 py-2 hover:bg-gray-100"
                                onClick={() => {
                                  setSelectedState(state);
                                  setIsStateOpen(false);
                                  setStateSearch("");
                                }}
                                data-testid={`option-state-${state.code}`}
                              >
                                {state.name}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* City */}
                <div>
                  <Label className="text-sm font-medium">City *</Label>
                  <Input
                    type="text"
                    value={form.city}
                    onChange={(e) => handleFormChange('city', e.target.value)}
                    required
                    placeholder="Enter city name"
                    className="mt-1"
                    data-testid="input-city"
                  />
                </div>

                {/* Address */}
                <div>
                  <Label className="text-sm font-medium">Address</Label>
                  <Input
                    type="text"
                    value={form.address}
                    onChange={(e) => handleFormChange('address', e.target.value)}
                    placeholder="Enter school address (optional)"
                    className="mt-1"
                    data-testid="input-address"
                  />
                </div>

                {/* Email */}
                <div>
                  <Label className="text-sm font-medium">School Email *</Label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => handleFormChange('email', e.target.value)}
                    required
                    placeholder="Enter official school email"
                    className="mt-1"
                    data-testid="input-email"
                  />
                </div>

                {/* Proof of Accreditation */}
                <div>
                  <Label className="text-sm font-medium">Proof of Accreditation/License Document</Label>
                  <div className="mt-1">
                    <Input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                      onChange={(e) => handleFormChange('accreditationDocument', e.target.files?.[0] || null)}
                      className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      data-testid="input-accreditation-document"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Upload accreditation certificate or license document (optional)
                    </p>
                  </div>
                </div>
              </div>

              {/* Administrator Account Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Administrator Account</h3>
                
                {/* Admin Username */}
                <div>
                  <Label className="text-sm font-medium">Administrator Username *</Label>
                  <Input
                    type="text"
                    value={form.adminUsername}
                    onChange={(e) => handleFormChange('adminUsername', e.target.value)}
                    required
                    placeholder="Enter admin username"
                    className="mt-1"
                    data-testid="input-admin-username"
                  />
                </div>

                {/* Admin Password */}
                <div>
                  <Label className="text-sm font-medium">Administrator Password *</Label>
                  <Input
                    type="password"
                    value={form.adminPassword}
                    onChange={(e) => handleFormChange('adminPassword', e.target.value)}
                    required
                    placeholder="Enter admin password"
                    className="mt-1"
                    data-testid="input-admin-password"
                  />
                </div>

                {/* Confirm Password */}
                <div>
                  <Label className="text-sm font-medium">Confirm Password *</Label>
                  <Input
                    type="password"
                    value={form.confirmPassword}
                    onChange={(e) => handleFormChange('confirmPassword', e.target.value)}
                    required
                    placeholder="Confirm admin password"
                    className="mt-1"
                    data-testid="input-confirm-password"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <Button 
                type="submit" 
                className="w-full bg-orange-600 hover:bg-orange-700" 
                disabled={isLoading}
                data-testid="button-register-school"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Registering School...
                  </>
                ) : (
                  "Register School"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}