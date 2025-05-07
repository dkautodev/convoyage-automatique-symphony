
import React, { useState } from 'react';
import { toast } from 'sonner';
import { Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { useNavigate, Link } from 'react-router-dom';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface RegisterFormProps {}

const RegisterForm: React.FC<RegisterFormProps> = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [gdprConsent, setGdprConsent] = useState(false);
  const [role, setRole] = useState<'client' | 'chauffeur' | 'admin'>('client');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation côté client
    if (!email || !password || !gdprConsent) {
      setError('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    setLoading(true);

    try {
      console.log('Début inscription avec les données:', { email, role });
      
      // Inscription avec email, mot de passe et rôle dans les métadonnées
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role: role, // Utiliser directement le rôle sélectionné
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });
      
      if (signUpError) {
        console.error("Erreur d'inscription:", signUpError);
        throw signUpError;
      }
      
      console.log('Résultat inscription:', authData);
      
      if (authData?.user) {
        toast.success('Inscription réussie ! Veuillez vérifier votre email pour confirmer votre compte.');
        navigate('/register-confirmation');
      } else {
        throw new Error('Échec de création du compte utilisateur');
      }
    } catch (err: any) {
      console.error("Erreur d'inscription détaillée:", err);
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
          
          <div className="space-y-2">
            <Label>Type de compte</Label>
            <RadioGroup 
              value={role} 
              onValueChange={(value) => setRole(value as 'client' | 'chauffeur' | 'admin')}
              className="flex flex-col space-y-1"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="client" id="client" />
                <Label htmlFor="client">Client</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="chauffeur" id="chauffeur" />
                <Label htmlFor="chauffeur">Chauffeur</Label>
              </div>
            </RadioGroup>
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
  );
};

export default RegisterForm;
