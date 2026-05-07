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
  await prisma.building.deleteMany();
  await prisma.street.deleteMany();

  const passwordHash = await bcrypt.hash('manager123', 10);
  const cleanerPwd = await bcrypt.hash('cleaner123', 10);

  const manager = await prisma.user.create({
    data: { login: 'manager', passwordHash, name: 'Анна Менеджер', role: Role.MANAGER },
  });

  const [lenina, mira] = await Promise.all([
    prisma.street.create({ data: { name: 'ул. Ленина' } }),
    prisma.street.create({ data: { name: 'пр. Мира' } }),
  ]);

  const buildingA = await prisma.building.create({
    data: { streetId: lenina.id, number: '12', floorsTotal: 9, entrancesCount: 4 },
  });
  const buildingB = await prisma.building.create({
    data: { streetId: lenina.id, number: '14А', floorsTotal: 5, entrancesCount: 2 },
  });
  const buildingC = await prisma.building.create({
    data: { streetId: mira.id, number: '7 к.1', floorsTotal: 16, entrancesCount: 1 },
  });

  const entranceSpecs = [
    ...Array.from({ length: 4 }, (_, i) => ({ buildingId: buildingA.id, number: i + 1 })),
    ...Array.from({ length: 2 }, (_, i) => ({ buildingId: buildingB.id, number: i + 1 })),
    { buildingId: buildingC.id, number: 1 },
  ];
  const entrances = await Promise.all(
    entranceSpecs.map((data) => prisma.entrance.create({ data })),
  );

  const cleaners = await Promise.all(
    [
      { login: 'cleaner1', name: 'Мария Иванова', shift: 'Утренняя' },
      { login: 'cleaner2', name: 'Ольга Петрова', shift: 'Утренняя' },
      { login: 'cleaner3', name: 'Татьяна Сидорова', shift: 'Дневная' },
      { login: 'cleaner4', name: 'Елена Кузнецова', shift: 'Дневная' },
      { login: 'cleaner5', name: 'Светлана Морозова', shift: 'Вечерняя' },
      { login: 'cleaner6', name: 'Наталья Андреева', shift: 'Вечерняя' },
      { login: 'cleaner7', name: 'Ирина Павлова', shift: 'Сменная' },
    ].map((c, index) =>
      prisma.user.create({
        data: {
          ...c,
          passwordHash: cleanerPwd,
          role: Role.CLEANER,
          phone: `+7000000000${index + 1}`,
        },
      }),
    ),
  );

  for (let i = 0; i < entrances.length; i += 1) {
    await prisma.cleanerAssignment.create({
      data: { cleanerId: cleaners[i].id, entranceId: entrances[i].id },
    });
  }

  const now = new Date();
  const ratings = [Rating.GOOD, Rating.OK, Rating.BAD, Rating.GOOD, Rating.OK];

  async function createReview(index: number) {
    const entrance = entrances[index % entrances.length];
    const building =
      entrance.buildingId === buildingA.id ? buildingA : entrance.buildingId === buildingB.id ? buildingB : buildingC;
    const when = new Date(now);
    when.setDate(now.getDate() - (index % 7));
    when.setHours(8 + (index % 10), (index * 7) % 60, 0, 0);
    const assigned = await prisma.cleanerAssignment.findMany({ where: { entranceId: entrance.id } });
    await prisma.review.create({
      data: {
        entranceId: entrance.id,
        floor: (index % building.floorsTotal) + 1,
        rating: ratings[index % ratings.length],
        comment: index % 6 === 0 ? 'Нужна повторная проверка площадки' : undefined,
        createdAt: when,
        cleaners: { create: assigned.map((a) => ({ cleanerId: a.cleanerId })) },
      },
    });
  }

  for (let i = 0; i < 30; i += 1) {
    await createReview(i);
  }

  const cleanings = Array.from({ length: 15 }, (_, index) => {
    const entrance = entrances[index % entrances.length];
    const building =
      entrance.buildingId === buildingA.id ? buildingA : entrance.buildingId === buildingB.id ? buildingB : buildingC;
    const cleaner = cleaners[index % cleaners.length];
    const when = new Date(now);
    when.setDate(now.getDate() - (index % 7));
    when.setHours(9 + (index % 8), (index * 11) % 60, 0, 0);
    return {
      cleanerId: cleaner.id,
      entranceId: entrance.id,
      floor: (index % building.floorsTotal) + 1,
      photoPath: `cleanings/seed/c${index + 1}.jpg`,
      createdAt: when,
    };
  });
  await prisma.cleaning.createMany({ data: cleanings });

  console.log('Seeded:');
  console.log(`  manager: ${manager.login} / manager123`);
  console.log('  cleaners: cleaner1..cleaner7 / cleaner123');
  console.log(`  streets: 2, buildings: 3, entrances: ${entrances.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
