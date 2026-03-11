import type { FullOffer } from "@ev-offer/core";
import { type VehicleCondition, vehicleColors, vehicleConditions } from "@ev-offer/core";
import { Car } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";

interface StepVehicleInfoProps {
  form: UseFormReturn<FullOffer>;
}

const conditionLabels: Record<VehicleCondition, string> = {
  new: "New",
  like_new: "Like New",
  excellent: "Excellent",
  good: "Good",
  fair: "Fair",
};

export function StepVehicleInfo({ form }: StepVehicleInfoProps) {
  const {
    register,
    formState: { errors },
  } = form;

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
          <Car size={20} />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Vehicle Information</h2>
          <p className="text-sm text-gray-500">Tell us about your electric vehicle</p>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="make" className="mb-1 block text-sm font-medium text-gray-700">
            Make *
          </label>
          <input
            id="make"
            {...register("make")}
            placeholder="e.g. Tesla"
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
          {errors.make && <p className="mt-1 text-xs text-red-500">{errors.make.message}</p>}
        </div>

        <div>
          <label htmlFor="model" className="mb-1 block text-sm font-medium text-gray-700">
            Model *
          </label>
          <input
            id="model"
            {...register("model")}
            placeholder="e.g. Model 3"
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
          {errors.model && <p className="mt-1 text-xs text-red-500">{errors.model.message}</p>}
        </div>

        <div>
          <label htmlFor="year" className="mb-1 block text-sm font-medium text-gray-700">
            Year *
          </label>
          <input
            id="year"
            type="number"
            {...register("year", { valueAsNumber: true })}
            placeholder="e.g. 2023"
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
          {errors.year && <p className="mt-1 text-xs text-red-500">{errors.year.message}</p>}
        </div>

        <div>
          <label htmlFor="mileageKm" className="mb-1 block text-sm font-medium text-gray-700">
            Mileage (km) *
          </label>
          <input
            id="mileageKm"
            type="number"
            {...register("mileageKm", { valueAsNumber: true })}
            placeholder="e.g. 25000"
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
          {errors.mileageKm && (
            <p className="mt-1 text-xs text-red-500">{errors.mileageKm.message}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="batteryCapacityKwh"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Battery Capacity (kWh) *
          </label>
          <input
            id="batteryCapacityKwh"
            type="number"
            step="0.1"
            {...register("batteryCapacityKwh", { valueAsNumber: true })}
            placeholder="e.g. 75"
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
          {errors.batteryCapacityKwh && (
            <p className="mt-1 text-xs text-red-500">{errors.batteryCapacityKwh.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="rangeKm" className="mb-1 block text-sm font-medium text-gray-700">
            Range (km) *
          </label>
          <input
            id="rangeKm"
            type="number"
            {...register("rangeKm", { valueAsNumber: true })}
            placeholder="e.g. 450"
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
          {errors.rangeKm && <p className="mt-1 text-xs text-red-500">{errors.rangeKm.message}</p>}
        </div>

        <div>
          <label htmlFor="color" className="mb-1 block text-sm font-medium text-gray-700">
            Color *
          </label>
          <select
            id="color"
            {...register("color")}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="">Select color...</option>
            {vehicleColors.map((color) => (
              <option key={color} value={color}>
                {color}
              </option>
            ))}
          </select>
          {errors.color && <p className="mt-1 text-xs text-red-500">{errors.color.message}</p>}
        </div>

        <div>
          <label htmlFor="vin" className="mb-1 block text-sm font-medium text-gray-700">
            VIN (optional)
          </label>
          <input
            id="vin"
            {...register("vin")}
            placeholder="17-character VIN"
            maxLength={17}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
          {errors.vin && <p className="mt-1 text-xs text-red-500">{errors.vin.message}</p>}
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="condition" className="mb-1 block text-sm font-medium text-gray-700">
            Condition *
          </label>
          <select
            id="condition"
            {...register("condition")}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="">Select condition...</option>
            {vehicleConditions.map((c) => (
              <option key={c} value={c}>
                {conditionLabels[c]}
              </option>
            ))}
          </select>
          {errors.condition && (
            <p className="mt-1 text-xs text-red-500">{errors.condition.message}</p>
          )}
        </div>
      </div>
    </div>
  );
}
