
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
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
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AddressAutocomplete from '@/components/AddressAutocomplete';
import AddressMap from '@/components/AddressMap';
import PasswordStrengthMeter from '@/components/PasswordStrengthMeter';
import { UserRole } from '@/types/supabase';
import { formatSiret } from '@/utils/validation';
import { Eye, EyeOff, ArrowLeft, User, UserCog } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const registerSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters' }),
  companyName: z.string().min(2, { message: 'Company name is required' }),
  billingAddress: z.string().min(5, { message: 'Billing address is required' }),
  placeId: z.string().optional(),
  siret: z.string().refine(val => /^\d{14}$/.test(val.replace(/\s/g, '')), {
    message: 'SIRET must be exactly 14 digits',
  }),
  tvaNumb: z.string().optional(),
  tvaApplicable: z.boolean().optional(),
  phone1: z.string().refine(val => /^\+\d{1,4}\s?\d{6,14}$/.test(val.replace(/\s/g, '')), {
    message: 'Please enter a valid international phone number',
  }),
  phone2: z.string().optional(),
  gdprConsent: z.boolean().refine(val => val === true, {
    message: 'You must agree to the terms and conditions',
  }),
  role: z.enum(['client', 'chauffeur', 'admin']),
  fullName: z.string().optional(),
  licenseNumber: z.string().optional(),
  vehicleType: z.string().optional(),
});

type FormData = z.infer<typeof registerSchema>;

export default function Register() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialRole = (searchParams.get('role') as UserRole) || 'client';
  const [selectedTab, setSelectedTab] = useState<UserRole>(initialRole);
  const [showPassword, setShowPassword] = useState(false);
  const [mapCoords, setMapCoords] = useState<{lat: number; lng: number} | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register: registerUser } = useAuth();
  
  const form = useForm<FormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      fullName: '',
      companyName: '',
      billingAddress: '',
      placeId: '',
      siret: '',
      tvaNumb: '',
      tvaApplicable: initialRole === 'chauffeur' ? false : undefined,
      phone1: '',
      phone2: '',
      gdprConsent: false,
      role: initialRole,
      licenseNumber: '',
      vehicleType: '',
    },
  });
  
  // When tab changes, update the form's role value and reset TVA applicable if needed
  useEffect(() => {
    form.setValue('role', selectedTab);
    
    if (selectedTab === 'chauffeur') {
      form.setValue('tvaApplicable', false);
    } else {
      form.setValue('tvaApplicable', undefined);
      if (selectedTab === 'client') {
        form.setValue('tvaNumb', '');
      }
    }
    
    // Update URL to reflect selected role
    navigate(`/register?role=${selectedTab}`, { replace: true });
  }, [selectedTab, form, navigate]);

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

  const onSubmit = async (data: FormData) => {
    try {
      setIsSubmitting(true);
      console.log("Registration data:", data);
      
      // Préparer les données pour l'inscription
      const registerData: RegisterFormData = {
        email: data.email,
        password: data.password,
        fullName: data.fullName || undefined,
        companyName: data.companyName,
        billingAddress: {
          street: data.billingAddress,
          city: "", // Ces valeurs seront remplies par l'autocomplétion
          postal_code: "",
          country: "",
          formatted_address: data.billingAddress,
          lat: mapCoords?.lat,
          lng: mapCoords?.lng
        },
        siret: data.siret.replace(/\s/g, ''),
        tvaNumb: data.tvaNumb || undefined,
        phone1: data.phone1,
        phone2: data.phone2 || undefined,
        gdprConsent: data.gdprConsent,
        role: data.role,
        tvaApplicable: data.role === 'chauffeur' ? data.tvaApplicable : undefined,
        licenseNumber: data.licenseNumber || undefined,
        vehicleType: data.vehicleType || undefined
      };
      
      // Appeler la fonction register du contexte d'authentification
      await registerUser(registerData);
      
    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error('Registration failed: ' + (error.message || 'Please check your information and try again'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Determine if TVA field should be shown
  const showTvaField = selectedTab === 'client' || 
                      (selectedTab === 'chauffeur' && form.watch('tvaApplicable'));

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
            <CardHeader>
              <CardTitle className="text-2xl">Create your account</CardTitle>
              <CardDescription>
                Register to start managing your vehicle convoys efficiently.
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <Tabs value={selectedTab} onValueChange={(value: string) => setSelectedTab(value as UserRole)}>
                <TabsList className="grid grid-cols-2 mb-8">
                  <TabsTrigger value="client" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>Client</span>
                  </TabsTrigger>
                  <TabsTrigger value="chauffeur" className="flex items-center gap-2">
                    <UserCog className="h-4 w-4" />
                    <span>Driver</span>
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="client">
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <div className="grid md:grid-cols-2 gap-6">
                        {/* Email field */}
                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input type="email" placeholder="your@email.com" {...field} />
                              </FormControl>
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
                        
                        {/* Full Name */}
                        <FormField
                          control={form.control}
                          name="fullName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Full Name</FormLabel>
                              <FormControl>
                                <Input placeholder="John Doe" {...field} />
                              </FormControl>
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
                        className="w-full bg-client hover:bg-client-dark"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <div className="flex items-center gap-2">
                            <div className="h-4 w-4 border-t-2 border-r-2 border-white rounded-full animate-spin"></div>
                            <span>Creating account...</span>
                          </div>
                        ) : (
                          'Create Client Account'
                        )}
                      </Button>
                    </form>
                  </Form>
                </TabsContent>
                
                <TabsContent value="chauffeur">
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <div className="grid md:grid-cols-2 gap-6">
                        {/* Email field */}
                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input type="email" placeholder="your@email.com" {...field} />
                              </FormControl>
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
                        
                        {/* Full Name */}
                        <FormField
                          control={form.control}
                          name="fullName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Full Name</FormLabel>
                              <FormControl>
                                <Input placeholder="John Doe" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        {/* License Number */}
                        <FormField
                          control={form.control}
                          name="licenseNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>License Number</FormLabel>
                              <FormControl>
                                <Input placeholder="Your driver license number" {...field} />
                              </FormControl>
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
                        
                        {/* Vehicle Type */}
                        <FormField
                          control={form.control}
                          name="vehicleType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Vehicle Type</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g. berline" {...field} />
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
                        
                        {/* TVA Applicable toggle */}
                        <FormField
                          control={form.control}
                          name="tvaApplicable"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                              <div className="space-y-0.5">
                                <FormLabel>TVA Applicable?</FormLabel>
                                <FormDescription>
                                  Select if you need to charge VAT
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        {/* TVA Number - conditional */}
                        {form.watch('tvaApplicable') && (
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
                        )}
                        
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
                        className="w-full bg-driver hover:bg-driver-dark"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <div className="flex items-center gap-2">
                            <div className="h-4 w-4 border-t-2 border-r-2 border-white rounded-full animate-spin"></div>
                            <span>Creating account...</span>
                          </div>
                        ) : (
                          'Create Driver Account'
                        )}
                      </Button>
                    </form>
                  </Form>
                </TabsContent>
              </Tabs>
            </CardContent>
            
            <CardFooter className="flex flex-col items-center border-t pt-6">
              <p className="text-sm text-muted-foreground mb-2">
                Already have an account?{' '}
                <Link to="/login" className="text-primary hover:underline">
                  Login here
                </Link>
              </p>
              
              {/* Admin registration link */}
              <p className="text-xs text-muted-foreground mt-4">
                <Link to="/register-admin" className="hover:underline">
                  Admin registration
                </Link>
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
