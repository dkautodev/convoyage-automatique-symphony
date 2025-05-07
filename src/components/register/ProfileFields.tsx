
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ProfileFieldsProps {
  fullName: string;
  setFullName: (value: string) => void;
  companyName: string;
  setCompanyName: (value: string) => void;
  siret: string;
  setSiret: (value: string) => void;
  phone1: string;
  setPhone1: (value: string) => void;
  phone2: string;
  setPhone2: (value: string) => void;
}

const ProfileFields: React.FC<ProfileFieldsProps> = ({
  fullName,
  setFullName,
  companyName,
  setCompanyName,
  siret,
  setSiret,
  phone1,
  setPhone1,
  phone2,
  setPhone2
}) => {
  return (
    <>
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
    </>
  );
};

export default ProfileFields;
