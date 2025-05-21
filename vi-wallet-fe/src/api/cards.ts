/* eslint-disable @typescript-eslint/no-explicit-any */
import api from "./axios";
import { CleanCard } from "../models/";

export interface CreateCardInput {
    walletId: number;
    cardNumber: string;
    expirationDate: string;   // "YYYY-MM-DD"
}

/* ───────────── helpers ───────────── */

/* LIST */
export const getCards = async (): Promise<CleanCard[]> => {
    const res = await api.get("/Card/GetCards");

    /* 1. unwrap ReferenceHandler wrapper when present */
    const rawList = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.$values)
            ? res.data.$values
            : [];

    /* 2. shape every record so the UI never crashes */
    return rawList.map((c: any) => ({
        cardId: c.cardId,
        cardNumber: c.cardNumber,
        expirationDate: c.expirationDate,
        isBlocked: !!c.isBlocked,
        wallet: {
            name: c.wallet?.name ?? "—",
            currencyCode: c.wallet?.currency?.code ?? c.wallet?.currencyCode ?? "",
            balance: Number(c.wallet?.balance) || 0,
        },
    })) as CleanCard[];
};

/* CREATE */
export const createCard = (input: CreateCardInput) =>
    api.post<number>("/Card/create", input).then(r => r.data);

/* BLOCK / UNBLOCK */
export const blockCard = (id: number) => api.post(`/Card/${id}/block`);
export const unblockCard = (id: number) => api.post(`/Card/${id}/unblock`);

/* WITHDRAW */
export const withdraw = (id: number, amount: number) =>
    api.post(`/Card/${id}/withdraw`, { amount });