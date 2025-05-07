import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Input,
  Checkbox,
} from '@material-tailwind/react';
import { ArrowLeft } from 'lucide-react';
import { UserRole, VehicleCategory } from '@/types/supabase';
import { supabase } from '@/integrations/supabase/client';

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
          <div className="bg-white shadow rounded-lg p-8">
            <h2 className="text-2xl font-semibold mb-4">Créer votre compte</h2>
            <p className="text-gray-600 mb-6">
              Renseignez vos informations pour créer un nouveau compte
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-gray-700 text-sm font-bold mb-2">
                  Email
                </label>
                <Input
                  type="email"
                  id="email"
                  placeholder="votre@email.com"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-gray-700 text-sm font-bold mb-2">
                  Mot de passe
                </label>
                <Input
                  type="password"
                  id="password"
                  placeholder="********"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="fullName" className="block text-gray-700 text-sm font-bold mb-2">
                  Nom Complet
                </label>
                <Input
                  type="text"
                  id="fullName"
                  placeholder="John Doe"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="companyName" className="block text-gray-700 text-sm font-bold mb-2">
                  Nom de l'entreprise
                </label>
                <Input
                  type="text"
                  id="companyName"
                  placeholder="Votre Société SAS"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="siret" className="block text-gray-700 text-sm font-bold mb-2">
                  Numéro SIRET
                </label>
                <Input
                  type="text"
                  id="siret"
                  placeholder="12345678901234"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  value={siret}
                  onChange={(e) => setSiret(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="phone1" className="block text-gray-700 text-sm font-bold mb-2">
                  Téléphone (principal)
                </label>
                <Input
                  type="text"
                  id="phone1"
                  placeholder="+33 612345678"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  value={phone1}
                  onChange={(e) => setPhone1(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="phone2" className="block text-gray-700 text-sm font-bold mb-2">
                  Téléphone (secondaire - optionnel)
                </label>
                <Input
                  type="text"
                  id="phone2"
                  placeholder="+33 612345679"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  value={phone2}
                  onChange={(e) => setPhone2(e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="tvaApplicable" className="block text-gray-700 text-sm font-bold mb-2">
                  TVA Applicable?
                </label>
                <Checkbox
                  id="tvaApplicable"
                  label="TVA Applicable"
                  checked={tvaApplicable}
                  onChange={(e) => setTvaApplicable(e.target.checked)}
                />
              </div>

              {tvaApplicable && (
                <div>
                  <label htmlFor="tvaNumb" className="block text-gray-700 text-sm font-bold mb-2">
                    Numéro TVA
                  </label>
                  <Input
                    type="text"
                    id="tvaNumb"
                    placeholder="FR12345678901"
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    value={tvaNumb}
                    onChange={(e) => setTvaNumb(e.target.value)}
                  />
                </div>
              )}

              <div>
                <label htmlFor="licenseNumber" className="block text-gray-700 text-sm font-bold mb-2">
                  Numéro de permis de conduire
                </label>
                <Input
                  type="text"
                  id="licenseNumber"
                  placeholder="12AB34567890"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="vehicleType" className="block text-gray-700 text-sm font-bold mb-2">
                  Type de véhicule
                </label>
                <Input
                  type="text"
                  id="vehicleType"
                  placeholder="Citadine"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value)}
                />
              </div>

              <div>
                <Checkbox
                  id="gdprConsent"
                  label={
                    <>
                      J'accepte les <a href="/terms" className="text-blue-500 hover:underline">Conditions d'utilisation</a> et la <a href="/privacy" className="text-blue-500 hover:underline">Politique de confidentialité</a>.
                    </>
                  }
                  checked={gdprConsent}
                  onChange={(e) => setGdprConsent(e.target.checked)}
                />
              </div>

              {error && <p className="text-red-500 text-sm">{error}</p>}

              <button
                type="submit"
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                disabled={loading}
              >
                {loading ? 'Création du compte...' : 'Créer mon compte'}
              </button>
            </form>
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Vous avez déjà un compte ?{' '}
                <Link to="/login" className="text-blue-500 hover:underline">
                  Connectez-vous ici
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
