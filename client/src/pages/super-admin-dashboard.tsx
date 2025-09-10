import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, 
  Users, 
  School, 
  Award, 
  UserCheck, 
  Trash2, 
  Edit, 
  Search,
  BarChart3,
  Activity,
  LogOut,
  AlertTriangle,
  BookOpen,
  Unlock,
  Lock,
  Calendar,
  Grid,
  List
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface SuperAdminDashboardProps {
  user: any;
  onLogout: () => void;
}

export default function SuperAdminDashboard({ user, onLogout }: SuperAdminDashboardProps) {
  const [users, setUsers] = useState<any[]>([]);
  const [schools, setSchools] = useState<any[]>([]);
  const [pendingSchools, setPendingSchools] = useState<any[]>([]);
  const [alumniBadges, setAlumniBadges] = useState<any[]>([]);
  const [alumniRequests, setAlumniRequests] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>({});
  const [adminLogs, setAdminLogs] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSchoolForYears, setSelectedSchoolForYears] = useState<any>(null);
  const [schoolYears, setSchoolYears] = useState<any>(null);
  const [yearLoading, setYearLoading] = useState(false);
  const [yearsViewMode, setYearsViewMode] = useState<'grid' | 'list'>('grid');
  const [confirmationDialogOpen, setConfirmationDialogOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [pendingUnlockData, setPendingUnlockData] = useState<{schoolId: string, year: number, schoolName: string} | null>(null);
  const [adminPassword, setAdminPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const { toast } = useToast();

  const getAuthHeaders = () => ({
    'Authorization': `Bearer ${localStorage.getItem('superAdminToken')}`,
    'Content-Type': 'application/json'
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [usersRes, schoolsRes, pendingSchoolsRes, badgesRes, requestsRes, analyticsRes, logsRes] = await Promise.all([
        fetch('/api/super-admin/users', { headers: getAuthHeaders() }),
        fetch('/api/super-admin/schools', { headers: getAuthHeaders() }),
        fetch('/api/super-admin/pending-schools', { headers: getAuthHeaders() }),
        fetch('/api/super-admin/alumni-badges', { headers: getAuthHeaders() }),
        fetch('/api/super-admin/alumni-requests', { headers: getAuthHeaders() }),
        fetch('/api/super-admin/analytics', { headers: getAuthHeaders() }),
        fetch('/api/super-admin/logs', { headers: getAuthHeaders() })
      ]);

      if (usersRes.ok) setUsers(await usersRes.json());
      if (schoolsRes.ok) setSchools(await schoolsRes.json());
      if (pendingSchoolsRes.ok) setPendingSchools(await pendingSchoolsRes.json());
      if (badgesRes.ok) setAlumniBadges(await badgesRes.json());
      if (requestsRes.ok) setAlumniRequests(await requestsRes.json());
      if (analyticsRes.ok) setAnalytics(await analyticsRes.json());
      if (logsRes.ok) setAdminLogs(await logsRes.json());
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch dashboard data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const deleteUser = async (userId: string, username: string) => {
    try {
      const response = await fetch(`/api/super-admin/users/${userId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        body: JSON.stringify({ username })
      });

      if (response.ok) {
        toast({
          title: "User Deleted",
          description: `User ${username} has been deleted successfully`,
        });
        fetchData();
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.message || "Failed to delete user",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive",
      });
    }
  };

  const deleteSchool = async (schoolId: string, schoolName: string) => {
    try {
      const response = await fetch(`/api/super-admin/schools/${schoolId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        body: JSON.stringify({ schoolName })
      });

      if (response.ok) {
        toast({
          title: "School Deleted",
          description: `School ${schoolName} has been deleted successfully`,
        });
        fetchData();
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.message || "Failed to delete school",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete school",
        variant: "destructive",
      });
    }
  };

  const approveSchool = async (schoolId: string, schoolName: string) => {
    try {
      const response = await fetch(`/api/super-admin/approve-school/${schoolId}`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: "School Approved",
          description: `${schoolName} has been approved successfully`,
        });
        
        // Show the school code in a separate toast
        setTimeout(() => {
          toast({
            title: "School Code Generated",
            description: `Login Code: ${result.schoolCode} - Share this with the school for login`,
          });
        }, 1000);
        
        fetchData();
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.message || "Failed to approve school",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to approve school",
        variant: "destructive",
      });
    }
  };

  const rejectSchool = async (schoolId: string, schoolName: string, reason: string) => {
    try {
      const response = await fetch(`/api/super-admin/reject-school/${schoolId}`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ reason })
      });

      if (response.ok) {
        toast({
          title: "School Rejected",
          description: `${schoolName} registration has been rejected`,
        });
        fetchData();
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.message || "Failed to reject school",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reject school",
        variant: "destructive",
      });
    }
  };


  const updateAlumniBadgeStatus = async (badgeId: string, status: string) => {
    try {
      const response = await fetch(`/api/super-admin/alumni-badges/${badgeId}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        toast({
          title: "Badge Updated",
          description: `Alumni badge ${status === 'verified' ? 'approved' : 'revoked'}`,
        });
        fetchData();
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.message || "Failed to update badge",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update badge",
        variant: "destructive",
      });
    }
  };

  const fetchSchoolYears = async (schoolId: string) => {
    setYearLoading(true);
    try {
      const response = await fetch(`/api/super-admin/school-years/${schoolId}`, {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        setSchoolYears(data);
      } else {
        let errorMessage = "Failed to fetch yearbooks";
        try {
          const error = await response.json();
          errorMessage = error.message || errorMessage;
        } catch (e) {
          // If we can't parse the error response, use the default message
        }
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch yearbooks. Please try again.",
        variant: "destructive",
      });
    } finally {
      setYearLoading(false);
    }
  };

  const toggleYearAccess = async (schoolId: string, year: number, unlock: boolean) => {
    try {
      const response = await fetch('/api/super-admin/unlock-year', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ schoolId, year, unlock })
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: "Year Access Updated",
          description: result.message,
        });
        
        // Refresh school years data
        if (selectedSchoolForYears) {
          await fetchSchoolYears(selectedSchoolForYears.id);
        }
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.message || "Failed to update year access",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update year access",
        variant: "destructive",
      });
    }
  };

  const handleUnlockClick = (schoolId: string, year: number, schoolName: string) => {
    setPendingUnlockData({ schoolId, year, schoolName });
    setConfirmationDialogOpen(true);
  };

  const handleConfirmUnlock = () => {
    setConfirmationDialogOpen(false);
    setPasswordDialogOpen(true);
  };

  const handlePasswordSubmit = async () => {
    if (!pendingUnlockData) return;
    
    // Verify password with backend
    try {
      const response = await fetch('/api/super-admin/verify-password', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ password: adminPassword })
      });

      if (response.ok) {
        // Password correct, proceed with unlock
        await toggleYearAccess(pendingUnlockData.schoolId, pendingUnlockData.year, true);
        setPasswordDialogOpen(false);
        setAdminPassword('');
        setPasswordError('');
        setPendingUnlockData(null);
      } else {
        setPasswordError('Incorrect password. Please try again.');
      }
    } catch (error) {
      setPasswordError('Error verifying password. Please try again.');
    }
  };

  const cancelUnlock = () => {
    setConfirmationDialogOpen(false);
    setPasswordDialogOpen(false);
    setAdminPassword('');
    setPasswordError('');
    setPendingUnlockData(null);
  };

  const filteredUsers = users.filter(user => 
    user.userType !== 'super_admin' && (
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.fullName.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const filteredSchools = schools.filter(school => 
    school.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    school.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredBadges = alumniBadges.filter(badge => 
    badge.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    badge.school.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 shadow-sm border-b" data-testid="header-dashboard">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center" data-testid="icon-container-header">
              <Shield className="w-6 h-6 text-white" data-testid="icon-shield-header" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white" data-testid="text-title-header">
                Super Admin Dashboard
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400" data-testid="text-subtitle">
                Welcome back, {user.fullName}
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={onLogout} data-testid="button-logout">
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6" data-testid="main-dashboard">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6" data-testid="tabs-dashboard">
          <TabsList className="grid w-full grid-cols-7" data-testid="tabs-list">
            <TabsTrigger value="overview" data-testid="tab-overview">
              <BarChart3 className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="users" data-testid="tab-users">
              <Users className="w-4 h-4 mr-2" />
              Users
            </TabsTrigger>
            <TabsTrigger value="schools" data-testid="tab-schools">
              <School className="w-4 h-4 mr-2" />
              Schools
            </TabsTrigger>
            <TabsTrigger value="pending-schools" data-testid="tab-pending-schools">
              <AlertTriangle className="w-4 h-4 mr-2" />
              Pending Schools {pendingSchools.length > 0 && <Badge variant="destructive" className="ml-1">{pendingSchools.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="alumni" data-testid="tab-alumni">
              <Award className="w-4 h-4 mr-2" />
              Alumni
            </TabsTrigger>
            <TabsTrigger value="yearbooks" data-testid="tab-yearbooks">
              <BookOpen className="w-4 h-4 mr-2" />
              Yearbooks
            </TabsTrigger>
            <TabsTrigger value="logs" data-testid="tab-logs">
              <Activity className="w-4 h-4 mr-2" />
              Activity Logs
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" data-testid="content-overview">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <Card data-testid="card-total-users">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="text-total-users">{analytics.totalUsers || 0}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {analytics.usersByType?.viewers || 0} viewers, {analytics.usersByType?.schools || 0} schools
                  </div>
                </CardContent>
              </Card>

              <Card data-testid="card-total-schools">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Schools</CardTitle>
                  <School className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="text-total-schools">{analytics.totalSchools || 0}</div>
                  <div className="text-xs text-muted-foreground mt-1">Registered institutions</div>
                </CardContent>
              </Card>

              <Card data-testid="card-alumni-badges">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Alumni Badges</CardTitle>
                  <Award className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="text-alumni-badges">{analytics.totalAlumniBadges || 0}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {analytics.alumniBadgesByStatus?.verified || 0} verified, {analytics.alumniBadgesByStatus?.pending || 0} pending
                  </div>
                </CardContent>
              </Card>

              <Card data-testid="card-alumni-requests">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Alumni Requests</CardTitle>
                  <UserCheck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="text-alumni-requests">{analytics.totalAlumniRequests || 0}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {analytics.alumniRequestsByStatus?.pending || 0} pending review
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" data-testid="content-users">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>User Management</CardTitle>
                  <div className="flex items-center space-x-2">
                    <Search className="w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-64"
                      data-testid="input-search-users"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table data-testid="table-users">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Username</TableHead>
                      <TableHead>Full Name</TableHead>
                      <TableHead>User Type</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id} data-testid={`row-user-${user.id}`}>
                        <TableCell className="font-medium">{user.username}</TableCell>
                        <TableCell>{user.fullName}</TableCell>
                        <TableCell>
                          <Badge variant="outline" data-testid={`badge-role-${user.id}`}>
                            {user.userType === 'student' ? 'Student' :
                             user.userType === 'viewer' ? 'Viewer' :
                             user.userType === 'school' ? 'School' :
                             user.userType === 'super_admin' ? 'Super Admin' :
                             user.userType}
                          </Badge>
                        </TableCell>
                        <TableCell>{user.email || 'N/A'}</TableCell>
                        <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="sm" data-testid={`button-delete-user-${user.id}`}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete User</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete user "{user.username}"? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteUser(user.id, user.username)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Schools Tab */}
          <TabsContent value="schools" data-testid="content-schools">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>School Management</CardTitle>
                  <div className="flex items-center space-x-2">
                    <Search className="w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search schools..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-64"
                      data-testid="input-search-schools"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table data-testid="table-schools">
                  <TableHeader>
                    <TableRow>
                      <TableHead>School Name</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Founded</TableHead>
                      <TableHead>School Code</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSchools.map((school) => (
                      <TableRow key={school.id} data-testid={`row-school-${school.id}`}>
                        <TableCell className="font-medium">{school.name}</TableCell>
                        <TableCell>{school.city}, {school.country}</TableCell>
                        <TableCell>{school.yearFounded}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{school.schoolCode}</Badge>
                        </TableCell>
                        <TableCell>{school.email}</TableCell>
                        <TableCell>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="sm" data-testid={`button-delete-school-${school.id}`}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete School</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{school.name}"? This will remove all associated data.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteSchool(school.id, school.name)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pending Schools Tab */}
          <TabsContent value="pending-schools" data-testid="content-pending-schools">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>School Registration Requests</CardTitle>
                  <Badge variant="outline">
                    {pendingSchools.length} Pending
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {pendingSchools.length === 0 ? (
                  <div className="text-center py-8">
                    <School className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">No pending school requests</p>
                  </div>
                ) : (
                  <div className="space-y-4" data-testid="list-pending-schools">
                    {pendingSchools.map((school) => (
                      <Card key={school.id} className="border-l-4 border-l-yellow-500" data-testid={`card-pending-school-${school.id}`}>
                        <CardContent className="p-6">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                                {school.name}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                Submitted on {new Date(school.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex space-x-2">
                              <Button 
                                size="sm" 
                                onClick={() => approveSchool(school.id, school.name)}
                                data-testid={`button-approve-school-${school.id}`}
                              >
                                <UserCheck className="w-4 h-4 mr-1" />
                                Approve
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="destructive" size="sm" data-testid={`button-reject-school-${school.id}`}>
                                    <Trash2 className="w-4 h-4 mr-1" />
                                    Reject
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Reject School Registration</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to reject "{school.name}"'s registration request?
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => rejectSchool(school.id, school.name, "Registration rejected by administrator")}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Reject
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                            <div>
                              <h4 className="font-medium text-slate-700 dark:text-slate-300 mb-1">School Information</h4>
                              <div className="space-y-1">
                                <p><span className="text-muted-foreground">Location:</span> {school.city}, {school.country}</p>
                                <p><span className="text-muted-foreground">Founded:</span> {school.yearFounded}</p>
                                <p><span className="text-muted-foreground">Email:</span> {school.email}</p>
                                {school.address && (
                                  <p><span className="text-muted-foreground">Address:</span> {school.address}</p>
                                )}
                              </div>
                            </div>

                            <div>
                              <h4 className="font-medium text-slate-700 dark:text-slate-300 mb-1">Admin Credentials</h4>
                              <div className="space-y-1">
                                <p><span className="text-muted-foreground">Username:</span> <code className="bg-muted px-1 py-0.5 rounded text-xs">{school.tempAdminCredentials?.username || 'N/A'}</code></p>
                              </div>
                            </div>

                            <div>
                              <h4 className="font-medium text-slate-700 dark:text-slate-300 mb-1">Registration Details</h4>
                              <div className="space-y-1">
                                {school.registrationNumber ? (
                                  <p><span className="text-muted-foreground">Reg. Number:</span> {school.registrationNumber}</p>
                                ) : (
                                  <p><span className="text-muted-foreground">Reg. Number:</span> <span className="text-slate-400">Not provided</span></p>
                                )}
                                {school.accreditationDocument ? (
                                  <div className="flex items-center space-x-2">
                                    <span className="text-muted-foreground">Accreditation:</span>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => window.open(`/${school.accreditationDocument}`, '_blank')}
                                      className="text-xs h-6 px-2"
                                      data-testid={`button-view-document-${school.id}`}
                                    >
                                      View Document
                                    </Button>
                                  </div>
                                ) : (
                                  <p><span className="text-muted-foreground">Accreditation:</span> <span className="text-slate-400">Not provided</span></p>
                                )}
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
          </TabsContent>

          {/* Alumni Tab */}
          <TabsContent value="alumni" data-testid="content-alumni">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Alumni Badge Management</CardTitle>
                  <div className="flex items-center space-x-2">
                    <Search className="w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search alumni..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-64"
                      data-testid="input-search-alumni"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table data-testid="table-alumni">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Full Name</TableHead>
                      <TableHead>School</TableHead>
                      <TableHead>Graduation Year</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBadges.map((badge) => (
                      <TableRow key={badge.id} data-testid={`row-badge-${badge.id}`}>
                        <TableCell className="font-medium">{badge.fullName}</TableCell>
                        <TableCell>{badge.school}</TableCell>
                        <TableCell>{badge.graduationYear}</TableCell>
                        <TableCell>
                          <Badge variant={badge.status === 'verified' ? 'default' : 'secondary'}>
                            {badge.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(badge.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            {badge.status === 'pending' && (
                              <Button
                                size="sm"
                                onClick={() => updateAlumniBadgeStatus(badge.id, 'verified')}
                                data-testid={`button-approve-badge-${badge.id}`}
                              >
                                Approve
                              </Button>
                            )}
                            {badge.status === 'verified' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateAlumniBadgeStatus(badge.id, 'pending')}
                                data-testid={`button-revoke-badge-${badge.id}`}
                              >
                                Revoke
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Yearbook Management Tab */}
          <TabsContent value="yearbooks" data-testid="content-yearbooks">
            <div className="space-y-6">
              {!selectedSchoolForYears ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Yearbook Management</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Select a school to manage their yearbook access and unlocked years
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2 mb-4">
                        <Search className="w-4 h-4 text-muted-foreground" />
                        <Input
                          placeholder="Search schools..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-64"
                          data-testid="input-search-schools-yearbooks"
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredSchools.map((school) => (
                          <Card key={school.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors" data-testid={`card-school-yearbook-${school.id}`}>
                            <CardContent className="p-4" onClick={() => {
                              setSelectedSchoolForYears(school);
                              fetchSchoolYears(school.id);
                            }}>
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                                  <School className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div className="flex-1">
                                  <h3 className="font-medium text-sm">{school.name}</h3>
                                  <p className="text-xs text-muted-foreground">{school.city}, {school.country}</p>
                                  <p className="text-xs text-muted-foreground">Founded: {school.yearFounded}</p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="flex items-center space-x-2">
                            <School className="w-5 h-5" />
                            <span>{selectedSchoolForYears.name}</span>
                          </CardTitle>
                          <p className="text-sm text-muted-foreground">
                            {selectedSchoolForYears.city}, {selectedSchoolForYears.country} • Founded {selectedSchoolForYears.yearFounded}
                          </p>
                        </div>
                        <Button variant="outline" onClick={() => {
                          setSelectedSchoolForYears(null);
                          setSchoolYears(null);
                        }} data-testid="button-back-to-schools">
                          Back to Schools
                        </Button>
                      </div>
                    </CardHeader>
                  </Card>

                  {yearLoading ? (
                    <Card>
                      <CardContent className="p-8 text-center">
                        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                        <p className="text-muted-foreground">Loading school years...</p>
                      </CardContent>
                    </Card>
                  ) : schoolYears ? (
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle>Year Access Management</CardTitle>
                            <p className="text-sm text-muted-foreground">
                              Control which years {selectedSchoolForYears.name} has access to. Green = Unlocked, Red = Locked
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant={yearsViewMode === 'grid' ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => setYearsViewMode('grid')}
                              data-testid="button-grid-view"
                            >
                              <Grid className="w-4 h-4" />
                            </Button>
                            <Button
                              variant={yearsViewMode === 'list' ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => setYearsViewMode('list')}
                              data-testid="button-list-view"
                            >
                              <List className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {yearsViewMode === 'grid' ? (
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            {schoolYears.years.map((yearData: any) => (
                              <Card key={yearData.year} className={`border-2 ${yearData.purchased ? 'border-green-500 bg-green-50 dark:bg-green-950' : 'border-gray-300 bg-gray-50 dark:bg-gray-950'}`} data-testid={`card-year-${yearData.year}`}>
                                <CardContent className="p-3 text-center">
                                  <div className="flex items-center justify-center mb-2">
                                    {yearData.purchased ? (
                                      <Calendar className="w-5 h-5 text-green-600 dark:text-green-400" />
                                    ) : (
                                      <Lock className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                                    )}
                                  </div>
                                  <h3 className="font-bold text-lg">{yearData.year}</h3>
                                  <p className="text-xs text-muted-foreground mb-2">
                                    {yearData.purchased ? 'Access Granted' : 'Not Purchased'}
                                  </p>
                                  {yearData.purchaseDate && (
                                    <p className="text-xs text-green-600 dark:text-green-400 mb-2">
                                      Unlocked: {new Date(yearData.purchaseDate).toLocaleDateString()}
                                    </p>
                                  )}
                                  <Button
                                    size="sm"
                                    variant={yearData.purchased ? "secondary" : "default"}
                                    disabled={yearData.purchased}
                                    onClick={yearData.purchased ? undefined : () => handleUnlockClick(selectedSchoolForYears.id, yearData.year, selectedSchoolForYears.name)}
                                    className="w-full text-xs"
                                    data-testid={`button-toggle-year-${yearData.year}`}
                                  >
                                    {yearData.purchased ? 'Purchased' : 'Unlock'}
                                  </Button>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {schoolYears.years.map((yearData: any) => (
                              <div key={yearData.year} className={`flex items-center justify-between p-4 rounded-lg border-2 ${yearData.purchased ? 'border-green-500 bg-green-50 dark:bg-green-950' : 'border-gray-300 bg-gray-50 dark:bg-gray-950'}`} data-testid={`row-year-${yearData.year}`}>
                                <div className="flex items-center space-x-3">
                                  {yearData.purchased ? (
                                    <Calendar className="w-5 h-5 text-green-600 dark:text-green-400" />
                                  ) : (
                                    <Lock className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                                  )}
                                  <div>
                                    <h3 className="font-bold text-lg">{yearData.year}</h3>
                                    <p className="text-sm text-muted-foreground">
                                      {yearData.purchased ? 'Access Granted' : 'Not Purchased'}
                                    </p>
                                    {yearData.purchaseDate && (
                                      <p className="text-sm text-green-600 dark:text-green-400">
                                        Unlocked: {new Date(yearData.purchaseDate).toLocaleDateString()}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <Button
                                  size="sm"
                                  variant={yearData.purchased ? "secondary" : "default"}
                                  disabled={yearData.purchased}
                                  onClick={yearData.purchased ? undefined : () => handleUnlockClick(selectedSchoolForYears.id, yearData.year, selectedSchoolForYears.name)}
                                  data-testid={`button-toggle-year-${yearData.year}`}
                                >
                                  {yearData.purchased ? 'Purchased' : 'Unlock'}
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ) : null}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Activity Logs Tab */}
          <TabsContent value="logs" data-testid="content-logs">
            <Card>
              <CardHeader>
                <CardTitle>Admin Activity Logs</CardTitle>
              </CardHeader>
              <CardContent>
                <Table data-testid="table-logs">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Target Type</TableHead>
                      <TableHead>Target ID</TableHead>
                      <TableHead>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {adminLogs.slice(0, 50).map((log) => (
                      <TableRow key={log.id} data-testid={`row-log-${log.id}`}>
                        <TableCell>{new Date(log.createdAt).toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{log.action}</Badge>
                        </TableCell>
                        <TableCell>{log.targetType}</TableCell>
                        <TableCell className="font-mono text-xs">{log.targetId}</TableCell>
                        <TableCell>
                          {log.details && Object.keys(log.details).length > 0 && (
                            <code className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                              {JSON.stringify(log.details)}
                            </code>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Confirmation Dialog */}
        <AlertDialog open={confirmationDialogOpen} onOpenChange={setConfirmationDialogOpen}>
          <AlertDialogContent data-testid="dialog-confirm-unlock">
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Year Unlock</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to unlock the {pendingUnlockData?.year} yearbook for "{pendingUnlockData?.schoolName}"?
                <br /><br />
                This will grant the school access to this year without requiring payment.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={cancelUnlock} data-testid="button-cancel-unlock">
                No, Cancel
              </AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmUnlock} data-testid="button-confirm-unlock">
                Yes, Continue
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Password Verification Dialog */}
        <AlertDialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
          <AlertDialogContent data-testid="dialog-password-verification">
            <AlertDialogHeader>
              <AlertDialogTitle>Enter Admin Password</AlertDialogTitle>
              <AlertDialogDescription>
                Please enter your super-admin password to confirm this action.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4">
              <Input
                type="password"
                placeholder="Enter your password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handlePasswordSubmit()}
                data-testid="input-admin-password"
              />
              {passwordError && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-2" data-testid="text-password-error">
                  {passwordError}
                </p>
              )}
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={cancelUnlock} data-testid="button-cancel-password">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction onClick={handlePasswordSubmit} data-testid="button-submit-password">
                Verify & Unlock
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  );
}