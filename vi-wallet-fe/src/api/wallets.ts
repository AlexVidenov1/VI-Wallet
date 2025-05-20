import api from "./axios";
import { Wallet } from "../models";

export interface CreateWalletInput {
    name: string;
    currencyId: number;
}

/* GET /api/Wallets  ->  { wallets: WalletDto[] } */
export const getWallets = async (): Promise<Wallet[]> => {
    const res = await api.get<{ wallets: { $values: Wallet[] } }>("/Wallets");

    // unwrap both layers safely
    return res.data.wallets?.$values ?? [];
};

/* GET /api/Wallets/{id} */
export const getWallet = (id: number) =>
    api.get<Wallet>(`/Wallets/${id}`).then(r => r.data);

/* POST /api/Wallets  -> the new walletId (number) */
export const createWallet = (input: CreateWalletInput) =>
    api.post<number>("/Wallets", input).then(r => r.data);

/* DELETE /api/Wallets/{id}  -> 204 NoContent */
export const deleteWallet = (id: number) =>
    api.delete<void>(`/Wallets/${id}`);