import { FormStepper } from "@/components/offer-form/FormStepper";

interface CreateOfferPageProps {
  onCancel?: () => void;
}

export function CreateOfferPage({ onCancel }: CreateOfferPageProps) {
  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Create Your EV Sell Offer</h1>
        <p className="mt-2 text-gray-500">
          Fill in the details about your electric vehicle to create a listing
        </p>
      </div>

      <FormStepper onCancel={onCancel} />
    </main>
  );
}
