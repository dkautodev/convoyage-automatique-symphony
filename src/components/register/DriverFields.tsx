
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface DriverFieldsProps {
  licenseNumber: string;
  setLicenseNumber: (value: string) => void;
  vehicleType: string;
  setVehicleType: (value: string) => void;
}

const DriverFields: React.FC<DriverFieldsProps> = ({
  licenseNumber,
  setLicenseNumber,
  vehicleType,
  setVehicleType
}) => {
  return (
    <>
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
    </>
  );
};

export default DriverFields;
