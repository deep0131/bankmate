import profileData from "@/data/user-profile.json";

export interface UserProfile {
  personal: {
    fullName: string;
    displayName: string;
    avatarInitials: string;
    cifNumber: string;
    userId: string;
    dateOfBirth: string;
    gender: string;
    email: string;
    phone: string;
    tier: string;
    kycStatus: string;
    reKycDue: string;
    panNumber: string;
    aadhaarNumber: string;
    communicationAddress: {
      line1: string;
      line2: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    };
    relationshipManager: {
      name: string;
      title: string;
      email: string;
      phone: string;
      branch: string;
    };
  };
  accounts: Array<{
    id: string;
    accountNumber: string;
    accountType: string;
    category: string;
    currency: string;
    availableBalance: number;
    ledgerBalance: number;
    ifsc: string;
    micr: string;
    branch: string;
    upiId: string;
    interestRate?: string;
    employer?: string;
    monthlyCredit?: number;
    status: string;
  }>;
  fixedDeposits: Array<{
    id: string;
    fdNumber: string;
    principalAmount: number;
    maturityAmount: number;
    interestRate: number;
    bookingDate: string;
    maturityDate: string;
    tenure: string;
    payoutType: string;
    status: string;
  }>;
  cards: Array<{
    id: string;
    cardName: string;
    cardType: string;
    network: string;
    cardNumberMasked: string;
    expiry: string;
    totalLimit?: number;
    availableLimit?: number;
    outstandingDue?: number;
    paymentDueDate?: string;
    rewardPoints?: number;
    rewardValue?: number;
    dailyAtm?: number;
    dailyPos?: number;
    status: string;
    contactless: boolean;
    international: boolean;
  }>;
  wealth: {
    totalNetWorth: number;
    liquidCash: number;
    fixedIncome: number;
    investments: number;
    mutualFunds: Array<{
      scheme: string;
      invested: number;
      currentValue: number;
      returnPercent: number;
    }>;
    goldBonds: number;
    creditScore: {
      score: number;
      agency: string;
      rating: string;
      lastUpdated: string;
    };
  };
  loans: Array<{
    loanType: string;
    offerAmount?: number;
    sanctionedAmount?: number;
    outstandingAmount?: number;
    interestRate: number;
    monthlyEmi?: number;
    tenure?: string;
    tenureRemaining?: string;
    accountNumber?: string;
    status: string;
  }>;
  security: {
    twoFactorEnabled: boolean;
    authMethod: string;
    primaryDevice: string;
    dailyTransferLimit: number;
    internationalTransferEnabled: boolean;
    nominee: {
      name: string;
      relation: string;
      sharePercentage: number;
      status: string;
    };
  };
}

export const deepYadavProfile = profileData as UserProfile;

export function formatINR(amount: number, forceDecimals?: boolean): string {
  const hasDecimals = forceDecimals ?? (amount % 1 !== 0);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: hasDecimals ? 2 : 0,
  }).format(amount);
}

