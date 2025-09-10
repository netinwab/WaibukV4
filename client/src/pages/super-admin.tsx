import { useState, useEffect } from "react";
import SuperAdminLogin from "./super-admin-login";
import SuperAdminDashboard from "./super-admin-dashboard";

export default function SuperAdmin() {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already authenticated
    const token = localStorage.getItem('superAdminToken');
    if (token) {
      // Verify token by trying to fetch user data
      fetch('/api/super-admin/analytics', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      .then(response => {
        if (response.ok) {
          // Token is valid, set user state
          setUser({ id: token });
        } else {
          // Token is invalid, remove it
          localStorage.removeItem('superAdminToken');
        }
      })
      .catch(() => {
        // Error occurred, remove token
        localStorage.removeItem('superAdminToken');
      })
      .finally(() => {
        setIsLoading(false);
      });
    } else {
      setIsLoading(false);
    }
  }, []);

  const handleLogin = (userData: any) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('superAdminToken');
    setUser(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!user) {
    return <SuperAdminLogin onLogin={handleLogin} />;
  }

  return <SuperAdminDashboard user={user} onLogout={handleLogout} />;
}