import { Button } from '@/components/ui/button'
import { Field, TextInput } from '@/components/ui/field'

// Step 3: resident details. Validation lives in BookingFlow (validateDetails).

export default function DetailsStep({ fullName, address, contactNumber, errors, onChange, onBack, onReview }) {
  return (
    <div>
      <div className="grid gap-3">
        <Field label="Full name" required htmlFor="bk-name" error={errors.fullName}>
          <TextInput
            id="bk-name"
            name="fullName"
            autoComplete="name"
            placeholder="Juan Dela Cruz"
            value={fullName}
            onChange={(e) => onChange('fullName', e.target.value)}
            invalid={Boolean(errors.fullName)}
            required
          />
        </Field>
        <Field
          label="Address"
          required
          htmlFor="bk-address"
          hint="Purok / street and barangay. Staff use this to verify your request."
          error={errors.address}
        >
          <TextInput
            id="bk-address"
            name="address"
            autoComplete="street-address"
            placeholder="Purok 1, Tamadang"
            value={address}
            onChange={(e) => onChange('address', e.target.value)}
            invalid={Boolean(errors.address)}
            required
          />
        </Field>
        <Field
          label="Mobile number"
          required
          htmlFor="bk-contact"
          hint="11-digit mobile starting with 09. Used only to verify your request."
          error={errors.contactNumber}
        >
          <TextInput
            id="bk-contact"
            name="contactNumber"
            inputMode="tel"
            autoComplete="tel"
            placeholder="09xx xxx xxxx"
            value={contactNumber}
            onChange={(e) => onChange('contactNumber', e.target.value)}
            invalid={Boolean(errors.contactNumber)}
            required
          />
        </Field>
      </div>
      <div className="mt-5 flex flex-col gap-2.5 sm:flex-row">
        <Button type="button" variant="outline" size="lg" onClick={onBack} className="sm:w-auto">
          Back
        </Button>
        <Button type="button" size="lg" onClick={onReview} className="sm:flex-1">
          Review request
        </Button>
      </div>
    </div>
  )
}
