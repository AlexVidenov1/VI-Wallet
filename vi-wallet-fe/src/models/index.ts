export interface Transaction {
    id: number;
    description: string;
    amount: number;
    createdAt: string;         // ISO string coming from the API
}

export interface LoginResponse {
    token: string;
    // if your login currently returns the transactions
    transactions?: Transaction[];
}