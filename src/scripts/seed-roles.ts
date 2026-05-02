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
        permissions: [
          'role:create',
          'role:read',
          'role:update',
          'role:delete',
          'auth:register',
          'auth:logout',
          'appointment:slots:read',
          'appointment:doctors:read',
          'appointment:create',
          'appointment:read:own',
          'appointment:cancel:own',
          'appointment:read:detail:own',
          'admin:availability:create',
          'admin:availability:read',
          'admin:availability:update',
          'admin:availability:off-exception',
          'admin:appointments:read',
          'admin:appointments:read:doctor',
          'admin:appointments:status:update',
          'admin:appointments:confirm',
          'admin:appointments:complete',
          'admin:articles:create',
          'admin:articles:read',
          'admin:articles:update',
          'admin:articles:delete',
          'admin:pages:create',
          'admin:pages:read',
          'admin:pages:update',
          'admin:pages:delete',
        ],
      },
      {
        name: 'operator',
        description: 'اپراتور سیستم با دسترسی محدود',
        permissions: [
          'role:read',
          'auth:logout',
          'admin:availability:create',
          'admin:availability:read',
          'admin:availability:update',
          'admin:availability:off-exception',
          'admin:appointments:read',
          'admin:appointments:read:doctor',
          'admin:appointments:status:update',
          'admin:appointments:confirm',
          'admin:appointments:complete',
        ],
      },
      {
        name: 'user',
        description: 'کاربر عادی',
        permissions: [
          'auth:register',
          'auth:logout',
          'appointment:slots:read',
          'appointment:doctors:read',
          'appointment:create',
          'appointment:read:own',
          'appointment:cancel:own',
          'appointment:read:detail:own',
        ],
      },
      {
        name: 'doctor',
        description: 'پزشک',
        permissions: [
          'auth:register',
          'auth:logout',
          'appointment:slots:read',
          'appointment:create',
          'appointment:read:own',
          'appointment:cancel:own',
          'appointment:read:detail:own',
        ],
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
