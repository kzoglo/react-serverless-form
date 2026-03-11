import { DraftStatus } from "./generated/client/client.js";
import { prisma } from "./src/client.js";

async function main() {
  console.log("Seeding database...");

  const draft = await prisma.offerDraft.create({
    data: {
      userId: "seed-user-001",
      currentStep: 3,
      status: DraftStatus.draft,
      data: {
        make: "Tesla",
        model: "Model 3",
        year: 2023,
        mileageKm: 15000,
        batteryCapacityKwh: 60,
        rangeKm: 491,
        vin: "5YJ3E1EA1PF000001",
        condition: "like_new", // See vehicleConditions in @ev-offer/core
        color: "White", // See vehicleColors in @ev-offer/core
        price: 35000,
        currency: "EUR", // See currencies in @ev-offer/core
        negotiable: true,
        warrantyMonths: 12,
        photos: [
          {
            url: "https://example.com/tesla-model3-front.jpg",
            sortOrder: 0,
            caption: "Front view",
          },
          {
            url: "https://example.com/tesla-model3-side.jpg",
            sortOrder: 1,
            caption: "Side view",
          },
        ],
        description:
          "Well-maintained Tesla Model 3 Long Range in excellent condition. Single owner, always garaged. Full service history available.",
      },
    },
  });

  console.log(`Created seed draft: ${draft.id}`);
  console.log("Seeding complete.");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
