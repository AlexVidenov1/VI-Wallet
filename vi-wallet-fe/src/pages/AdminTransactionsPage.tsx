import React, { useState } from "react";
import {
    Box, Typography, Paper, TableContainer, Table, TableHead,
    TableRow, TableCell, TableBody, IconButton, TablePagination, Chip, CircularProgress
} from "@mui/material";
import UndoIcon from "@mui/icons-material/Undo";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSnackbar } from "notistack";
import { getUserRole } from "./auth/AuthContext"; // adjust path if needed
import axios from "../api/axios"; // or your axios instance

// Transaction type for admin endpoint
interface AdminTransaction {
    transactionId: number;
    senderId: number;
    receiverId: number;
    currency: string;
    amount: number;
    transactionDate: string;
    isReverted: boolean;
}

export default function AdminTransactionsPage() {
    const { enqueueSnackbar } = useSnackbar();
    const qc = useQueryClient();
    const isAdmin = getUserRole() === "Admin";

    // Pagination state
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    // Fetch transactions
    const { data, isLoading, error } = useQuery({
        queryKey: ["admin-transactions", page, rowsPerPage],
        queryFn: async () => {
            const res = await axios.get(`/admin/transactions?page=${page + 1}&pageSize=${rowsPerPage}`);
            return res.data;
        }
    });

    // The backend returns { $id: "...", $values: [...] }
    const transactions: AdminTransaction[] = Array.isArray(data?.$values) ? data.$values : [];

    // Revert mutation
    const revertMut = useMutation({
        mutationFn: async (id: number) => {
            await axios.post(`/transactions/${id}/revert`);
        },
        onSuccess: () => {
            enqueueSnackbar("Транзакцията е върната!", { variant: "success" });
            qc.invalidateQueries({ queryKey: ["admin-transactions"] });
        },
        onError: (err: any) => {
            enqueueSnackbar(err?.response?.data || "Грешка при връщане на транзакция", { variant: "error" });
        }
    });

    if (!isAdmin) {
        return <Typography color="error" sx={{ mt: 4, textAlign: "center" }}>Достъп само за администратори.</Typography>;
    }

    if (isLoading) {
        return <Box mt={8} textAlign="center"><CircularProgress /></Box>;
    }
    if (error) {
        return <Typography color="error" sx={{ mt: 4, textAlign: "center" }}>{(error as Error).message}</Typography>;
    }

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom textAlign="center">
                Всички транзакции (Админ)
            </Typography>
            <Paper>
                <TableContainer>
                    <Table size="small">
                        <TableHead>
                        <TableRow>
                                <TableCell colSpan={8} align="right" sx={{ background: "#f9f9f9", borderBottom: 0, pt: 1, pb: 0 }}>
                                  <Typography variant="caption" color="text.secondary">
                                    * Бутонът за връщане изчезва, когато транзакцията вече е върната.
                                  </Typography>
                                </TableCell>
                              </TableRow>
                            <TableRow>
                                <TableCell>Номер на транзакция</TableCell>
                                <TableCell>Изпращач</TableCell>
                                <TableCell>Получил</TableCell>
                                <TableCell>Валута</TableCell>
                                <TableCell>Сума</TableCell>
                                <TableCell>Дата</TableCell>
                                <TableCell>Статус на транзакция</TableCell>
                                <TableCell>Действие</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {transactions.map((t) => (
                                <TableRow key={t.transactionId}>
                                    <TableCell>{t.transactionId}</TableCell>
                                    <TableCell>{t.senderId}</TableCell>
                                    <TableCell>{t.receiverId}</TableCell>
                                    <TableCell>{t.currency}</TableCell>
                                    <TableCell>
                                        <Chip
                                            label={Math.abs(t.amount).toFixed(2)}
                                            color={t.amount < 0 ? "error" : "success"}
                                            size="small"
                                            sx={{ minWidth: 80, fontWeight: 600 }}
                                        />
                                    </TableCell>
                                    <TableCell>{new Date(t.transactionDate).toLocaleString()}</TableCell>
                                    <TableCell>
                                        {t.isReverted ? (
                                            <Chip label="Върната" color="warning" size="small" />
                                        ) : (
                                            <Chip label="OK" color="success" size="small" />
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {!t.isReverted && (
                                            <IconButton
                                                size="small"
                                                color="warning"
                                                onClick={() => revertMut.mutate(t.transactionId)}
                                                disabled={revertMut.isPending}
                                            >
                                                <UndoIcon fontSize="small" />
                                            </IconButton>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
                <TablePagination
                    component="div"
                    count={-1}
                    page={page}
                    onPageChange={(_, newPage) => setPage(newPage)}
                    rowsPerPage={rowsPerPage}
                    onRowsPerPageChange={e => {
                        setRowsPerPage(parseInt(e.target.value, 10));
                        setPage(0);
                    }}
                    rowsPerPageOptions={[5, 10, 25, 50]}
                />
            </Paper>
        </Box>
    );
}
