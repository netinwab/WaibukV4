import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BookOpen, Users, Calendar, Search, Settings, LogOut, GraduationCap } from "lucide-react";

export default function StudentDashboard() {
  const [user, setUser] = useState<any>(null);
  const [, setLocation] = useLocation();

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    } else {
      setLocation("/");
    }
  }, [setLocation]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    setLocation("/");
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <GraduationCap className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">E-Yearbook</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.profileImage} />
                  <AvatarFallback>{user.firstName?.[0]}{user.lastName?.[0]}</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium text-gray-700">{user.fullName}</span>
                <Badge variant="secondary">Student</Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-gray-600 hover:text-gray-900"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user.firstName}!
          </h2>
          <p className="text-gray-600">
            Explore yearbooks, connect with alumni, and discover memories from your school journey.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setLocation("/yearbook-finder")}>
            <CardContent className="p-6 text-center">
              <BookOpen className="h-8 w-8 text-blue-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Browse Yearbooks</h3>
              <p className="text-sm text-gray-600">Explore yearbooks from different years</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setLocation("/request-alumni-status")}>
            <CardContent className="p-6 text-center">
              <Users className="h-8 w-8 text-green-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Alumni Network</h3>
              <p className="text-sm text-gray-600">Connect with fellow alumni</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6 text-center">
              <Calendar className="h-8 w-8 text-purple-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">School Events</h3>
              <p className="text-sm text-gray-600">View upcoming events and reunions</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6 text-center">
              <Search className="h-8 w-8 text-orange-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Search</h3>
              <p className="text-sm text-gray-600">Find classmates and memories</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity & Profile */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Information */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                Profile Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <Avatar className="h-20 w-20 mx-auto mb-4">
                  <AvatarImage src={user.profileImage} />
                  <AvatarFallback className="text-lg">{user.firstName?.[0]}{user.lastName?.[0]}</AvatarFallback>
                </Avatar>
                <h3 className="font-semibold text-lg">{user.fullName}</h3>
                <p className="text-gray-600">@{user.username}</p>
              </div>
              <Separator />
              <div className="space-y-2">
                <div>
                  <span className="text-sm font-medium text-gray-700">Email:</span>
                  <p className="text-sm text-gray-600">{user.email || "Not provided"}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">Phone:</span>
                  <p className="text-sm text-gray-600">{user.phoneNumber || "Not provided"}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">Date of Birth:</span>
                  <p className="text-sm text-gray-600">{user.dateOfBirth || "Not provided"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No recent activity yet.</p>
                <p className="text-sm">Start exploring yearbooks to see your activity here!</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}