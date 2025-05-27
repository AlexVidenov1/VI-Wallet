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

export const sendTransaction = async (input: SendInput) => {
    try {
        await api.post<void>("/Transactions/send", input);
    } catch (error: Any) {
        let msg = "Unknown error";
        if (error?.response?.data) {
            if (typeof error.response.data === "string") {
                msg = error.response.data;
            } else if (typeof error.response.data === "object" && error.response.data.message) {
                msg = error.response.data.message;
            }
        } else if (error?.message) {
            msg = error.message;
        }
        throw new Error(msg);
    }
};

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
