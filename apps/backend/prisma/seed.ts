import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Bắt đầu seed dữ liệu mẫu cho VitaCare...');

  // 1. Danh mục thực phẩm hệ thống (created_by: null)
  const systemFoods = [
    {
      name: 'Cơm trắng',
      caloriesPer100g: 130.0,
      proteinPer100g: 2.7,
      carbsPer100g: 28.2,
      fatPer100g: 0.3,
      source: 'Viện Dinh Dưỡng Quốc Gia',
    },
    {
      name: 'Ức gà phi lê',
      caloriesPer100g: 165.0,
      proteinPer100g: 31.0,
      carbsPer100g: 0.0,
      fatPer100g: 3.6,
      source: 'USDA Nutrition Database',
    },
    {
      name: 'Trứng gà (luộc)',
      caloriesPer100g: 155.0,
      proteinPer100g: 13.0,
      carbsPer100g: 1.1,
      fatPer100g: 11.0,
      source: 'Viện Dinh Dưỡng Quốc Gia',
    },
    {
      name: 'Cá hồi tươi',
      caloriesPer100g: 208.0,
      proteinPer100g: 20.0,
      carbsPer100g: 0.0,
      fatPer100g: 13.0,
      source: 'USDA Nutrition Database',
    },
    {
      name: 'Phở bò tái',
      caloriesPer100g: 105.0,
      proteinPer100g: 7.5,
      carbsPer100g: 13.0,
      fatPer100g: 2.8,
      source: 'Viện Dinh Dưỡng Quốc Gia',
    },
    {
      name: 'Bánh mì thịt',
      caloriesPer100g: 250.0,
      proteinPer100g: 9.0,
      carbsPer100g: 32.0,
      fatPer100g: 9.5,
      source: 'Viện Dinh Dưỡng Quốc Gia',
    },
    {
      name: 'Bông cải xanh (luộc)',
      caloriesPer100g: 35.0,
      proteinPer100g: 2.4,
      carbsPer100g: 7.0,
      fatPer100g: 0.4,
      source: 'USDA Nutrition Database',
    },
    {
      name: 'Chuối tiêu',
      caloriesPer100g: 89.0,
      proteinPer100g: 1.1,
      carbsPer100g: 22.8,
      fatPer100g: 0.3,
      source: 'Viện Dinh Dưỡng Quốc Gia',
    },
    {
      name: 'Táo tươi',
      caloriesPer100g: 52.0,
      proteinPer100g: 0.3,
      carbsPer100g: 13.8,
      fatPer100g: 0.2,
      source: 'USDA Nutrition Database',
    },
    {
      name: 'Sữa tươi không đường',
      caloriesPer100g: 62.0,
      proteinPer100g: 3.2,
      carbsPer100g: 4.8,
      fatPer100g: 3.5,
      source: 'Viện Dinh Dưỡng Quốc Gia',
    },
  ];

  for (const food of systemFoods) {
    const existing = await prisma.foodItem.findFirst({
      where: { name: food.name, createdBy: null },
    });
    if (!existing) {
      await prisma.foodItem.create({
        data: food,
      });
      console.log(`  + Đã thêm món: ${food.name}`);
    }
  }

  console.log('✅ Seed dữ liệu mẫu hoàn tất!');
}

main()
  .catch((e) => {
    console.error('❌ Lỗi seed dữ liệu:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

