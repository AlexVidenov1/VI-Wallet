import React, { useState, useMemo } from "react";
import {
    Box, Typography, Paper, TableContainer, Table, TableHead,
    TableRow, TableCell, TableBody, Button, Dialog, DialogTitle,
    DialogContent, DialogActions, TextField, Stack, FormControl,
    InputLabel, Select, MenuItem, Chip, CircularProgress, Container
} from "@mui/material";
import { styled } from "@mui/material/styles";
import AddIcon from "@mui/icons-material/Add";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";

import { useQuery, useMutation, useQueryClient, UseMutationResult } from "@tanstack/react-query";
import { Transaction, Currency } from "../models";
import { getCurrencies } from "../api/currencies";
import {
    getMyTransactions, sendTransaction,
    SendInput, exportMyTransactions
} from "../api/transactions";
import { useSnackbar } from "notistack";
import { getUserRole } from "../pages/auth/AuthContext"; // adjust path as needed

/* ──────────────────────────────── STYLED COMPONENTS ──────────────────────────────── */

const HeadCell = styled(TableCell)(({ theme }) => ({
    fontWeight: 600,
    textAlign: "center",
    background: theme.palette.grey[200]
}));

const BodyRow = styled(TableRow)(({ theme }) => ({
    "&:nth-of-type(odd)": { backgroundColor: theme.palette.action.hover },
    "& td": { textAlign: "center" }
}));

function AmountChip({ value }: { value: number }) {
    const color = value < 0 ? "error" : "success";
    return (
        <Chip
            label={Math.abs(value).toFixed(2)}
            color={color as any}
            size="small"
            sx={{ minWidth: 80, fontWeight: 600 }}
        />
    );
}

/* ────────────────────────────────── PAGE ────────────────────────────────── */

