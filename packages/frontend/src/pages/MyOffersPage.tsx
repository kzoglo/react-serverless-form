import { useDraftsListQuery } from "@/services/drafts/services";
import { DRAFT_ID_KEY, EDIT_OFFER_ID_KEY } from "@/services/drafts/storage";
import { useMyOffersQuery } from "@/services/offers/services";

interface MyOffersPageProps {
  onOpenCreateOffer?: () => void;
}

function getDraftTitle(draft: { id: string; data: Record<string, unknown> }): {
  title: string;
  fallbackId: string | null;
} {
  const make = typeof draft.data.make === "string" ? draft.data.make.trim() : "";
  const model = typeof draft.data.model === "string" ? draft.data.model.trim() : "";
  const combined = [make, model].filter(Boolean).join(" ");
  const shortId = `${draft.id.slice(0, 8)}...`;

  if (combined) {
    return { title: combined, fallbackId: shortId };
  }

  return { title: shortId, fallbackId: null };
}

export function MyOffersPage({ onOpenCreateOffer }: MyOffersPageProps) {
  const {
    data: myOffers,
    isPending: isOffersPending,
    isError: isOffersError,
  } = useMyOffersQuery(1, 10);

  const { data: drafts, isPending: isDraftsPending, isError: isDraftsError } = useDraftsListQuery();

  const handleCreateNewOffer = () => {
    localStorage.removeItem(DRAFT_ID_KEY);
    localStorage.removeItem(EDIT_OFFER_ID_KEY);
    onOpenCreateOffer?.();
  };

  const handleEditDraft = (draftId: string) => {
    localStorage.setItem(DRAFT_ID_KEY, draftId);
    localStorage.removeItem(EDIT_OFFER_ID_KEY);
    onOpenCreateOffer?.();
  };

  const handleEditOffer = (offerId: string) => {
    localStorage.removeItem(DRAFT_ID_KEY);
    localStorage.setItem(EDIT_OFFER_ID_KEY, offerId);
    onOpenCreateOffer?.();
  };

  const hasDrafts = (drafts ?? []).length > 0;
  const hasOffers = (myOffers?.data ?? []).length > 0;

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-gray-900">My Offers</h1>
        <p className="mt-2 text-sm text-gray-500">
          Review your drafts and published offers. Drafts are only visible to you until you submit
          them.
        </p>
      </div>

      <section className="mb-8 rounded-2xl bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">Drafts</h2>
          <div className="flex items-center gap-3">
            {isDraftsPending && <span className="text-xs text-gray-500">Loading drafts...</span>}
            {onOpenCreateOffer && (
              <button
                type="button"
                onClick={handleCreateNewOffer}
                className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-700"
              >
                Create New Offer
              </button>
            )}
          </div>
        </div>

        {isDraftsError && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-xs text-red-700">
            Could not load drafts.
          </div>
        )}

        {!isDraftsPending && !isDraftsError && !hasDrafts && (
          <p className="text-xs text-gray-500">You have no drafts yet.</p>
        )}

        {!isDraftsPending && !isDraftsError && hasDrafts && (
          <div className="overflow-x-auto">
            <table className="min-w-full table-fixed divide-y divide-gray-200 text-xs">
              <thead className="bg-gray-50">
                <tr>
                  <th className="w-[38%] px-3 py-2 text-left font-medium text-gray-500">Title</th>
                  <th className="w-[16%] px-3 py-2 text-left font-medium text-gray-500">
                    Current step
                  </th>
                  <th className="w-[16%] px-3 py-2 text-left font-medium text-gray-500">Status</th>
                  <th className="w-[20%] px-3 py-2 text-left font-medium text-gray-500">
                    Last updated
                  </th>
                  {onOpenCreateOffer && (
                    <th className="w-[10%] px-3 py-2 text-left font-medium text-gray-500">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {(drafts ?? []).map((draft) => {
                  const draftTitle = getDraftTitle(draft);
                  return (
                    <tr key={draft.id}>
                      <td className="px-3 py-2 text-gray-700">
                        <div className="truncate">{draftTitle.title}</div>
                        {draftTitle.fallbackId && (
                          <div className="mt-0.5 font-mono text-[11px] text-gray-500">
                            {draftTitle.fallbackId}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2 text-gray-700">{draft.currentStep}</td>
                      <td className="px-3 py-2 text-gray-700 capitalize">{draft.status}</td>
                      <td className="px-3 py-2 text-gray-500">
                        {new Date(draft.updatedAt).toLocaleString()}
                      </td>
                      {onOpenCreateOffer && (
                        <td className="px-3 py-2">
                          <button
                            type="button"
                            onClick={() => handleEditDraft(draft.id)}
                            className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
                          >
                            Continue
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">Published Offers</h2>
          {isOffersPending && <span className="text-xs text-gray-500">Loading offers...</span>}
        </div>

        {isOffersError && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-xs text-red-700">
            Could not load your offers.
          </div>
        )}

        {!isOffersPending && !isOffersError && !hasOffers && (
          <p className="text-xs text-gray-500">You have not published any offers yet.</p>
        )}

        {!isOffersPending && !isOffersError && hasOffers && (
          <div className="overflow-x-auto">
            <table className="min-w-full table-fixed divide-y divide-gray-200 text-xs">
              <thead className="bg-gray-50">
                <tr>
                  <th className="w-[38%] px-3 py-2 text-left font-medium text-gray-500">Title</th>
                  <th className="w-[16%] px-3 py-2 text-left font-medium text-gray-500">Price</th>
                  <th className="w-[16%] px-3 py-2 text-left font-medium text-gray-500">Status</th>
                  <th className="w-[20%] px-3 py-2 text-left font-medium text-gray-500">
                    Last updated
                  </th>
                  {onOpenCreateOffer && (
                    <th className="w-[10%] px-3 py-2 text-left font-medium text-gray-500">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {(myOffers?.data ?? []).map((offer) => (
                  <tr key={offer.id}>
                    <td className="truncate px-3 py-2 text-gray-700">
                      {offer.vehicle.make} {offer.vehicle.model} {offer.vehicle.year}
                    </td>
                    <td className="px-3 py-2 text-gray-700">
                      {offer.pricing.price.toLocaleString(undefined, {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      })}{" "}
                      {offer.pricing.currency}
                    </td>
                    <td className="px-3 py-2 text-gray-700 capitalize">{offer.status}</td>
                    <td className="px-3 py-2 text-gray-500">
                      {new Date(offer.updatedAt).toLocaleString()}
                    </td>
                    {onOpenCreateOffer && (
                      <td className="px-3 py-2">
                        <button
                          type="button"
                          onClick={() => handleEditOffer(offer.id)}
                          className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
                        >
                          Edit
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
