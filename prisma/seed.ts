import { PrismaClient, Rating, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding...');

  await prisma.reviewCleaner.deleteMany();
  await prisma.review.deleteMany();
  await prisma.cleaning.deleteMany();
  await prisma.cleanerAssignment.deleteMany();
  await prisma.qrCode.deleteMany();
  await prisma.user.deleteMany();
  await prisma.entrance.deleteMany();

  const passwordHash = await bcrypt.hash('manager123', 10);
  const cleanerPwd = await bcrypt.hash('cleaner123', 10);

  const manager = await prisma.user.create({
    data: { login: 'manager', passwordHash, name: 'Анна Менеджер', role: Role.MANAGER },
  });

  const entrances = await Promise.all(
    [
      { number: 1, address: 'ул. Ленина, 5', floorsTotal: 5 },
      { number: 2, address: 'ул. Ленина, 5', floorsTotal: 9 },
      { number: 3, address: 'пр. Мира, 12', floorsTotal: 14 },
    ].map((data) => prisma.entrance.create({ data })),
  );

  const cleaners = await Promise.all(
    [
      { login: 'cleaner1', name: 'Мария Иванова', shift: 'Утренняя' },
      { login: 'cleaner2', name: 'Ольга Петрова', shift: 'Утренняя' },
      { login: 'cleaner3', name: 'Татьяна Сидорова', shift: 'Дневная' },
      { login: 'cleaner4', name: 'Елена Кузнецова', shift: 'Дневная' },
      { login: 'cleaner5', name: 'Светлана Морозова', shift: 'Вечерняя' },
    ].map((c) =>
      prisma.user.create({
        data: { ...c, passwordHash: cleanerPwd, role: Role.CLEANER, phone: '+70000000000' },
      }),
    ),
  );

  // assignments: cleaner1 -> e1; cleaner2 -> e2; cleaner3 -> e3; cleaner4 -> e1+e2 (M2M);
  // cleaner5 -> none for now (для проверки floorsPlanned=0)
  const assignments: Array<[number, number]> = [
    [0, 0],
    [1, 1],
    [2, 2],
    [3, 0],
    [3, 1],
  ];
  for (const [c, e] of assignments) {
    await prisma.cleanerAssignment.create({
      data: { cleanerId: cleaners[c].id, entranceId: entrances[e].id },
    });
  }

  // Cleanings today (a few floors)
  await prisma.cleaning.createMany({
    data: [
      { cleanerId: cleaners[0].id, entranceId: entrances[0].id, floor: 1, photoPath: 'cleanings/seed/c1f1.jpg' },
      { cleanerId: cleaners[0].id, entranceId: entrances[0].id, floor: 2, photoPath: 'cleanings/seed/c1f2.jpg' },
      { cleanerId: cleaners[1].id, entranceId: entrances[1].id, floor: 3, photoPath: 'cleanings/seed/c2f3.jpg' },
    ],
  });

  // Reviews — несколько за сегодня и за прошлые дни
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  async function createReview(entranceIdx: number, floor: number, rating: Rating, when: Date, comment?: string) {
    const eId = entrances[entranceIdx].id;
    const assigned = await prisma.cleanerAssignment.findMany({ where: { entranceId: eId } });
    await prisma.review.create({
      data: {
        entranceId: eId,
        floor,
        rating,
        comment,
        createdAt: when,
        cleaners: { create: assigned.map((a) => ({ cleanerId: a.cleanerId })) },
      },
    });
  }

  await createReview(0, 1, Rating.GOOD, now, 'Чисто!');
  await createReview(0, 2, Rating.OK, now);
  await createReview(0, 3, Rating.BAD, now, 'Грязные перила');
  await createReview(1, 5, Rating.GOOD, now);
  await createReview(2, 7, Rating.BAD, yesterday, 'Мусор не убран');
  await createReview(2, 7, Rating.GOOD, yesterday);
  await createReview(1, 2, Rating.OK, yesterday);

  console.log('Seeded:');
  console.log(`  manager: ${manager.login} / manager123`);
  console.log(`  cleaners: cleaner1..cleaner5 / cleaner123`);
  console.log(`  entrances: ${entrances.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
