import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from './schemas/user.schema';
import { Role, RoleDocument } from '../role/schemas/role.schema';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Role.name) private readonly roleModel: Model<RoleDocument>,
  ) {}

  async findByPhoneNumber(phoneNumber: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ phoneNumber }).populate('role').exec();
  }

  async createUser(phoneNumber: string, roleId?: string): Promise<UserDocument> {
    const payload: Partial<User> & { role?: Types.ObjectId } = {
      phoneNumber,
      isActive: true,
      isCompleted: false,
    };

    if (roleId) {
      payload.role = new Types.ObjectId(roleId);
    }

    return this.userModel.create(payload);
  }

  async completeRegistration(userId: string, registrationData: Partial<User>): Promise<UserDocument> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('کاربر یافت نشد');
    }

    const { phoneNumber: _phoneNumber, role: _role, isActive: _isActive, isCompleted: _isCompleted, ...updateData } =
      registrationData;

    const updatedUser = await this.userModel
      .findByIdAndUpdate(userId, { ...updateData, isCompleted: true }, { new: true })
      .populate('role')
      .exec();

    if (!updatedUser) {
      throw new NotFoundException('کاربر یافت نشد');
    }

    return updatedUser;
  }

  async findById(userId: string): Promise<UserDocument | null> {
    if (!Types.ObjectId.isValid(userId)) {
      return null;
    }

    return this.userModel.findById(userId).populate('role').exec();
  }

  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  async setPassword(userId: string, password: string): Promise<UserDocument | null> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('کاربر یافت نشد');
    }

    const hashedPassword = await this.hashPassword(password);
    return this.userModel.findByIdAndUpdate(userId, { password: hashedPassword }, { new: true }).exec();
  }

  async validateUserPasswordByPhoneNumber(phoneNumber: string, password: string): Promise<boolean> {
    const user = await this.userModel.findOne({ phoneNumber }).select('+password').exec();
    if (!user?.password) {
      return false;
    }

    return bcrypt.compare(password, user.password);
  }

  async getDoctorsList(): Promise<Array<{ id: string; firstName?: string; lastName?: string }>> {
    const doctorRole = await this.roleModel.findOne({ name: 'doctor' }).exec();
    if (!doctorRole) {
      throw new NotFoundException('نقش پزشک یافت نشد');
    }

    const doctors = await this.userModel
      .find({ role: doctorRole._id, isActive: true })
      .select('firstName lastName')
      .sort({ firstName: 1, lastName: 1 })
      .exec();

    return doctors.map((doctor) => ({
      id: doctor.id,
      firstName: doctor.firstName,
      lastName: doctor.lastName,
    }));
  }
}
