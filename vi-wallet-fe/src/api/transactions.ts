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