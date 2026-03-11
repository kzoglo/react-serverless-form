import type { FullOffer } from "@ev-offer/core";
import { currencies } from "@ev-offer/core";
import { DollarSign } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";

interface StepPricingProps {
  form: UseFormReturn<FullOffer>;
}

export function StepPricing({ form }: StepPricingProps) {
  const {
    register,
    formState: { errors },
    watch,
    setValue,
  } = form;

  const negotiable = watch("negotiable");

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 text-green-600">
          <DollarSign size={20} />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Pricing & Warranty</h2>
          <p className="text-sm text-gray-500">Set your asking price and warranty details</p>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="price" className="mb-1 block text-sm font-medium text-gray-700">
            Price *
          </label>
          <input
            id="price"
            type="number"
            step="100"
            {...register("price", { valueAsNumber: true })}
            placeholder="e.g. 35000"
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
          {errors.price && <p className="mt-1 text-xs text-red-500">{errors.price.message}</p>}
        </div>

        <div>
          <label htmlFor="currency" className="mb-1 block text-sm font-medium text-gray-700">
            Currency *
          </label>
          <select
            id="currency"
            {...register("currency")}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            {currencies.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          {errors.currency && (
            <p className="mt-1 text-xs text-red-500">{errors.currency.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="warrantyMonths" className="mb-1 block text-sm font-medium text-gray-700">
            Warranty (months)
          </label>
          <input
            id="warrantyMonths"
            type="number"
            {...register("warrantyMonths", { valueAsNumber: true })}
            placeholder="0"
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
          {errors.warrantyMonths && (
            <p className="mt-1 text-xs text-red-500">{errors.warrantyMonths.message}</p>
          )}
        </div>

        <div className="flex items-end pb-1">
          <label className="flex cursor-pointer items-center gap-3">
            <div className="relative">
              <input
                type="checkbox"
                checked={negotiable}
                onChange={(e) => setValue("negotiable", e.target.checked)}
                className="peer sr-only"
              />
              <div className="h-6 w-11 rounded-full bg-gray-200 transition-colors peer-checked:bg-blue-600 peer-focus:ring-2 peer-focus:ring-blue-500/20" />
              <div className="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
            </div>
            <span className="text-sm font-medium text-gray-700">Price is negotiable</span>
          </label>
        </div>
      </div>
    </div>
  );
}
