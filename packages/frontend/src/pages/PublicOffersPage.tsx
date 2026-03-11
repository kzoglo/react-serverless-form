import type { OfferResponse } from "@ev-offer/core";
import { useState } from "react";
import { usePublicOffersQuery } from "@/services/offers/services";

const PAGE_SIZE = 10;

function formatPrice(offer: OfferResponse): string {
  return `${offer.pricing.price.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })} ${offer.pricing.currency}`;
}

function formatTitle(offer: OfferResponse): string {
  return `${offer.vehicle.make} ${offer.vehicle.model} ${offer.vehicle.year}`;
}

export function PublicOffersPage() {
  const [page, setPage] = useState(1);

  const { data, isPending, isError } = usePublicOffersQuery(page, PAGE_SIZE);

  const total = data?.total ?? 0;
  const totalPages = total > 0 ? Math.ceil(total / PAGE_SIZE) : 1;

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Available EV Offers</h1>
        <p className="mt-2 text-sm text-gray-500">
          Browse electric vehicles listed on the platform. New offers appear here automatically.
        </p>
      </div>

      {isPending && (
        <div className="flex justify-center py-10">
          <div className="text-sm text-gray-500">Loading offers...</div>
        </div>
      )}

      {isError && !isPending && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          Could not load offers. Please try again later.
        </div>
      )}

      {!isPending && !isError && data && data.data.length === 0 && (
        <div className="rounded-lg bg-white p-8 text-center shadow-sm">
          <p className="text-sm text-gray-500">
            There are no offers yet. Be the first to create one!
          </p>
        </div>
      )}

      {!isPending && !isError && data && data.data.length > 0 && (
        <div className="space-y-4">
          <ul className="space-y-3">
            {data.data.map((offer) => {
              const firstPhoto = offer.photos[0]?.url;
              return (
                <li
                  key={offer.id}
                  className="flex gap-4 rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100"
                >
                  <div className="hidden h-24 w-32 shrink-0 overflow-hidden rounded-lg bg-gray-100 sm:block">
                    {firstPhoto ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={firstPhoto}
                        alt={formatTitle(offer)}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">
                        No photo
                      </div>
                    )}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <h2 className="text-sm font-semibold text-gray-900 sm:text-base">
                        {formatTitle(offer)}
                      </h2>
                      <div className="text-sm font-semibold text-blue-600">
                        {formatPrice(offer)}
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">
                      {offer.vehicle.mileageKm.toLocaleString()} km • {offer.vehicle.rangeKm} km
                      range • {offer.vehicle.batteryCapacityKwh} kWh battery
                    </p>
                    <p className="line-clamp-2 text-xs text-gray-500">
                      {offer.description || "No description provided."}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>

          {/* Pagination */}
          <div className="flex items-center justify-between border-t border-gray-100 pt-4 text-xs text-gray-500">
            <span>
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => (p < totalPages ? p + 1 : p))}
                disabled={page >= totalPages}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
