import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from '../app.module';
import { RoleService } from '../modules/role/role.service';

async function seedRoles() {
  const logger = new Logger('SeedRoles');
  const app = await NestFactory.createApplicationContext(AppModule);
  const roleService = app.get(RoleService);

  try {
    // Create default roles
    const roles = [
      {
        name: 'admin',
        description: 'مدیر سیستم با تمام دسترسی‌ها',
        permissions: ['role:create', 'role:read', 'role:update', 'role:delete'],
      },
      {
        name: 'operator',
        description: 'اپراتور سیستم با دسترسی محدود',
        permissions: ['role:read'],
      },
      {
        name: 'user',
        description: 'کاربر عادی',
        permissions: ['auth:set-password'],
      },
    ];

    for (const roleData of roles) {
      const existingRole = await roleService.findByName(roleData.name);
      if (!existingRole) {
        await roleService.create(roleData);
        logger.log(`نقش ${roleData.name} ایجاد شد`);
      } else {
        // update permissions
        const updateData = {
          name: roleData.name,
          description: roleData.description,
          permissions: roleData.permissions,
        };
        await roleService.update(existingRole.id, updateData);
        logger.log(`نقش ${roleData.name} به‌روزرسانی شد`);
      }
    }

    logger.log('تمام نقش‌ها با موفقیت ایجاد شدند');
  } catch (error) {
    logger.error('خطا در ایجاد نقش‌ها:', error);
  } finally {
    await app.close();
    process.exit(0);
  }
}

// Run the seed function if this file is executed directly
if (require.main === module) {
  seedRoles();
}
