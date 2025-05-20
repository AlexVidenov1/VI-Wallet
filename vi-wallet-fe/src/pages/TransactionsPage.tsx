import React from "react";
import {
    Paper,
    TableContainer,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    Typography,
    Box,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import api from "../api/axios";
import { Transaction } from "../models";

const fetchTransactions = async (): Promise<Transaction[]> => {
    const raw = await api
        .get<{ $values?: Transaction[] }>("/Transactions/my-transactions")
        .then((r) => r.data);

    // unwrap $values when present
    const list = Array.isArray(raw) ? raw : raw.$values;
    return list ?? [];
};

export default function TransactionsPage() {
    const { data = [], isPending, error } = useQuery<Transaction[]>({
        queryKey: ["transactions"],
        queryFn: fetchTransactions,
    });

    if (isPending) return <Typography sx={{ mt: 4, textAlign: "center" }}>Loading…</Typography>;

    if (error)
        return (
            <Typography sx={{ mt: 4, textAlign: "center" }} color="error">
                {(error as Error).message}
            </Typography>
        );

    /* ---------- EMPTY-STATE ---------- */
    if (data.length === 0)
        return (
            <Box sx={{ mt: 8, textAlign: "center" }}>
                <Typography variant="h5" gutterBottom>
                    You don&apos;t have any transactions yet
                </Typography>
                <Typography color="text.secondary">
                    When you start sending or receiving money they will appear here.
                </Typography>
            </Box>
        );

    /* ---------- TABLE WITH ROWS ---------- */
    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
                Your Transactions
            </Typography>

            <TableContainer component={Paper}>
                <Table size="small">
                    <TableHead>
                        <TableRow sx={{ backgroundColor: "grey.200" }}>
                            <TableCell>Date</TableCell>
                            <TableCell>Description</TableCell>
                            <TableCell align="right">Amount</TableCell>
                        </TableRow>
                    </TableHead>

                    <TableBody>
                        {data.map((t) => (
                            <TableRow key={t.id} hover>
                                <TableCell>
                                    {new Date(t.createdAt).toLocaleDateString(undefined, {
                                        year: "numeric",
                                        month: "short",
                                        day: "numeric",
                                    })}
                                </TableCell>
                                <TableCell>{t.description}</TableCell>
                                <TableCell
                                    align="right"
                                    sx={{ color: t.amount < 0 ? "error.main" : "success.main" }}
                                >
                                    {t.amount.toFixed(2)}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
}