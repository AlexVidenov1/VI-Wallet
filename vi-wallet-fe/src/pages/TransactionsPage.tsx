import React, { useState } from "react";
import {
    Box, Typography, Paper, TableContainer, Table, TableHead,
    TableRow, TableCell, TableBody, Button, Dialog, DialogTitle,
    DialogContent, DialogActions, TextField, Stack, IconButton,
    FormControl, InputLabel, Select, MenuItem, Chip, CircularProgress,
    Container
} from "@mui/material";
import { styled } from "@mui/material/styles";
import UndoIcon from "@mui/icons-material/Undo";
import AddIcon from "@mui/icons-material/Add";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";

import { useQuery, useMutation, useQueryClient, UseMutationResult } from "@tanstack/react-query";
import { Transaction, Currency } from "../models";
import { getCurrencies } from "../api/currencies";
import {
    getMyTransactions, sendTransaction, revertTransaction,
    SendInput, exportMyTransactions
} from "../api/transactions";
import { useSnackbar } from "notistack";

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

    /* queries */
    const { data: tx = [], isPending, error } = useQuery<Transaction[]>({
        queryKey: ["transactions"],
        queryFn: getMyTransactions
    });

    const { data: currencies = [] } = useQuery<Currency[]>({
        queryKey: ["currencies"],
        queryFn: getCurrencies
    });

    /* dialog state */
    const [openSend, setOpenSend] = useState(false);
    const [send, setSend] = useState<SendInput>({ receiverId: 0, currencyId: 0, amount: 0 });

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

    const revertMut = useMutation({
        mutationFn: (id: number) => revertTransaction(id),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["transactions"] }),
        onError: (err: Error) => enqueueSnackbar(err.message, { variant: "error" })
    });

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

                    {/* Table / Empty state */}
                    {tx.length === 0 ? (
                        <Typography textAlign="center" color="text.secondary">
                            Няма извършени транзакции
                        </Typography>
                    ) : (
                        <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
                            <Table size="small" stickyHeader>
                                <TableHead>
                                    <TableRow>
                                        <HeadCell>Дата</HeadCell>
                                        <HeadCell>Описание</HeadCell>
                                        <HeadCell>Сума</HeadCell>
                                        <HeadCell sx={{ width: 56 }} />
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {tx.map((t) => (
                                        <BodyRow hover key={t.id}>
                                            <TableCell>
                                                {new Date(t.createdAt).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell>{t.description}</TableCell>
                                            <TableCell><AmountChip value={t.amount} /></TableCell>
                                            <TableCell>
                                                <IconButton
                                                    size="small"
                                                    color="warning"
                                                    onClick={() => revertMut.mutate(t.id)}
                                                >
                                                    <UndoIcon fontSize="small" />
                                                </IconButton>
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
    mutate: UseMutationResult<any, any, SendInput>;   // relaxed typing
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