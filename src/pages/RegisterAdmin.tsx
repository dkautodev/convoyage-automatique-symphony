import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import AddressAutocomplete from '@/components/AddressAutocomplete';
import AddressMap from '@/components/AddressMap';
import PasswordStrengthMeter from '@/components/PasswordStrengthMeter';
import { formatSiret, isAdminEmailAllowed } from '@/utils/validation';
import { ArrowLeft, Eye, EyeOff, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { typedSupabase } from '@/types/database';

const adminRegisterSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' })
    .refine(isAdminEmailAllowed, {
      message: 'This email domain is not authorized for admin registration',
    }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters' }),
  companyName: z.string().min(2, { message: 'Company name is required' }),
  billingAddress: z.string().min(5, { message: 'Billing address is required' }),
  placeId: z.string().optional(),
  siret: z.string().refine(val => /^\d{14}$/.test(val.replace(/\s/g, '')), {
    message: 'SIRET must be exactly 14 digits',
  }),
  tvaNumb: z.string().min(1, { message: 'VAT number is required for admin accounts' }),
  phone1: z.string().refine(val => /^\+\d{1,4}\s?\d{6,14}$/.test(val.replace(/\s/g, '')), {
    message: 'Please enter a valid international phone number',
  }),
  phone2: z.string().optional(),
  gdprConsent: z.boolean().refine(val => val === true, {
    message: 'You must agree to the terms and conditions',
  }),
  adminToken: z.string().min(6, { message: 'Valid admin invitation token required' }),
});

type AdminFormData = z.infer<typeof adminRegisterSchema>;

