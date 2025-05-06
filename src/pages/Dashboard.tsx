
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { User, Clipboard, Truck, MapPin, Calendar, Settings, LogOut } from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get user role from URL path
  const path = location.pathname;
  let userRole = 'client'; // default
  
  if (path.includes('/admin')) {
    userRole = 'admin';
  } else if (path.includes('/driver')) {
    userRole = 'driver';
  }
  
  const handleLogout = () => {
    // In a real app, this would call supabase.auth.signOut()
    toast.success('Successfully logged out');
    navigate('/login');
  };
  
  return (
    <div className="min-h-screen bg-muted/30">
      {/* Sidebar and header would be here in a complete implementation */}
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <div className={`w-64 bg-white border-r p-4 flex flex-col ${
          userRole === 'admin' ? 'bg-admin-light/10' :
          userRole === 'driver' ? 'bg-driver-light/10' :
          'bg-client-light/10'
        }`}>
          <div className="flex items-center gap-2 mb-8">
            <MapPin className={`h-6 w-6 ${
              userRole === 'admin' ? 'text-admin' :
              userRole === 'driver' ? 'text-driver' :
              'text-client'
            }`} />
            <h1 className="text-xl font-bold">ConvoySync</h1>
          </div>
          
          <nav className="space-y-1 flex-1">
            <Button variant="ghost" className="w-full justify-start">
              <Clipboard className="mr-2 h-4 w-4" />
              Dashboard
            </Button>
            
            {userRole === 'admin' && (
              <>
                <Button variant="ghost" className="w-full justify-start">
                  <User className="mr-2 h-4 w-4" />
                  Users
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  <Truck className="mr-2 h-4 w-4" />
                  Drivers
                </Button>
              </>
            )}
            
            {userRole === 'client' && (
              <>
                <Button variant="ghost" className="w-full justify-start">
                  <Truck className="mr-2 h-4 w-4" />
                  Orders
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  <Calendar className="mr-2 h-4 w-4" />
                  Schedule
                </Button>
              </>
            )}
            
            {userRole === 'driver' && (
              <>
                <Button variant="ghost" className="w-full justify-start">
                  <Calendar className="mr-2 h-4 w-4" />
                  Missions
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  <MapPin className="mr-2 h-4 w-4" />
                  Routes
                </Button>
              </>
            )}
            
            <Button variant="ghost" className="w-full justify-start">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button>
          </nav>
          
          <div className="border-t pt-4 mt-4">
            <Button variant="ghost" className="w-full justify-start text-muted-foreground" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
        
        {/* Main content */}
        <div className="flex-1 p-6">
          <div className="mb-8">
            <h2 className={`text-2xl font-bold ${
              userRole === 'admin' ? 'text-admin' :
              userRole === 'driver' ? 'text-driver' :
              'text-client'
            }`}>
              {userRole === 'admin' ? 'Admin Dashboard' :
               userRole === 'driver' ? 'Driver Dashboard' :
               'Client Dashboard'}
            </h2>
            <p className="text-muted-foreground">Welcome back! Here's an overview of your activity.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Active Missions</CardTitle>
                <CardDescription>Current convoys in progress</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">
                  {userRole === 'admin' ? '24' : userRole === 'driver' ? '3' : '5'}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">
                  {userRole === 'admin' ? 'Total Users' : 
                   userRole === 'driver' ? 'Completed Missions' : 
                   'Pending Orders'}
                </CardTitle>
                <CardDescription>
                  {userRole === 'admin' ? 'Active accounts on platform' :
                   userRole === 'driver' ? 'Successfully delivered' :
                   'Awaiting processing'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">
                  {userRole === 'admin' ? '158' : userRole === 'driver' ? '42' : '2'}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">
                  {userRole === 'admin' ? 'Revenue' : 
                   userRole === 'driver' ? 'Earnings' : 
                   'Total Spent'}
                </CardTitle>
                <CardDescription>Current month</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">
                  €{userRole === 'admin' ? '24,500' : 
                     userRole === 'driver' ? '1,840' : 
                     '3,250'}
                </p>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Your latest {userRole === 'admin' ? 'platform' : 
                            userRole === 'driver' ? 'mission' : 
                            'order'} activity
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border-b pb-3 flex items-start justify-between">
                  <div>
                    <p className="font-medium">
                      {userRole === 'admin' ? 'New client registration' : 
                       userRole === 'driver' ? 'Mission #CV-2023-156 assigned' : 
                       'Order #CV-2023-156 placed'}
                    </p>
                    <p className="text-sm text-muted-foreground">Today at 10:25 AM</p>
                  </div>
                  <Button variant="ghost" size="sm">View</Button>
                </div>
                
                <div className="border-b pb-3 flex items-start justify-between">
                  <div>
                    <p className="font-medium">
                      {userRole === 'admin' ? 'Price configuration updated' : 
                       userRole === 'driver' ? 'Mission #CV-2023-142 completed' : 
                       'Invoice #INV-2023-052 paid'}
                    </p>
                    <p className="text-sm text-muted-foreground">Yesterday at 4:30 PM</p>
                  </div>
                  <Button variant="ghost" size="sm">View</Button>
                </div>
                
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">
                      {userRole === 'admin' ? 'System maintenance completed' : 
                       userRole === 'driver' ? 'Mission #CV-2023-137 route updated' : 
                       'Order #CV-2023-137 delivered'}
                    </p>
                    <p className="text-sm text-muted-foreground">May 5, 2025 at 9:15 AM</p>
                  </div>
                  <Button variant="ghost" size="sm">View</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
