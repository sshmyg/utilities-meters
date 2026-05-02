interface ElectricityAddressData {
  codeZone: string;
  codeScale: string;
  alias: string;
  name: string;
  old: string;
  readingDate: string;
}

interface ElectricityAddressProfile {
  companyId: string;
  kontAccountId: string;
  worksId: string;
  languageId: string;
  equipNumber: string;
  worksName: string;
  nameByPass: string;
}

export interface ElectricityAddress {
  result: boolean;
  address: string;
  listAddresses: boolean;
  data: ElectricityAddressData[];
  profile: ElectricityAddressProfile;
}
