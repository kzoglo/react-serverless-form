import {
  DEFAULT_CURRENCY,
  type FullOffer,
  fullOfferSchema,
  photosStepSchema,
  pricingSchema,
  type StepNumber,
  TOTAL_STEPS,
  vehicleInfoSchema,
} from "@ev-offer/core";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import {
  useCreateDraftMutation,
  useDraftByIdQuery,
  useSaveDraftStepMutation,
} from "@/services/drafts/services";
import { DRAFT_ID_KEY, EDIT_OFFER_ID_KEY, FORM_BACKUP_KEY } from "@/services/drafts/storage";
import {
  useCreateDraftFromOfferMutation,
  useOfferByIdQuery,
  useSubmitOfferMutation,
} from "@/services/offers/services";

const stepSchemaMap = {
  1: vehicleInfoSchema,
  2: pricingSchema,
  3: photosStepSchema,
} as const;

const saveStatuses = ["idle", "saving", "saved", "error"] as const;
export type SaveStatus = (typeof saveStatuses)[number];

export function useOfferForm() {
  const [currentStep, setCurrentStep] = useState<StepNumber>(1);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [draftId, setDraftId] = useState<string | null>(() => localStorage.getItem(DRAFT_ID_KEY));
  const [editOfferId, setEditOfferId] = useState<string | null>(() =>
    localStorage.getItem(EDIT_OFFER_ID_KEY),
  );
  const saveStatusTimeoutRef = useRef<number | null>(null);
  const appliedDraftIdRef = useRef<string | null>(null);
  const appliedOfferIdRef = useRef<string | null>(null);
  const shouldHydrateFromServerRef = useRef<boolean>(draftId !== null);

  useEffect(() => {
    return () => {
      if (saveStatusTimeoutRef.current) {
        window.clearTimeout(saveStatusTimeoutRef.current);
      }
    };
  }, []);

  const form = useForm<FullOffer>({
    resolver: zodResolver(fullOfferSchema),
    mode: "onTouched",
    defaultValues: {
      make: "",
      model: "",
      year: new Date().getFullYear(),
      mileageKm: 0,
      batteryCapacityKwh: 0,
      rangeKm: 0,
      vin: "",
      condition: undefined,
      color: undefined,
      price: 0,
      currency: DEFAULT_CURRENCY,
      negotiable: false,
      warrantyMonths: 0,
      photos: [],
      description: "",
    },
  });

  const {
    data: existingDraft,
    isPending: isDraftPending,
    isFetching: isDraftFetching,
  } = useDraftByIdQuery(draftId, shouldHydrateFromServerRef.current);
  const { data: sourceOffer, isPending: isSourceOfferPending } = useOfferByIdQuery(
    editOfferId,
    draftId === null && editOfferId !== null,
  );

  useEffect(() => {
    appliedDraftIdRef.current = null;
  }, [draftId]);

  useEffect(() => {
    appliedOfferIdRef.current = null;
  }, [editOfferId]);

  useEffect(() => {
    if (!draftId || !existingDraft?.data) return;
    if (isDraftFetching) return;
    if (appliedDraftIdRef.current === draftId) return;

    appliedDraftIdRef.current = draftId;
    const data = existingDraft.data as Partial<FullOffer>;
    form.reset({ ...form.getValues(), ...data });
    setCurrentStep(existingDraft.currentStep as StepNumber);
  }, [draftId, existingDraft, isDraftFetching, form]);

  useEffect(() => {
    if (!editOfferId || draftId || !sourceOffer) return;
    if (appliedOfferIdRef.current === editOfferId) return;

    appliedOfferIdRef.current = editOfferId;
    form.reset({
      ...form.getValues(),
      make: sourceOffer.vehicle.make,
      model: sourceOffer.vehicle.model,
      year: sourceOffer.vehicle.year,
      mileageKm: sourceOffer.vehicle.mileageKm,
      batteryCapacityKwh: sourceOffer.vehicle.batteryCapacityKwh,
      rangeKm: sourceOffer.vehicle.rangeKm,
      vin: sourceOffer.vehicle.vin ?? "",
      condition: sourceOffer.vehicle.condition as FullOffer["condition"],
      color: sourceOffer.vehicle.color as FullOffer["color"],
      price: sourceOffer.pricing.price,
      currency: sourceOffer.pricing.currency as FullOffer["currency"],
      negotiable: sourceOffer.pricing.negotiable,
      warrantyMonths: sourceOffer.pricing.warrantyMonths,
      photos: sourceOffer.photos.map((photo) => ({
        url: photo.url,
        sortOrder: photo.sortOrder,
        caption: photo.caption ?? undefined,
      })),
      description: sourceOffer.description,
    });
    setCurrentStep(1);
  }, [editOfferId, draftId, sourceOffer, form]);

  useEffect(() => {
    const subscription = form.watch((data) => {
      localStorage.setItem(FORM_BACKUP_KEY, JSON.stringify(data));
    });
    return () => subscription.unsubscribe();
  }, [form.watch]);

  const createDraftMutation = useCreateDraftMutation({
    onSuccess: (data) => {
      setDraftId(data.id);
      localStorage.setItem(DRAFT_ID_KEY, data.id);
    },
  });

  const saveStepMutation = useSaveDraftStepMutation();
  const createDraftFromOfferMutation = useCreateDraftFromOfferMutation();

  const submitOfferMutation = useSubmitOfferMutation({
    onSuccess: () => {
      setIsSubmitted(true);
      setDraftId(null);
      setEditOfferId(null);
      localStorage.removeItem(DRAFT_ID_KEY);
      localStorage.removeItem(EDIT_OFFER_ID_KEY);
      localStorage.removeItem(FORM_BACKUP_KEY);
    },
  });

  const saveCurrentStep = useCallback(
    async (data: Record<string, unknown>): Promise<boolean> => {
      setSaveStatus("saving");

      let currentDraftId = draftId;
      if (!currentDraftId) {
        try {
          const newDraft = editOfferId
            ? await createDraftFromOfferMutation.mutateAsync(editOfferId)
            : await createDraftMutation.mutateAsync();
          currentDraftId = newDraft.id;
          setDraftId(newDraft.id);
          localStorage.setItem(DRAFT_ID_KEY, newDraft.id);
          if (editOfferId) {
            setEditOfferId(null);
            localStorage.removeItem(EDIT_OFFER_ID_KEY);
          }
        } catch {
          setSaveStatus("error");
          return false;
        }
      }

      try {
        await saveStepMutation.mutateAsync({
          id: currentDraftId,
          step: currentStep,
          data,
        });
        setSaveStatus("saved");
        if (saveStatusTimeoutRef.current) {
          window.clearTimeout(saveStatusTimeoutRef.current);
        }
        saveStatusTimeoutRef.current = window.setTimeout(() => {
          setSaveStatus("idle");
        }, 2000);
        return true;
      } catch {
        setSaveStatus("error");
        return false;
      }
    },
    [
      draftId,
      editOfferId,
      currentStep,
      createDraftMutation,
      createDraftFromOfferMutation,
      saveStepMutation,
    ],
  );

  const goToNextStep = useCallback(async () => {
    const currentSchema = stepSchemaMap[currentStep];
    const values = form.getValues();

    const stepData = currentSchema.safeParse(values);
    if (!stepData.success) {
      await form.trigger();
      return;
    }

    const didSave = await saveCurrentStep(stepData.data as Record<string, unknown>);

    if (didSave && currentStep < TOTAL_STEPS) {
      setCurrentStep((prev) => (prev + 1) as StepNumber);
    }
  }, [currentStep, form, saveCurrentStep]);

  const goToPreviousStep = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as StepNumber);
    }
  }, [currentStep]);

  const handleFinalSubmit = useCallback(async () => {
    if (!draftId) return;

    const values = form.getValues();
    const parsed = fullOfferSchema.safeParse(values);

    if (!parsed.success) {
      console.error("Full validation failed:", parsed.error.errors);
      await form.trigger();
      return;
    }

    const lastStepSchema = stepSchemaMap[currentStep];
    const stepData = lastStepSchema.safeParse(values);
    if (!stepData.success) {
      await form.trigger();
      return;
    }

    const didSave = await saveCurrentStep(stepData.data as Record<string, unknown>);
    if (!didSave) {
      return;
    }

    submitOfferMutation.mutate(draftId);
  }, [draftId, form, currentStep, saveCurrentStep, submitOfferMutation]);

  const isDraftLoading =
    shouldHydrateFromServerRef.current &&
    !!draftId &&
    (isDraftPending || (!!existingDraft?.data && appliedDraftIdRef.current !== draftId));
  const isOfferLoadingForEdit =
    !draftId &&
    !!editOfferId &&
    (isSourceOfferPending || appliedOfferIdRef.current !== editOfferId);

  return {
    form,
    currentStep,
    totalSteps: TOTAL_STEPS,
    isDraftLoading: isDraftLoading || isOfferLoadingForEdit,
    saveStatus,
    isSubmitted,
    isSubmitting: submitOfferMutation.isPending,
    submitError: submitOfferMutation.error?.message || null,
    goToNextStep,
    goToPreviousStep,
    handleFinalSubmit,
  };
}
