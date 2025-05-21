export interface Transaction {
    id: number;
    description: string;
    amount: number;
    createdAt: string;         // ISO string coming from the API
}

export interface Wallet {
    walletId: number;
    name: string;
    balance: number;
    currencyCode: string;
}

export interface LoginResponse {
    token: string;
    // if your login currently returns the transactions
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
    expirationDate: string;   // ISO string
    isBlocked: boolean;
    walletId: number;
    wallet: {                     // minimal data that comes from GET /Card/GetCards
        name: string;
        currencyCode: string;
        balance: number;
    };
}