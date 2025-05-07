
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { UserRole, VehicleCategory } from '@/types/supabase';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface RegisterProps {}

const Register: React.FC<RegisterProps> = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [siret, setSiret] = useState('');
  const [phone1, setPhone1] = useState('');
  const [phone2, setPhone2] = useState('');
  const [gdprConsent, setGdprConsent] = useState(false);
  const [role, setRole] = useState<UserRole>('client');
  const [tvaApplicable, setTvaApplicable] = useState(false);
  const [tvaNumb, setTvaNumb] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [vehicleType, setVehicleType] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleRoleChange = (newRole: UserRole) => {
    setRole(newRole);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation côté client (vous pouvez ajouter des validations plus robustes)
    if (!email || !password || !gdprConsent) {
      setError('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    setLoading(true);

    try {
      if (role === 'chauffeur') {
        await register({
          email,
          password,
          companyName,
          siret,
          phone1,
          phone2,
          gdprConsent,
          role,
          tvaApplicable,
          tvaNumb,
          licenseNumber,
          vehicleType: vehicleType as VehicleCategory,
        });
      } else {
        await register({
          email,
          password,
          companyName,
          siret,
          phone1,
          phone2,
          gdprConsent,
          role,
          fullName,
        });
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: any) => {
    try {
      setLoading(true);
      setError(null);

      const userMetadata = {
        role: data.role,
        fullName: data.fullName || data.companyName,
      };

      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: userMetadata,
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) {
        console.error("Erreur d'inscription:", error);
        throw error;
      }

      if (authData?.user) {
        toast.success('Inscription réussie ! Veuillez vérifier votre email pour confirmer votre compte.');
        navigate('/register-confirmation');
      }
    } catch (err: any) {
      console.error("Erreur d'inscription:", err);
      setError(err.message);
      toast.error('Échec de l\'inscription: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="container mx-auto p-4">
        <div className="max-w-md mx-auto my-8">
          <Link to="/" className="inline-flex items-center text-sm mb-6 hover:underline">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Retour à l'accueil
          </Link>
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Créer votre compte</CardTitle>
              <CardDescription>
                Renseignez vos informations pour créer un nouveau compte
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    type="email"
                    id="email"
                    placeholder="votre@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Mot de passe</Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      placeholder="********"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
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
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fullName">Nom Complet</Label>
                  <Input
                    type="text"
                    id="fullName"
                    placeholder="John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyName">Nom de l'entreprise</Label>
                  <Input
                    type="text"
                    id="companyName"
                    placeholder="Votre Société SAS"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="siret">Numéro SIRET</Label>
                  <Input
                    type="text"
                    id="siret"
                    placeholder="12345678901234"
                    value={siret}
                    onChange={(e) => setSiret(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone1">Téléphone (principal)</Label>
                  <Input
                    type="text"
                    id="phone1"
                    placeholder="+33 612345678"
                    value={phone1}
                    onChange={(e) => setPhone1(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone2">Téléphone (secondaire - optionnel)</Label>
                  <Input
                    type="text"
                    id="phone2"
                    placeholder="+33 612345679"
                    value={phone2}
                    onChange={(e) => setPhone2(e.target.value)}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="tvaApplicable"
                    checked={tvaApplicable}
                    onCheckedChange={(checked) => setTvaApplicable(checked as boolean)}
                  />
                  <Label htmlFor="tvaApplicable" className="text-sm">TVA Applicable</Label>
                </div>

                {tvaApplicable && (
                  <div className="space-y-2">
                    <Label htmlFor="tvaNumb">Numéro TVA</Label>
                    <Input
                      type="text"
                      id="tvaNumb"
                      placeholder="FR12345678901"
                      value={tvaNumb}
                      onChange={(e) => setTvaNumb(e.target.value)}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="licenseNumber">Numéro de permis de conduire</Label>
                  <Input
                    type="text"
                    id="licenseNumber"
                    placeholder="12AB34567890"
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vehicleType">Type de véhicule</Label>
                  <Input
                    type="text"
                    id="vehicleType"
                    placeholder="Citadine"
                    value={vehicleType}
                    onChange={(e) => setVehicleType(e.target.value)}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="gdprConsent"
                    checked={gdprConsent}
                    onCheckedChange={(checked) => setGdprConsent(checked as boolean)}
                  />
                  <Label htmlFor="gdprConsent" className="text-sm">
                    J'accepte les <a href="/terms" className="text-blue-500 hover:underline">Conditions d'utilisation</a> et la <a href="/privacy" className="text-blue-500 hover:underline">Politique de confidentialité</a>.
                  </Label>
                </div>

                {error && <p className="text-red-500 text-sm">{error}</p>}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? 'Création du compte...' : 'Créer mon compte'}
                </Button>
              </form>
            </CardContent>
            <CardFooter className="flex justify-center">
              <p className="text-sm text-gray-600">
                Vous avez déjà un compte ?{' '}
                <Link to="/login" className="text-blue-500 hover:underline">
                  Connectez-vous ici
                </Link>
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Register;
