import api from "./axios";
import { Wallet } from "../models";

export interface CreateWalletInput {
    name: string;
    currencyId: number;
}

export const getWallets = async (): Promise<Wallet[]> => {
    const res = await api.get<{ wallets: { $values: Wallet[] } }>("/Wallets");

    return res.data.wallets?.$values ?? [];
};

export const getWallet = (id: number) =>
    api.get<Wallet>(`/Wallets/${id}`).then(r => r.data);

export const createWallet = (input: CreateWalletInput) =>
    api.post<number>("/Wallets", input).then(r => r.data);

export const deleteWallet = (id: number) =>
    api.delete<void>(`/Wallets/${id}`);

export async function updateWalletName(walletId: number, name: string) {
    const token = localStorage.getItem("token");
    const res = await fetch(`/api/wallets/${walletId}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ name }),
    });
    if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || "Uknown error");
    } 
    return res.json();
}
