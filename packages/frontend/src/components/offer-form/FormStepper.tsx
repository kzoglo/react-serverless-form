import { Check, Cloud, CloudOff, Loader2 } from "lucide-react";
import type { SaveStatus } from "@/hooks/useOfferForm";
import { useOfferForm } from "@/hooks/useOfferForm";
import { StepPhotos } from "./StepPhotos";
import { StepPricing } from "./StepPricing";
import { StepVehicleInfo } from "./StepVehicleInfo";

function SaveIndicator({ status }: { status: SaveStatus }) {
  if (status === "idle") return null;

  return (
    <div className="flex items-center gap-1.5 text-xs">
      {status === "saving" && (
        <>
          <Loader2 size={12} className="animate-spin text-blue-500" />
          <span className="text-blue-500">Saving...</span>
        </>
      )}
      {status === "saved" && (
        <>
          <Cloud size={12} className="text-green-500" />
          <span className="text-green-500">Saved</span>
        </>
      )}
      {status === "error" && (
        <>
          <CloudOff size={12} className="text-red-500" />
          <span className="text-red-500">Save failed</span>
        </>
      )}
    </div>
  );
}

function StepIndicator({
  step,
  currentStep,
  label,
}: {
  step: number;
  currentStep: number;
  label: string;
}) {
  const isCompleted = currentStep > step;
  const isCurrent = currentStep === step;

  return (
    <div className="flex items-center gap-2">
      <div
        className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors ${
          isCompleted
            ? "bg-green-500 text-white"
            : isCurrent
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-500"
        }`}
      >
        {isCompleted ? <Check size={16} /> : step}
      </div>
      <span
        className={`hidden text-sm sm:inline ${
          isCurrent ? "font-medium text-gray-900" : "text-gray-500"
        }`}
      >
        {label}
      </span>
    </div>
  );
}

interface FormStepperProps {
  onCancel?: () => void;
}

export function FormStepper({ onCancel }: FormStepperProps) {
  const {
    form,
    currentStep,
    totalSteps,
    isDraftLoading,
    saveStatus,
    isSubmitted,
    isSubmitting,
    submitError,
    goToNextStep,
    goToPreviousStep,
    handleFinalSubmit,
  } = useOfferForm();

  if (isSubmitted) {
    return (
      <div className="rounded-2xl bg-white p-12 text-center shadow-lg">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <Check size={32} className="text-green-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Offer Published!</h2>
        <p className="mt-2 text-gray-500">Your electric vehicle listing is now live.</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-6 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          Create Another Offer
        </button>
      </div>
    );
  }

  if (isDraftLoading) {
    return (
      <div className="rounded-2xl bg-white p-12 text-center shadow-lg">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
          <Loader2 size={28} className="animate-spin text-blue-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Loading offer...</h2>
        <p className="mt-2 text-gray-500">Restoring your latest saved progress.</p>
      </div>
    );
  }

  const stepLabels = ["Vehicle Info", "Pricing", "Photos & Description"];

  return (
    <div className="space-y-6">
      {/* Step indicators */}
      <div className="flex items-center justify-between rounded-xl bg-white px-6 py-4 shadow-sm">
        <div className="flex items-center gap-6">
          {stepLabels.map((label, index) => (
            <div key={label} className="flex items-center gap-3">
              {index > 0 && (
                <div
                  className={`hidden h-px w-8 sm:block ${
                    currentStep > index ? "bg-green-400" : "bg-gray-200"
                  }`}
                />
              )}
              <StepIndicator step={index + 1} currentStep={currentStep} label={label} />
            </div>
          ))}
        </div>
        <SaveIndicator status={saveStatus} />
      </div>

      {/* Step content */}
      <div className="rounded-2xl bg-white p-6 shadow-sm sm:p-8">
        {currentStep === 1 && <StepVehicleInfo form={form} />}
        {currentStep === 2 && <StepPricing form={form} />}
        {currentStep === 3 && <StepPhotos form={form} />}

        {submitError && (
          <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {submitError}
          </div>
        )}

        {/* Navigation */}
        <div className="mt-8 flex items-center justify-between border-t border-gray-100 pt-6">
          <div className="flex items-center gap-2">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                Cancel
              </button>
            )}
            <button
              type="button"
              onClick={goToPreviousStep}
              disabled={currentStep === 1}
              className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Back
            </button>
          </div>

          {currentStep < totalSteps ? (
            <button
              type="button"
              onClick={goToNextStep}
              className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            >
              Next Step
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinalSubmit}
              disabled={isSubmitting}
              className="flex items-center gap-2 rounded-lg bg-green-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting && <Loader2 size={16} className="animate-spin" />}
              {isSubmitting ? "Publishing..." : "Publish Offer"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
