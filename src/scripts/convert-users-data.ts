import * as fs from 'fs';
import * as path from 'path';

// Source data interface
interface SourceUser {
  ParvandeID: number;
  ParvandeCode: number;
  Fname: string;
  Lname: string;
  InsID: number;
  InsBookNo: string;
  DateEtebar: string;
  InsAddID: null | number;
  InsAddBookNo: string;
  OzvID: null | number;
  Address: string;
  Tel: string;
  DateTashkil: string;
  UserID: number;
  SaatSabt: string;
  Email: string;
  BurnDate: string;
  MelliCode: string;
  Doctor_Default: number;
  ParvandeNumDasti: string;
  SectionID: number;
  Description: string;
  IsAlarmInPaziresh: boolean;
  National_Id: number;
  parent: string;
  Taahol: null | string;
  Shoghl: string;
  Mobile: string;
  Gender: number;
  SkineType: null | string;
  State: null | string;
  City: string;
  Fax: string;
  JobFax: string;
  ShomareShenasname: string;
  MoarefID: number;
  VIPCardID: string;
  IsConnectToMehrYasanCRM: null | boolean;
  Ashnayi: null | string;
  Location: string;
  Degree: null | string;
  Street: string;
  Alley: string;
  ParvandeDesc: string | null;
}

// Target User schema interface
interface ConvertedUser {
  phoneNumber: string;
  mobilePhone?: string;
  manualFileNumber?: string;
  isActive?: boolean;
  isCompleted?: boolean;
  firstName?: string;
  lastName?: string;
  birthDate?: string;
  maritalStatus?: string;
  educationLevel?: string;
  occupation?: string;
  visitDate?: string;
  referralSource?: string;
  nationalId?: string;
  referrer?: string;
  groceryBuyer?: string;
  cookName?: string;
  jobStatus?: string;
  housingStatus?: string;
  mealsConsumedAtHome?: string[];
  removedMeals?: string[];
  address?: string;
  landlinePhone?: string;
  foodPreferences?: Array<{ foodType: string; consumes: boolean }>;
}

// Utility function to clean Persian whitespace
const cleanString = (str: string): string => {
  if (!str || typeof str !== 'string') return '';
  return str.trim().replace(/\s+/g, ' ');
};

const getPhoneKey = (sourceUser: SourceUser): string => {
  return cleanString(sourceUser.Mobile) || cleanString(sourceUser.Tel) || `user_${sourceUser.ParvandeID}`;
};

// Convert Persian date format to ISO format (Jalali to Gregorian)
const convertPersianDateToISO = (persianDate: string): string => {
  if (!persianDate || !persianDate.trim()) return '';
  // Format: 1372/02/21 -> Convert to ISO (simplified, returns as-is with slashes replaced)
  // In production, you'd use a proper Jalali to Gregorian converter
  try {
    const parts = persianDate.split('/');
    if (parts.length === 3) {
      return `${parts[0]}-${parts[1]}-${parts[2]}`;
    }
  } catch (error) {
    console.warn(`Failed to parse date: ${persianDate}`);
  }
  return '';
};

// Main conversion function
function convertUserData(sourceUser: SourceUser): ConvertedUser {
  // phoneNumber is required - prioritize Mobile, then Tel
  const phoneNumber = cleanString(sourceUser.Mobile) || cleanString(sourceUser.Tel) || `user_${sourceUser.ParvandeID}`;

  const converted: ConvertedUser = {
    phoneNumber: phoneNumber,
    mobilePhone: cleanString(sourceUser.Mobile) || undefined,
    manualFileNumber: cleanString(sourceUser.ParvandeNumDasti) || undefined,
    landlinePhone: cleanString(sourceUser.Tel) || undefined,
    firstName: cleanString(sourceUser.Fname) || undefined,
    lastName: cleanString(sourceUser.Lname) || undefined,
    birthDate: convertPersianDateToISO(sourceUser.BurnDate) || undefined,
    nationalId: cleanString(sourceUser.MelliCode) || undefined,
    occupation: cleanString(sourceUser.Shoghl) || undefined,
    address: cleanString(sourceUser.Address) || undefined,
    isActive: true,
    isCompleted: false,
    visitDate: sourceUser.DateTashkil && sourceUser.DateTashkil.trim() ? convertPersianDateToISO(sourceUser.DateTashkil) : undefined,
  };

  return converted;
}

// Main function to read and convert all users
async function convertAllUsers(): Promise<void> {
  try {
    const dataPath = path.join(__dirname, '../../data.json');
    const sourceData = fs.readFileSync(dataPath, 'utf-8');
    const sourceUsers: SourceUser[] = JSON.parse(sourceData);

    console.log(`Total users to convert: ${sourceUsers.length}`);

    const convertedUsers: ConvertedUser[] = sourceUsers.map((user) => convertUserData(user));

    // Output to file
    // Split duplicates by phoneNumber
    const byPhone = new Map<string, { source: SourceUser; converted: ConvertedUser }[]>();
    for (let index = 0; index < sourceUsers.length; index += 1) {
      const source = sourceUsers[index];
      const converted = convertedUsers[index];
      const key = getPhoneKey(source);
      const arr = byPhone.get(key) || [];
      arr.push({ source, converted });
      byPhone.set(key, arr);
    }

    const duplicates: SourceUser[] = [];
    const uniqueFinal: ConvertedUser[] = [];

    for (const [phone, items] of byPhone.entries()) {
      if (phone && items.length > 1) {
        duplicates.push(...items.map((item) => item.source));
        continue;
      } else {
        uniqueFinal.push(items[0].converted);
      }
    }

    const outputPath = path.join(__dirname, '../../converted-users.json');
    const duplicatesPath = path.join(__dirname, '../../duplicate-users.json');
    const finalPath = path.join(__dirname, '../../final-users-for-import.json');

    fs.writeFileSync(outputPath, JSON.stringify(convertedUsers, null, 2), 'utf-8');
    fs.writeFileSync(duplicatesPath, JSON.stringify(duplicates, null, 2), 'utf-8');
    fs.writeFileSync(finalPath, JSON.stringify(uniqueFinal, null, 2), 'utf-8');

    console.log(`✅ Conversion complete! Outputs saved to:`);
    console.log(`  - All converted: ${outputPath}`);
    console.log(`  - Duplicates: ${duplicatesPath}`);
    console.log(`  - Final import list: ${finalPath}`);
    console.log(`📊 Converted ${convertedUsers.length} users, ${duplicates.length} duplicate entries found`);

    // Print sample
    console.log('\n📋 Sample of first converted user:');
    console.log(JSON.stringify(uniqueFinal[0], null, 2));
  } catch (error) {
    console.error('❌ Conversion failed:', error);
    process.exit(1);
  }
}

convertAllUsers();
