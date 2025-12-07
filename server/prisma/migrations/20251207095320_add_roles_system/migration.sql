-- CreateTable
CREATE TABLE "Role" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT,
    "permissions" TEXT[],
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");

-- Вставляем роли по умолчанию
INSERT INTO "Role" ("name", "displayName", "description", "permissions", "isSystem", "createdAt", "updatedAt") VALUES
('admin', 'Администратор', 'Полный доступ ко всем разделам системы', 
 ARRAY['dashboard.view', 'dashboard.edit', 'warehouse.view', 'warehouse.edit', 'personnel.view', 'personnel.edit', 'roles.view', 'roles.edit'], 
 true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('supervisor', 'Руководитель цеха', 'Управление дашбордом и складом', 
 ARRAY['dashboard.view', 'dashboard.edit', 'warehouse.view', 'warehouse.edit'], 
 true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('logistician', 'Логист', 'Просмотр дашборда и управление складом', 
 ARRAY['dashboard.view', 'warehouse.view', 'warehouse.edit'], 
 true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Добавляем updatedAt к существующим таблицам
ALTER TABLE "Material" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Task" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "User" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Добавляем roleId (временно nullable)
ALTER TABLE "User" ADD COLUMN "roleId" INTEGER;

-- Обновляем существующих пользователей (мапим старые роли на новые)
UPDATE "User" SET "roleId" = (SELECT id FROM "Role" WHERE name = 'admin') WHERE "role" = 'admin';
UPDATE "User" SET "roleId" = (SELECT id FROM "Role" WHERE name = 'supervisor') WHERE "role" = 'supervisor';
UPDATE "User" SET "roleId" = (SELECT id FROM "Role" WHERE name = 'logistician') WHERE "role" = 'logistician';

-- Для пользователей с неизвестными ролями - назначаем logistician
UPDATE "User" SET "roleId" = (SELECT id FROM "Role" WHERE name = 'logistician') WHERE "roleId" IS NULL;

-- Делаем roleId обязательным
ALTER TABLE "User" ALTER COLUMN "roleId" SET NOT NULL;

-- Добавляем внешний ключ
ALTER TABLE "User" ADD CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Удаляем старое поле role
ALTER TABLE "User" DROP COLUMN "role";