import type { FullOffer } from "@ev-offer/core";
import { Camera, ImagePlus, Trash2 } from "lucide-react";
import { type UseFormReturn, useFieldArray } from "react-hook-form";

interface StepPhotosProps {
  form: UseFormReturn<FullOffer>;
}

export function StepPhotos({ form }: StepPhotosProps) {
  const {
    register,
    control,
    formState: { errors },
  } = form;

  const { fields, append, remove } = useFieldArray({
    control,
    name: "photos",
  });

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-600">
          <Camera size={20} />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Photos & Description</h2>
          <p className="text-sm text-gray-500">Add photos and describe your vehicle</p>
        </div>
      </div>

      {/* Photo URLs */}
      <div className="mb-6">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Photo URLs (optional)</span>
          <button
            type="button"
            onClick={() => append({ url: "", sortOrder: fields.length, caption: "" })}
            disabled={fields.length >= 20}
            className="flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ImagePlus size={14} />
            Add Photo
          </button>
        </div>

        {fields.length === 0 && (
          <div className="rounded-xl border-2 border-dashed border-gray-200 p-8 text-center">
            <ImagePlus size={32} className="mx-auto text-gray-300" />
            <p className="mt-2 text-sm text-gray-400">
              No photos yet. You can continue without photos or click "Add Photo" to add image URLs.
            </p>
          </div>
        )}

        <div className="space-y-3">
          {fields.map((field, index) => (
            <div
              key={field.id}
              className="flex items-start gap-3 rounded-lg border border-gray-200 p-3"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-xs font-medium text-gray-500">
                {index + 1}
              </div>
              <div className="flex-1 space-y-2">
                <input
                  {...register(`photos.${index}.url`)}
                  placeholder="https://example.com/photo.jpg"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
                <input
                  {...register(`photos.${index}.caption`)}
                  placeholder="Caption (optional)"
                  className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-xs transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <button
                type="button"
                onClick={() => remove(index)}
                className="shrink-0 rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>

        {errors.photos && (
          <p className="mt-2 text-xs text-red-500">
            {typeof errors.photos.message === "string"
              ? errors.photos.message
              : "Please fix photo errors"}
          </p>
        )}
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="mb-1 block text-sm font-medium text-gray-700">
          Description *
        </label>
        <textarea
          id="description"
          {...register("description")}
          rows={6}
          placeholder="Describe your electric vehicle in detail. Include information about the battery health, charging habits, service history, included accessories, reason for selling, etc."
          className="w-full resize-y rounded-lg border border-gray-300 px-4 py-2.5 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />
        {errors.description && (
          <p className="mt-1 text-xs text-red-500">{errors.description.message}</p>
        )}
      </div>
    </div>
  );
}
