import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, GraduationCap, BookOpen, Users, Camera, Star, Shield, Heart } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import albestaLogo from "@assets/albesta-logo-new_1757249448585.png";

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const [userType, setUserType] = useState("student");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [schoolCode, setSchoolCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await apiRequest("POST", "/api/auth/login", {
        username,
        password,
        userType,
        schoolCode: userType === "school" ? schoolCode : undefined,
      });

      const data = await response.json();
      
      // Clear any existing user data before storing new user
      localStorage.removeItem("user");
      
      // Store user data in localStorage
      localStorage.setItem("user", JSON.stringify(data.user));

      // Redirect based on user type
      if (userType === "student") {
        setLocation("/student-dashboard");
      } else if (userType === "viewer") {
        setLocation("/viewer-dashboard");
      } else if (userType === "school") {
        // Redirect to school admin dashboard
        setLocation("/school-dashboard");
      }
    } catch (error: any) {
      setError("Invalid credentials. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex flex-col lg:flex-row relative overflow-hidden">
      {/* Animated Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-20 left-20 w-32 h-32 bg-white rounded-full opacity-5 animate-float"></div>
          <div className="absolute top-60 right-40 w-24 h-24 bg-white rounded-full opacity-5 animate-float-delayed"></div>
          <div className="absolute bottom-40 left-40 w-20 h-20 bg-white rounded-full opacity-5 animate-float"></div>
          <div className="absolute bottom-20 right-20 w-16 h-16 bg-white rounded-full opacity-5 animate-float-delayed"></div>
        </div>
      </div>

      {/* Left Content Panel - Hidden on mobile, shown on desktop */}
      <div className="hidden lg:flex flex-1 items-center justify-center p-8 relative z-10">
        <div className="max-w-lg animate-fade-in-up">
          {/* Main Brand Section */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-6">
              <div className="relative animate-bounce-gentle">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-2xl flex items-center justify-center shadow-2xl transform rotate-3 hover:rotate-0 hover:scale-110 transition-all duration-500 animate-glow">
                  <GraduationCap className="text-white text-4xl" />
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center animate-pulse-glow">
                  <Star className="text-yellow-800 w-4 h-4 animate-spin-slow" />
                </div>
              </div>
            </div>
            <h1 className="text-5xl font-bold text-white mb-4 tracking-tight">
              Waibuk
            </h1>
            <p className="text-xl text-blue-100 leading-relaxed mb-8 animate-fade-in-delayed">
              Where School Memories Live Forever
            </p>
          </div>

          {/* Feature Highlights */}
          <div className="grid grid-cols-2 gap-6 mb-12">
            <div className="text-center animate-slide-in-left hover:scale-105 transition-transform duration-300">
              <div className="w-16 h-16 bg-blue-500/20 rounded-xl flex items-center justify-center mx-auto mb-3 backdrop-blur-sm border border-blue-400/30 hover:bg-blue-500/30 hover:border-blue-300/50 transition-all duration-300">
                <BookOpen className="text-blue-300 w-8 h-8 hover:text-blue-200 transition-colors" />
              </div>
              <h3 className="text-white font-semibold mb-1">Digital Yearbooks</h3>
              <p className="text-blue-200 text-sm">Beautiful, interactive school memories</p>
            </div>
            <div className="text-center animate-slide-in-right hover:scale-105 transition-transform duration-300 animation-delay-200">
              <div className="w-16 h-16 bg-purple-500/20 rounded-xl flex items-center justify-center mx-auto mb-3 backdrop-blur-sm border border-purple-400/30 hover:bg-purple-500/30 hover:border-purple-300/50 transition-all duration-300">
                <Users className="text-purple-300 w-8 h-8 hover:text-purple-200 transition-colors" />
              </div>
              <h3 className="text-white font-semibold mb-1">Alumni Network</h3>
              <p className="text-blue-200 text-sm">Connect with classmates worldwide</p>
            </div>
            <div className="text-center animate-slide-in-left hover:scale-105 transition-transform duration-300 animation-delay-400">
              <div className="w-16 h-16 bg-green-500/20 rounded-xl flex items-center justify-center mx-auto mb-3 backdrop-blur-sm border border-green-400/30 hover:bg-green-500/30 hover:border-green-300/50 transition-all duration-300">
                <Camera className="text-green-300 w-8 h-8 hover:text-green-200 transition-colors" />
              </div>
              <h3 className="text-white font-semibold mb-1">Photo Sharing</h3>
              <p className="text-blue-200 text-sm">Share and discover school moments</p>
            </div>
            <div className="text-center animate-slide-in-right hover:scale-105 transition-transform duration-300 animation-delay-600">
              <div className="w-16 h-16 bg-red-500/20 rounded-xl flex items-center justify-center mx-auto mb-3 backdrop-blur-sm border border-red-400/30 hover:bg-red-500/30 hover:border-red-300/50 transition-all duration-300">
                <Shield className="text-red-300 w-8 h-8 hover:text-red-200 transition-colors" />
              </div>
              <h3 className="text-white font-semibold mb-1">Safe & Secure</h3>
              <p className="text-blue-200 text-sm">Protected educational environment</p>
            </div>
          </div>

          {/* Social Proof */}
          <div className="text-center animate-fade-in-up animation-delay-800">
            <div className="flex items-center justify-center mb-3">
              <div className="flex -space-x-2">
                <div className="w-12 h-12 bg-white rounded-full border-2 border-white animate-avatar-bounce overflow-hidden flex items-center justify-center p-1">
                  <img 
                    src={albestaLogo} 
                    alt="Albesta Academy" 
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full border-2 border-white animate-avatar-bounce animation-delay-200"></div>
                <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-blue-500 rounded-full border-2 border-white animate-avatar-bounce animation-delay-400"></div>
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full border-2 border-white animate-avatar-bounce animation-delay-600"></div>
              </div>
              <Heart className="text-red-400 w-5 h-5 ml-3 animate-heartbeat" />
            </div>
            <p className="text-blue-200 text-sm animate-fade-in-delayed">
              Trusted by alumni and schools worldwide
            </p>
          </div>
        </div>
      </div>

      {/* Mobile Header - Only shown on mobile */}
      <div className="lg:hidden flex items-center justify-center py-8 px-4 relative z-10">
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-2xl flex items-center justify-center shadow-2xl">
                <GraduationCap className="text-white text-2xl" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center">
                <Star className="text-yellow-800 w-2 h-2" />
              </div>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
            Waibuk
          </h1>
          <p className="text-blue-100 text-sm">
            Where School Memories Live Forever
          </p>
        </div>
      </div>

      {/* Login Panel - Full width on mobile, right panel on desktop */}
      <div className="flex-1 lg:w-full lg:max-w-md bg-white/95 backdrop-blur-sm shadow-2xl flex items-center justify-center relative z-10 animate-slide-in-right">
        <div className="w-full p-4 sm:p-6 lg:p-8 max-w-sm sm:max-w-md mx-auto">
          {/* Login Header */}
          <div className="text-center mb-6 sm:mb-8 animate-fade-in-up">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">Welcome Back</h2>
            <p className="text-gray-600">Sign in to access your portal</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {/* User Type Selection */}
            <div className="space-y-2">
              <Label className="block text-sm font-semibold text-gray-800">Account Type</Label>
              <Select value={userType} onValueChange={setUserType}>
                <SelectTrigger className="w-full h-10 sm:h-12 border-2 border-gray-200 hover:border-blue-300 focus:border-blue-500 transition-colors duration-200 rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">
                    <div className="flex items-center">
                      <GraduationCap className="w-4 h-4 mr-2 text-blue-600" />
                      Student
                    </div>
                  </SelectItem>
                  <SelectItem value="viewer">
                    <div className="flex items-center">
                      <Users className="w-4 h-4 mr-2 text-purple-600" />
                      Viewer/Alumni
                    </div>
                  </SelectItem>
                  <SelectItem value="school">
                    <div className="flex items-center">
                      <Shield className="w-4 h-4 mr-2 text-green-600" />
                      School Administrator
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Username Field */}
            <div className="space-y-2">
              <Label htmlFor="username" className="block text-sm font-semibold text-gray-800">
                Username or Email
              </Label>
              <Input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder="Enter your username or email"
                className="w-full h-10 sm:h-12 border-2 border-gray-200 hover:border-blue-300 focus:border-blue-500 transition-colors duration-200 rounded-lg text-sm sm:text-base"
                data-testid="input-username"
              />
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="block text-sm font-semibold text-gray-800">
                Password
              </Label>
              <Input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter your password"
                className="w-full h-10 sm:h-12 border-2 border-gray-200 hover:border-blue-300 focus:border-blue-500 transition-colors duration-200 rounded-lg text-sm sm:text-base"
                data-testid="input-password"
              />
            </div>

            {/* School Code Field - Only show for school accounts */}
            {userType === "school" && (
              <div className="space-y-2">
                <Label htmlFor="schoolCode" className="block text-sm font-semibold text-gray-800">
                  School Code
                </Label>
                <Input
                  type="text"
                  id="schoolCode"
                  value={schoolCode}
                  onChange={(e) => setSchoolCode(e.target.value)}
                  required
                  placeholder="Enter 10-digit school code"
                  maxLength={10}
                  className="w-full h-10 sm:h-12 border-2 border-gray-200 hover:border-blue-300 focus:border-blue-500 transition-colors duration-200 rounded-lg text-sm sm:text-base"
                  data-testid="input-school-code"
                />
                <p className="text-xs text-gray-500">
                  Enter the unique alphanumeric code provided when account was created.
                </p>
              </div>
            )}

            {/* Login Button */}
            <Button 
              type="submit" 
              disabled={isLoading} 
              className="w-full h-10 sm:h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-sm sm:text-base shadow-lg transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none rounded-lg"
              data-testid="button-sign-in"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                  Signing In...
                </>
              ) : (
                "Sign In to Your Portal"
              )}
            </Button>

            {/* Error Message */}
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </form>

          {/* Signup Link */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{" "}
              <Button
                variant="link"
                className="p-0 h-auto text-blue-600 hover:text-blue-800 font-semibold"
                onClick={() => setLocation("/signup")}
                data-testid="link-signup"
              >
                Sign up here
              </Button>
            </p>
          </div>

          {/* Footer Links */}
          <div className="mt-6 text-center space-x-4">
            <button className="text-xs text-gray-500 hover:text-gray-700">Privacy Policy</button>
            <span className="text-gray-300">•</span>
            <button className="text-xs text-gray-500 hover:text-gray-700">Terms of Service</button>
          </div>
        </div>
      </div>
    </div>
  );
}
