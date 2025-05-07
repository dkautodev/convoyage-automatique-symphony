
import React, { useState } from 'react';
import { toast } from 'sonner';
import { Eye, EyeOff } from 'lucide-react';
import { UserRole, VehicleCategory } from '@/types/supabase';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { useNavigate, Link } from 'react-router-dom';
import ProfileFields from './ProfileFields';
import TaxFields from './TaxFields';
import DriverFields from './DriverFields';

interface RegisterFormProps {}

const RegisterForm: React.FC<RegisterFormProps> = () => {
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
    <Card>
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
          
          <ProfileFields 
            fullName={fullName} 
            setFullName={setFullName} 
            companyName={companyName} 
            setCompanyName={setCompanyName}
            siret={siret}
            setSiret={setSiret}
            phone1={phone1}
            setPhone1={setPhone1}
            phone2={phone2}
            setPhone2={setPhone2}
          />

          <TaxFields 
            tvaApplicable={tvaApplicable}
            setTvaApplicable={setTvaApplicable}
            tvaNumb={tvaNumb}
            setTvaNumb={setTvaNumb}
          />

          <DriverFields 
            licenseNumber={licenseNumber}
            setLicenseNumber={setLicenseNumber}
            vehicleType={vehicleType}
            setVehicleType={setVehicleType}
          />

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
  );
};

export default RegisterForm;
