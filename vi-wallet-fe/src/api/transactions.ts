import api from "./axios";
import { Transaction } from "../models";

/* list helper remains identical */
export const getMyTransactions = async (): Promise<Transaction[]> => {
  const raw = await api
    .get<{ $values?: Transaction[] }>("/Transactions/my-transactions")
    .then(r => r.data);
  return Array.isArray(raw) ? raw : raw?.$values ?? [];
};

/* correct payload for POST /api/Transactions/send */
export interface SendInput {
  receiverId: number;
  currencyId: number;
  amount:     number;
}

export const sendTransaction = (input: SendInput) =>
  api.post<void>("/Transactions/send", input);

export const revertTransaction = (id: number) =>
  api.post<void>(`/Transactions/${id}/revert`);

export async function exportMyTransactions() {
    const token = localStorage.getItem("token");
    const res = await fetch("/api/Transactions/my-transactions/export", {
        headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
    });
    if (!res.ok) throw new Error(await res.text());
    const blob = await res.blob();
    // Create a link and trigger download
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "transactions.xlsx";
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
}
