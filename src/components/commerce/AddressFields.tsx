'use client';
import { Select } from '@/components/ui/Field';
import { cn } from '@/lib/utils';
import { COUNTRIES, COUNTRY_NAMES } from './countries';
import { FormField } from './FormField';

export type AddressDraft = {
  label: string;
  firstName: string;
  lastName: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
};

export const emptyAddress = (country = 'United States'): AddressDraft => ({
  label: '',
  firstName: '',
  lastName: '',
  phone: '',
  line1: '',
  line2: '',
  city: '',
  state: '',
  postalCode: '',
  country,
});

type Props = {
  value: AddressDraft;
  onChange: (field: keyof AddressDraft, value: string) => void;
  /** Error messages keyed by `${errorPrefix}${field}` */
  errors: Record<string, string>;
  errorPrefix?: string;
  idPrefix: string;
  /** Include recipient name & phone (address book / gift recipient). */
  withContact?: boolean;
  withLabel?: boolean;
  section?: string;
  className?: string;
};

/** Address inputs with correct autocomplete tokens, input modes and linked inline errors. */
export function AddressFields({ value, onChange, errors, errorPrefix = '', idPrefix, withContact, withLabel, section = 'shipping', className }: Props) {
  const err = (f: keyof AddressDraft) => errors[`${errorPrefix}${f}`];
  const ac = (token: string) => `section-${section} shipping ${token}`;
  const bind = (f: keyof AddressDraft) => ({
    id: `${idPrefix}-${f}`,
    name: f,
    value: value[f],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => onChange(f, e.target.value),
    error: err(f),
  });

  return (
    <div className={cn('grid grid-cols-2 gap-x-4 gap-y-5', className)}>
      {withLabel && <FormField label="Address name" hint="Optional — e.g. Home, Studio, Parents" className="col-span-2" maxLength={40} autoComplete="off" {...bind('label')} />}
      {withContact && (
        <>
          <FormField label="First name" required className="col-span-2 xs:col-span-1" autoComplete={ac('given-name')} maxLength={60} {...bind('firstName')} />
          <FormField label="Last name" required className="col-span-2 xs:col-span-1" autoComplete={ac('family-name')} maxLength={60} {...bind('lastName')} />
        </>
      )}
      <FormField label="Street address" required className="col-span-2" autoComplete={ac('address-line1')} maxLength={120} placeholder="House number and street" {...bind('line1')} />
      <FormField label="Apartment, suite, floor" hint="Optional" className="col-span-2" autoComplete={ac('address-line2')} maxLength={120} {...bind('line2')} />
      <FormField label="City" required className="col-span-2 xs:col-span-1" autoComplete={ac('address-level2')} maxLength={80} {...bind('city')} />
      <FormField label="State / Region" required className="col-span-2 xs:col-span-1" autoComplete={ac('address-level1')} maxLength={80} {...bind('state')} />
      <FormField label="Postal code" required className="col-span-2 xs:col-span-1" autoComplete={ac('postal-code')} maxLength={16} autoCapitalize="characters" spellCheck={false} {...bind('postalCode')} />
      <FormField id={`${idPrefix}-country`} label="Country" required className="col-span-2 xs:col-span-1" error={err('country')}>
        {(a11y) => (
          <Select {...a11y} className="aria-[invalid=true]:border-danger/70" name="country" value={value.country} onChange={(e) => onChange('country', e.target.value)} autoComplete={ac('country-name')} required>
            {value.country && !COUNTRY_NAMES.has(value.country) && <option value={value.country}>{value.country}</option>}
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.name}>
                {c.name}
              </option>
            ))}
          </Select>
        )}
      </FormField>
      {withContact && (
        <FormField label="Phone" required className="col-span-2" type="tel" inputMode="tel" autoComplete={ac('tel')} maxLength={24} hint="Used only to coordinate insured delivery" {...bind('phone')} />
      )}
    </div>
  );
}
