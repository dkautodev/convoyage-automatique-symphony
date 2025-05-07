
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

interface TaxFieldsProps {
  tvaApplicable: boolean;
  setTvaApplicable: (value: boolean) => void;
  tvaNumb: string;
  setTvaNumb: (value: string) => void;
}

const TaxFields: React.FC<TaxFieldsProps> = ({
  tvaApplicable,
  setTvaApplicable,
  tvaNumb,
  setTvaNumb
}) => {
  return (
    <>
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
    </>
  );
};

export default TaxFields;
