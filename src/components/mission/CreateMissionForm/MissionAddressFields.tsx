
import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowUpDown } from "lucide-react";
import AddressAutocomplete from "@/components/AddressAutocomplete";

interface MissionAddressFieldsProps {
  pickupAddress: string;
  deliveryAddress: string;
  onPickupChange: (value: string) => void;
  onDeliveryChange: (value: string) => void;
  onSelectPickup: (address: string, placeId: string, addressData?: any) => void;
  onSelectDelivery: (address: string, placeId: string, addressData?: any) => void;
  onSwap: () => void;
  pickupDisabled?: boolean;
  deliveryDisabled?: boolean;
  errorPickup?: string;
  errorDelivery?: string;
  className?: string;
}

export default function MissionAddressFields({
  pickupAddress,
  deliveryAddress,
  onPickupChange,
  onDeliveryChange,
  onSelectPickup,
  onSelectDelivery,
  onSwap,
  pickupDisabled,
  deliveryDisabled,
  errorPickup,
  errorDelivery,
  className = "",
}: MissionAddressFieldsProps) {
  return (
    <div className={`w-full ${className}`}>
      <label className="block font-semibold text-base mb-3 text-gray-800">
        Adresse de départ et de livraison
      </label>
      <div className="flex w-full items-stretch gap-0">
        {/* Colonne icônes */}
        <div className="flex flex-col items-center py-2" style={{ width: "2.25rem", minWidth: "2.25rem" }}>
          {/* Cercle noir (départ) */}
          <div className="w-5 h-5 rounded-full border-4 border-black mb-1 bg-white" />
          {/* Dotted line */}
          <div className="flex flex-col items-center flex-1 justify-center py-1 gap-[2px]">
            <div className="w-1 h-1 rounded-full bg-gray-300" />
            <div className="w-1 h-1 rounded-full bg-gray-300" />
            <div className="w-1 h-1 rounded-full bg-gray-300" />
          </div>
          {/* Pin */}
          <svg width="22" height="22" viewBox="0 0 22 22" className="mt-1" fill="none">
            <circle cx="11" cy="11" r="10" stroke="#F87171" strokeWidth="2" fill="none" />
            <path d="M11 6C8.24 6 6 8.22 6 10.96c0 2.67 2.18 5.29 4.07 7.12a1 1 0 0 0 1.42 0C15.82 16.25 18 13.63 18 10.96 18 8.22 15.76 6 13 6Zm0 5.13a2.13 2.13 0 1 1 0-4.26 2.13 2.13 0 0 1 0 4.26Z" stroke="#F87171" strokeWidth="1" fill="none" />
            <circle cx="11" cy="9.5" r="1.2" fill="#F87171" />
          </svg>
        </div>
        {/* Inputs adresses */}
        <div className="flex flex-col flex-1 gap-3 max-w-full">
          <div>
            <AddressAutocomplete
              value={pickupAddress}
              onChange={onPickupChange}
              onSelect={onSelectPickup}
              placeholder="Saisissez l'adresse de départ"
              error={errorPickup}
              disabled={pickupDisabled}
              className="w-full max-w-full h-12 text-lg placeholder-gray-400"
            />
            {errorPickup && <div className="text-sm text-destructive mt-1">{errorPickup}</div>}
          </div>
          <div>
            <AddressAutocomplete
              value={deliveryAddress}
              onChange={onDeliveryChange}
              onSelect={onSelectDelivery}
              placeholder="Saisissez l'adresse de livraison"
              error={errorDelivery}
              disabled={deliveryDisabled}
              className="w-full max-w-full h-12 text-lg placeholder-gray-400"
            />
            {errorDelivery && <div className="text-sm text-destructive mt-1">{errorDelivery}</div>}
          </div>
        </div>
        {/* Swap button */}
        <div className="flex flex-col items-center justify-center ml-3">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={onSwap}
            disabled={pickupDisabled}
            className="rounded-full border-2 border-gray-300 bg-white hover:bg-gray-50 shadow-none w-12 h-12 flex items-center justify-center"
            aria-label="Échanger les adresses"
            tabIndex={0}
          >
            <ArrowUpDown className="h-6 w-6 text-gray-500" />
          </Button>
        </div>
      </div>
    </div>
  );
}
