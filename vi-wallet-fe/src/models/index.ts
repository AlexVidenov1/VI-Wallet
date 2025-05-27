export interface Transaction {
    id: number;
    description: string;
    amount: number;
    createdAt: string;         
}

export interface Wallet {
    walletId: number;
    name: string;
    balance: number;
    currencyCode: string;
}

export interface LoginResponse {
    token: string;
    transactions?: Transaction[];
}
export interface Currency {
    id: number;
    code: string;
    name: string;
}
export interface Card {
    cardId: number;
    cardNumber: string;
    expirationDate: string;   
    isBlocked: boolean;
    walletId: number;
    wallet: {                     
        name: string;
        currencyCode: string;
        balance: number;
    };
}