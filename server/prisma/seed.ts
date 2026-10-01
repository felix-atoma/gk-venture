import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import 'dotenv/config';

const prisma = new PrismaClient();

/** Starter gallery photos (static files in client/public/images). Staff can edit or replace them in the admin. */
const STARTER_GALLERY = [
  { imageUrl: '/images/certificate-presentation.jpg', caption: 'Certificate presentation in court', sortOrder: 1 },
  {
    imageUrl: '/images/adr-graduation.jpg',
    caption: 'ADR & Paralegal Studies graduation ceremony',
    court: 'ISSER, University of Ghana',
    year: 2026,
    sortOrder: 2,
  },
  {
    imageUrl: '/images/memorial.jpg',
    caption: 'Martyrs of the Rule of Law monument',
    court: 'Supreme Court of Ghana, Accra',
    sortOrder: 3,
  },
];

async function seedGallery() {
  if ((await prisma.galleryPhoto.count()) > 0) return;
  await prisma.galleryPhoto.createMany({ data: STARTER_GALLERY });
  console.log(`Added ${STARTER_GALLERY.length} starter gallery photos.`);
}

async function main() {
  await seedGallery();
  const email = (process.env.ADMIN_EMAIL ?? '').toLowerCase().trim();
  const password = process.env.ADMIN_PASSWORD ?? '';
  if (!email || password.length < 8) {
    throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD (min 8 chars) in .env before seeding.');
  }
  const existing = await prisma.adminUser.findUnique({ where: { email } });
  if (existing) {
    console.log(`Admin ${email} already exists - leaving password unchanged.`);
    return;
  }
  await prisma.adminUser.create({
    data: {
      email,
      name: process.env.ADMIN_NAME ?? 'Administrator',
      role: Role.ADMIN,
      passwordHash: await bcrypt.hash(password, 12),
    },
  });
  console.log(`Created admin ${email}. Change the password after first login.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