export default function RegisterAdmin() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [mapCoords, setMapCoords] = useState<{lat: number; lng: number} | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<AdminFormData>({
    resolver: zodResolver(adminRegisterSchema),
    defaultValues: {
      email: '',
      password: '',
      companyName: '',
      billingAddress: '',
      placeId: '',
      siret: '',
      tvaNumb: '',
      phone1: '',
      phone2: '',
      gdprConsent: false,
      adminToken: '',
    },
  });

  const onAddressSelect = async (address: string, placeId: string) => {
    form.setValue('billingAddress', address);
    form.setValue('placeId', placeId);
    
    // Simulate getting coordinates from Google Maps API
    setMapCoords({
      lat: 48.8566 + Math.random() * 0.01,
      lng: 2.3522 + Math.random() * 0.01,
    });
  };

  const handleSiretChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatSiret(e.target.value);
    form.setValue('siret', formatted);
  };

  const onSubmit = async (data: AdminFormData) => {
    try {
      setIsSubmitting(true);
      console.log("Admin registration data:", data);
      
      // 1. Vérifier si le token d'invitation est valide
      const { data: tokenData, error: tokenError } = await typedSupabase
        .from('admin_tokens')
        .select('*')
        .eq('token', data.adminToken)
        .eq('used', false)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();
      
      if (tokenError) {
        toast.error("Error validating invitation token");
        throw tokenError;
      }
      
      if (!tokenData) {
        toast.error("Invalid or expired invitation token");
        throw new Error("Invalid or expired invitation token");
      }
      
      // 2. Créer l'utilisateur dans Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            role: 'admin', // Définir le rôle comme admin dans les métadonnées
            fullName: data.companyName,  // Utiliser le nom de la société comme nom complet
            companyName: data.companyName,
            billingAddress: JSON.stringify({
              street: data.billingAddress,
              formatted_address: data.billingAddress,
              lat: mapCoords?.lat,
              lng: mapCoords?.lng,
              city: "", // Ces valeurs seront complétées plus tard
              postal_code: "",
              country: ""
            }),
            siret: data.siret.replace(/\s/g, ''),
            vatNumber: data.tvaNumb,
            phone1: data.phone1,
            phone2: data.phone2 || null,
          }
        }
      });
      
      if (authError) {
        toast.error("Failed to create admin account: " + authError.message);
        throw authError;
      }
      
      if (!authData.user) {
        toast.error("User creation failed");
        throw new Error("User creation failed");
      }

      // 3. Marquer le token comme utilisé
      const { error: tokenUpdateError } = await typedSupabase
        .from('admin_tokens')
        .update({
          used: true,
          used_at: new Date().toISOString()
        })
        .eq('token', data.adminToken);
      
      if (tokenUpdateError) {
        console.error('Error marking token as used:', tokenUpdateError);
        // On continue malgré cette erreur car le compte a été créé
      }
      
      toast.success('Admin registration successful! Please sign in with your credentials.');
      
      // Navigate to login page
      navigate('/login');
    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error('Admin registration failed: ' + (error.message || 'Please check your information and try again'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col">
      <div className="container mx-auto p-4">
        <div className="max-w-3xl mx-auto my-8">
          {/* Back link */}
          <Link to="/" className="inline-flex items-center text-sm mb-6 hover:underline">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to home
          </Link>
          
          <Card>
            <CardHeader className="border-b">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-5 w-5 text-admin" />
                <CardTitle className="text-2xl">Admin Registration</CardTitle>
              </div>
              <CardDescription>
                Create your administrator account with enhanced privileges.
              </CardDescription>
            </CardHeader>
            
            <CardContent className="pt-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Admin Token */}
                  <FormField
                    control={form.control}
                    name="adminToken"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Admin Invitation Token</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your admin token" {...field} />
                        </FormControl>
                        <FormDescription>
                          Enter the invitation token provided by system administrators.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Email field */}
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="admin@dkautomotive.fr" {...field} />
                          </FormControl>
                          <FormDescription>
                            Must be from an authorized domain.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {/* Password field */}
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input 
                                type={showPassword ? "text" : "password"} 
                                placeholder="••••••••" 
                                {...field} 
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3"
                                onClick={() => setShowPassword(!showPassword)}
                              >
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                              </Button>
                            </div>
                          </FormControl>
                          <PasswordStrengthMeter password={field.value} />
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {/* Company name */}
                    <FormField
                      control={form.control}
                      name="companyName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Your Company Ltd" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {/* SIRET number */}
                    <FormField
                      control={form.control}
                      name="siret"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>SIRET Number</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="123 456 789 00012" 
                              value={field.value}
                              onChange={handleSiretChange}
                              onBlur={field.onBlur}
                              name={field.name}
                              ref={field.ref}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {/* TVA Number */}
                    <FormField
                      control={form.control}
                      name="tvaNumb"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>VAT Number</FormLabel>
                          <FormControl>
                            <Input placeholder="FR12345678901" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {/* Phone 1 */}
                    <FormField
                      control={form.control}
                      name="phone1"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone (primary)</FormLabel>
                          <FormControl>
                            <Input placeholder="+33 612345678" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {/* Phone 2 */}
                    <FormField
                      control={form.control}
                      name="phone2"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone (secondary - optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="+33 612345678" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  {/* Address with map */}
                  <FormField
                    control={form.control}
                    name="billingAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Billing Address</FormLabel>
                        <FormControl>
                          <AddressAutocomplete
                            value={field.value}
                            onChange={field.onChange}
                            onSelect={onAddressSelect}
                            placeholder="Start typing your address..."
                            error={form.formState.errors.billingAddress?.message}
                          />
                        </FormControl>
                        {mapCoords && <div className="mt-2">
                          <AddressMap lat={mapCoords.lat} lng={mapCoords.lng} />
                        </div>}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* GDPR Consent */}
                  <FormField
                    control={form.control}
                    name="gdprConsent"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Terms & Privacy Policy</FormLabel>
                          <FormDescription>
                            By checking this box, you agree to our{' '}
                            <Link to="/terms" className="text-primary hover:underline">
                              Terms of Service
                            </Link>{' '}
                            and{' '}
                            <Link to="/privacy" className="text-primary hover:underline">
                              Privacy Policy
                            </Link>.
                          </FormDescription>
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-admin hover:bg-admin-dark"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 border-t-2 border-r-2 border-white rounded-full animate-spin"></div>
                        <span>Creating admin account...</span>
                      </div>
                    ) : (
                      'Create Admin Account'
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
            
            <CardFooter className="flex justify-center border-t pt-6">
              <p className="text-sm text-muted-foreground">
                <Link to="/login" className="text-primary hover:underline">
                  Return to login
                </Link>
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
