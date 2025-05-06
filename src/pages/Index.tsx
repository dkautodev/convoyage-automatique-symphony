
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, User, UserCog, ChevronRight } from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-white">
        <div className="container mx-auto p-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <MapPin className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">ConvoySync</h1>
          </div>
          <div className="space-x-2">
            <Link to="/login">
              <Button variant="outline">Login</Button>
            </Link>
            <Link to="/register">
              <Button>Register</Button>
            </Link>
          </div>
        </div>
      </header>
      
      <main className="flex-1">
        <div className="container mx-auto p-4 py-16 max-w-5xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Vehicle Convoy Management</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Simplified logistics, automated calculations, and centralized data for 
              efficient vehicle convoy management.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 mb-16">
            <Card className="animate-fade-in">
              <CardContent className="p-6">
                <h3 className="text-2xl font-bold mb-4">Sign up as a Client</h3>
                <p className="text-muted-foreground mb-6">
                  Create a client account to manage your orders and track your vehicle convoys.
                </p>
                <div className="flex items-center gap-4 mb-6">
                  <div className="bg-client-light p-3 rounded-full">
                    <User className="h-6 w-6 text-client-dark" />
                  </div>
                  <div>
                    <p className="font-medium">Client Portal</p>
                    <p className="text-sm text-muted-foreground">For businesses needing transport services</p>
                  </div>
                </div>
                <Link to="/register?role=client">
                  <Button className="w-full bg-client hover:bg-client-dark">
                    Register as Client <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
            
            <Card className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
              <CardContent className="p-6">
                <h3 className="text-2xl font-bold mb-4">Sign up as a Driver</h3>
                <p className="text-muted-foreground mb-6">
                  Join our network of professional drivers and start receiving convoy missions.
                </p>
                <div className="flex items-center gap-4 mb-6">
                  <div className="bg-driver-light p-3 rounded-full">
                    <UserCog className="h-6 w-6 text-driver-dark" />
                  </div>
                  <div>
                    <p className="font-medium">Driver Portal</p>
                    <p className="text-sm text-muted-foreground">For professionals providing transport services</p>
                  </div>
                </div>
                <Link to="/register?role=driver">
                  <Button className="w-full bg-driver hover:bg-driver-dark">
                    Register as Driver <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
          
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">
              Already have an account?
            </p>
            <Link to="/login">
              <Button variant="outline" size="lg">
                Login to your account
              </Button>
            </Link>
          </div>
        </div>
      </main>
      
      <footer className="border-t bg-muted/30">
        <div className="container mx-auto p-4 text-center text-sm text-muted-foreground">
          <p>&copy; 2025 ConvoySync. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
