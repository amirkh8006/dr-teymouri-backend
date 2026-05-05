import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateRoleDto, UpdateRoleDto, GetRolesQueryDto } from './dto/role.dto';
import { Role, RoleDocument } from './schemas/role.schema';
import { MAX_PAGINATION_LIMIT } from '../../common/utils/pagination-query.util';

@Injectable()
export class RoleService {
  constructor(@InjectModel(Role.name) private readonly roleModel: Model<RoleDocument>) {}

  async create(createRoleDto: CreateRoleDto): Promise<RoleDocument> {
    const existing = await this.roleModel.findOne({ name: createRoleDto.name }).exec();
    if (existing) {
      throw new ConflictException('نقش با این نام قبلاً وجود دارد');
    }

    return this.roleModel.create({
      ...createRoleDto,
      permissions: createRoleDto.permissions || [],
    });
  }

  async findAll(query: GetRolesQueryDto): Promise<any> {
    const { skip = 0, limit = 10, search } = query;

    if (limit < 1 || limit > MAX_PAGINATION_LIMIT) {
      throw new BadRequestException(`تعداد آیتم در هر صفحه باید بین 1 تا ${MAX_PAGINATION_LIMIT} باشد`);
    }

    const where: { name?: RegExp } = {};
    if (search) {
      where.name = new RegExp(search, 'i');
    }

    const [roles, total] = await Promise.all([
      this.roleModel.find(where).skip(skip).limit(limit).sort({ name: 1 }).exec(),
      this.roleModel.countDocuments(where).exec(),
    ]);

    return {
      statusCode: 200,
      message: 'لیست نقش‌ها با موفقیت بازگردانده شد',
      data: roles,
      pagination: {
        total,
        skip,
        limit,
      },
    };
  }

  async findOne(id: string): Promise<RoleDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('نقش یافت نشد');
    }

    const role = await this.roleModel.findById(id).exec();
    if (!role) {
      throw new NotFoundException('نقش یافت نشد');
    }

    return role;
  }

  async findByName(name: string): Promise<RoleDocument | null> {
    return this.roleModel.findOne({ name }).exec();
  }

  async update(id: string, updateRoleDto: UpdateRoleDto): Promise<RoleDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('نقش یافت نشد');
    }

    if (updateRoleDto.name) {
      const existing = await this.roleModel.findOne({ name: updateRoleDto.name, _id: { $ne: id } }).exec();
      if (existing) {
        throw new ConflictException('نقش با این نام قبلاً وجود دارد');
      }
    }

    const updated = await this.roleModel.findByIdAndUpdate(id, updateRoleDto, { new: true }).exec();
    if (!updated) {
      throw new NotFoundException('نقش یافت نشد');
    }

    return updated;
  }

  async remove(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('نقش یافت نشد');
    }

    const deleted = await this.roleModel.findByIdAndDelete(id).exec();
    if (!deleted) {
      throw new NotFoundException('نقش یافت نشد');
    }
  }

  async hasPermission(roleId: string, permission: string): Promise<boolean> {
    const role = await this.findOne(roleId);
    return role.permissions.includes(permission);
  }
}
