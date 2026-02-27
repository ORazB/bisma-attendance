import { MajorList } from "@/generated/prisma";
import prisma from "@/lib/prisma";

async function main() {
  await prisma.grade.createMany({
    data: [{ value: 10 }, { value: 11 }, { value: 12 }],
    skipDuplicates: true,
  });

  await prisma.major.createMany({
    data: [
      { name: MajorList.PPLG },
      { name: MajorList.TJKT },
      { name: MajorList.DKV },
      { name: MajorList.AKUNTANSI },
    ],
    skipDuplicates: true,
  });
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