export default function TransactionsPage() {
    const qc = useQueryClient();
    const { enqueueSnackbar } = useSnackbar();

    // Get user role for admin check
    const userRole = getUserRole();
    const isAdmin = userRole === "Admin";

    /* queries */
    const { data: tx = [], isPending, error } = useQuery<Transaction[]>({
        queryKey: ["transactions"],
        queryFn: getMyTransactions
    });

    const { data: currencies = [] } = useQuery<Currency[]>({
        queryKey: ["currencies"],
        queryFn: getCurrencies
    });

    // You may need to get the current userId for type filtering
    // Replace this with your actual user id logic
    const userId = Number(localStorage.getItem("userId")) || 0;

    /* dialog state */
    const [openSend, setOpenSend] = useState(false);
    const [send, setSend] = useState<SendInput>({ receiverId: 0, currencyId: 0, amount: 0 });

    /* filter state */
    const [filter, setFilter] = useState({
        currencyId: "",
        minAmount: "",
        maxAmount: "",
        type: "" // "sent" | "received" | ""
    });

    /* mutations */
    const sendMut = useMutation({
        mutationFn: (input: SendInput) => sendTransaction(input),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["transactions"] });
            setOpenSend(false);
            setSend({ receiverId: 0, currencyId: 0, amount: 0 });
            enqueueSnackbar("Транзакцията е извършена!", { variant: "success" });
        },
        onError: (e: any) =>
            enqueueSnackbar(e?.message ?? "Неуспех при извършване на транзакция", { variant: "error" })
    });

    /* filter logic */
    const filteredTx = useMemo(() => {
        return tx.filter(t => {
            if (filter.currencyId && t.currencyId !== +filter.currencyId) return false;
            if (filter.minAmount && t.amount < +filter.minAmount) return false;
            if (filter.maxAmount && t.amount > +filter.maxAmount) return false;
            if (filter.type === "sent" && t.senderId !== userId) return false;
            if (filter.type === "received" && t.receiverId !== userId) return false;
            return true;
        });
    }, [tx, filter, userId]);

    /* loading / error */
    if (isPending) {
        return (
            <Box mt={8} textAlign="center">
                <CircularProgress />
            </Box>
        );
    }
    if (error) {
        return (
            <Typography mt={8} textAlign="center" color="error">
                {(error as Error).message}
            </Typography>
        );
    }

    /* UI */
    return (
        <Container maxWidth="md" sx={{ py: 4 }}>
            <Paper elevation={3} sx={{ p: 4 }}>
                <Stack spacing={3}>
                    {/* Title */}
                    <Typography variant="h4" textAlign="center" fontWeight={600}>
                        Мои транзакции
                    </Typography>

                    {/* Toolbar */}
                    <Stack direction="row" spacing={2} justifyContent="center" flexWrap="wrap">
                        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenSend(true)}>
                            Нова транзакция
                        </Button>

                        <Button
                            variant="outlined"
                            startIcon={<FileDownloadOutlinedIcon />}
                            onClick={exportMyTransactions}
                        >
                            Изтегли отчет в Excel
                        </Button>
                    </Stack>

                    {/* Filters */}
                    <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                        <FormControl size="small" sx={{ minWidth: 120 }}>
                            <InputLabel id="filter-currency-label">Валута</InputLabel>
                            <Select
                                labelId="filter-currency-label"
                                label="Валута"
                                value={filter.currencyId}
                                onChange={e => setFilter(f => ({ ...f, currencyId: e.target.value }))}
                            >
                                <MenuItem value="">Всички</MenuItem>
                                {currencies.map(c => (
                                    <MenuItem key={c.id} value={c.id}>{c.code}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <TextField
                            size="small"
                            label="Мин. сума"
                            type="number"
                            value={filter.minAmount}
                            onChange={e => setFilter(f => ({ ...f, minAmount: e.target.value }))}
                            sx={{ width: 100 }}
                        />
                        <TextField
                            size="small"
                            label="Макс. сума"
                            type="number"
                            value={filter.maxAmount}
                            onChange={e => setFilter(f => ({ ...f, maxAmount: e.target.value }))}
                            sx={{ width: 100 }}
                        />
                        <FormControl size="small" sx={{ minWidth: 120 }}>
                            <InputLabel id="filter-type-label">Тип</InputLabel>
                            <Select
                                labelId="filter-type-label"
                                label="Тип"
                                value={filter.type}
                                onChange={e => setFilter(f => ({ ...f, type: e.target.value }))}
                            >
                                <MenuItem value="">Всички</MenuItem>
                                <MenuItem value="sent">Изпратени</MenuItem>
                                <MenuItem value="received">Получени</MenuItem>
                            </Select>
                        </FormControl>
                        <Button
                            size="small"
                            onClick={() => setFilter({ currencyId: "", minAmount: "", maxAmount: "", type: "" })}
                        >
                            Изчисти филтрите
                        </Button>
                    </Stack>

                    {/* Table / Empty state */}
                    {filteredTx.length === 0 ? (
                        <Typography textAlign="center" color="text.secondary">
                            Няма транзакции с избраните филтри
                        </Typography>
                    ) : (
                        <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
                            <Table size="small" stickyHeader>
                                <TableHead>
                                    <TableRow>
                                        <HeadCell>Дата</HeadCell>
                                        <HeadCell>Описание</HeadCell>
                                        <HeadCell>Сума</HeadCell>
                                        <HeadCell>Получател</HeadCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {filteredTx.map((t) => (
                                        <BodyRow hover key={t.id}>
                                            <TableCell>
                                                {new Date(t.createdAt).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell>{t.description}</TableCell>
                                            <TableCell><AmountChip value={t.amount} /></TableCell>
                                            <TableCell>
                                                {t.receiverId}
                                            </TableCell>
                                        </BodyRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </Stack>
            </Paper>

            {/* Send dialog */}
            <SendDialog
                open={openSend}
                onClose={() => setOpenSend(false)}
                send={send}
                setSend={setSend}
                mutate={sendMut}
                currencies={currencies}
            />
        </Container>
    );
}

/* ──────────────────────────── SEND DIALOG ──────────────────────────── */

interface SendDialogProps {
    open: boolean;
    onClose: () => void;
    send: SendInput;
    setSend: React.Dispatch<React.SetStateAction<SendInput>>;
    mutate: UseMutationResult<any, any, SendInput>;
    currencies: Currency[];
}

function SendDialog({
    open, onClose, send, setSend, mutate, currencies
}: SendDialogProps) {

    const [localError, setLocalError] = useState<string | null>(null);

    const isValid = send.receiverId > 0 && send.currencyId > 0 && send.amount > 0;

    const handleSend = () => {
        if (send.receiverId <= 0) {
            setLocalError("Получателят трябва да бъде валиден номер");
            return;
        }
        if (send.currencyId <= 0) {
            setLocalError("Моля изберете валута");
            return;
        }
        if (send.amount < 0.01) {
            setLocalError("Сумата трябва да бъде над 0.01");
            return;
        }
        setLocalError(null);
        mutate.mutate(send);
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Нова транзакция</DialogTitle>

            <DialogContent dividers>
                <Stack spacing={2} mt={1}>
                    <TextField
                        label="Номер на получател"
                        type="number"
                        value={send.receiverId || ""}
                        onChange={(e) => setSend(s => ({ ...s, receiverId: +e.target.value }))}
                        fullWidth
                    />

                    <FormControl size="small" fullWidth>
                        <InputLabel id="currency-select-label">Валута</InputLabel>
                        <Select
                            labelId="currency-select-label"
                            label="Валута"
                            value={send.currencyId || ""}
                            onChange={(e) => setSend(s => ({ ...s, currencyId: +e.target.value }))}
                        >
                            {currencies.map(c => (
                                <MenuItem key={c.id} value={c.id}>{c.code}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <TextField
                        label="Сума"
                        type="number"
                        value={send.amount || ""}
                        onChange={(e) => setSend(s => ({ ...s, amount: +e.target.value }))}
                        fullWidth
                    />

                    {localError && (
                        <Typography color="error" mt={1}>{localError}</Typography>
                    )}
                </Stack>
            </DialogContent>

            <DialogActions>
                <Button onClick={onClose}>Отказ</Button>
                <Button onClick={handleSend} disabled={!isValid || mutate.isPending}>
                    Изпрати
                </Button>
            </DialogActions>
        </Dialog>
    );
}
