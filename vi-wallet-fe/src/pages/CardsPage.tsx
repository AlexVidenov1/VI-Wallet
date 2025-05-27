import React, { useState } from "react";
import {
    Box, Typography, TableContainer, Paper, Table, TableHead, TableRow,
    TableCell, TableBody, Button, IconButton, Dialog, DialogTitle,
    DialogContent, DialogActions, TextField, FormControl, InputLabel,
    Select, MenuItem, Stack, Chip, Container
} from "@mui/material";
import { styled } from "@mui/material/styles";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import LockIcon from "@mui/icons-material/Lock";
import MoneyIcon from "@mui/icons-material/AttachMoney";
import AddIcon from "@mui/icons-material/Add";

import { useQuery, useMutation, useQueryClient, UseMutationResult } from "@tanstack/react-query";
import { CleanCard as Card, Wallet } from "../models";
import { getWallets } from "../api/wallets";
import {
    getCards, createCard, blockCard, unblockCard, withdraw, CreateCardInput
} from "../api/cards";

/* ─────────────────────────── styled helpers ──────────────────────────── */

const HeadCell = styled(TableCell)(({ theme }) => ({
    fontWeight: 600,
    textAlign: "center",
    background: theme.palette.grey[200]
}));

const BodyRow = styled(TableRow)(({ theme }) => ({
    "&:nth-of-type(odd)": { backgroundColor: theme.palette.action.hover },
    "& td": { textAlign: "center" }
}));

function StatusChip({ blocked }: { blocked: boolean }) {
    return (
        <Chip
            label={blocked ? "Блокирана" : "Активна"}
            color={blocked ? "error" : "success"}
            size="small"
            sx={{ minWidth: 80, fontWeight: 600 }}
        />
    );
}

/* ─────────────────────────────── page ───────────────────────────────── */

export default function CardsPage() {
    const qc = useQueryClient();

    /* queries */
    const { data: wallets = [] } = useQuery<Wallet[]>({
        queryKey: ["wallets"],
        queryFn: getWallets
    });

    const { data: cards = [], isPending, error } = useQuery<Card[]>({
        queryKey: ["cards"],
        queryFn: getCards
    });

    /* state for dialogs */
    const [openCreate, setOpenCreate] = useState(false);
    const [withdrawId, setWithdrawId] = useState<number | null>(null);

    /* mutations */
    const createMut = useMutation({
        mutationFn: (input: CreateCardInput) => createCard(input),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ["cards"] }); setOpenCreate(false); }
    });

    const blockMut = useMutation({ mutationFn: blockCard, onSuccess: () => qc.invalidateQueries({ queryKey: ["cards"] }) });
    const unblockMut = useMutation({ mutationFn: unblockCard, onSuccess: () => qc.invalidateQueries({ queryKey: ["cards"] }) });
    const withdrawMut = useMutation({
        mutationFn: ({ id, amount }: { id: number; amount: number }) => withdraw(id, amount),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ["cards"] }); setWithdrawId(null); }
    });

    /* loading / error */
    if (isPending) return <Typography textAlign="center" mt={8}>Зареждане…</Typography>;
    if (error) return <Typography textAlign="center" mt={8} color="error">{(error as Error).message}</Typography>;

    /* ui */
    return (
        <Container maxWidth="md" sx={{ py: 4 }}>
            <Paper elevation={3} sx={{ p: 4 }}>
                <Stack spacing={3}>
                    <Typography variant="h4" textAlign="center" fontWeight={600}>
                        Карти
                    </Typography>

                    {/* toolbar */}
                    <Stack direction="row" spacing={2} justifyContent="center" flexWrap="wrap">
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={() => setOpenCreate(true)}
                        >
                            {cards.length ? "Нова карта" : "Създай карта"}
                        </Button>
                    </Stack>

                    {/* table / empty state */}
                    {cards.length === 0 ? (
                        <Typography textAlign="center" color="text.secondary">
                            Засега нямате създадени карти.
                        </Typography>
                    ) : (
                        <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
                            <Table size="small" stickyHeader>
                                <TableHead>
                                    <TableRow>
                                        <HeadCell>Номер на карта</HeadCell>
                                        <HeadCell>Дата на изтичане</HeadCell>
                                        <HeadCell>Портфейл</HeadCell>
                                        <HeadCell>Баланс</HeadCell>
                                        <HeadCell>Статус</HeadCell>
                                        <HeadCell sx={{ width: 120 }} />
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {cards.map(c => (
                                        <BodyRow hover key={c.cardId}>
                                            <TableCell>{c.cardNumber}</TableCell>
                                            <TableCell>{new Date(c.expirationDate).toLocaleDateString()}</TableCell>
                                            <TableCell>{c.wallet.name}</TableCell>
                                            <TableCell>
                                                {c.wallet.balance.toFixed(2)} {c.wallet.currencyCode}
                                            </TableCell>
                                            <TableCell><StatusChip blocked={c.isBlocked} /></TableCell>
                                            <TableCell>
                                                {c.isBlocked ? (
                                                    <IconButton size="small" color="success" onClick={() => unblockMut.mutate(c.cardId)}>
                                                        <LockOpenIcon fontSize="small" />
                                                    </IconButton>
                                                ) : (
                                                    <IconButton size="small" color="warning" onClick={() => blockMut.mutate(c.cardId)}>
                                                        <LockIcon fontSize="small" />
                                                    </IconButton>
                                                )}

                                                <IconButton
                                                    size="small"
                                                    color="primary"
                                                    onClick={() => setWithdrawId(c.cardId)}
                                                    disabled={c.isBlocked}
                                                >
                                                    <MoneyIcon fontSize="small" />
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

            {/* dialogs */}
            <CreateCardDialog
                open={openCreate}
                onClose={() => setOpenCreate(false)}
                wallets={wallets}
                mutate={createMut}
            />

            <WithdrawDialog
                open={withdrawId !== null}
                onClose={() => setWithdrawId(null)}
                cardId={withdrawId}
                mutate={withdrawMut}
            />
        </Container>
    );
}

/* ───────────────────────── create-card dialog ────────────────────────── */

interface CreateCardDialogProps {
    open: boolean;
    onClose: () => void;
    wallets: Wallet[];
    mutate: UseMutationResult<any, any, CreateCardInput>;
}

function CreateCardDialog({ open, onClose, wallets, mutate }: CreateCardDialogProps) {
    const [walletId, setWalletId] = useState<number | "">("");
    const [cardNum, setCardNum] = useState("");
    const [expDate, setExpDate] = useState("");

    const handleCreate = () => {
        if (!walletId || !cardNum.trim() || !expDate) return;
        mutate.mutate({ walletId: walletId as number, cardNumber: cardNum.trim(), expirationDate: expDate });
    };

    // reset when closed / success
    React.useEffect(() => {
        if (!open) { setWalletId(""); setCardNum(""); setExpDate(""); }
    }, [open]);

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Създай нова карта</DialogTitle>
            <DialogContent dividers>
                <Stack spacing={2} mt={1}>
                    <FormControl size="small" fullWidth>
                        <InputLabel id="wallet-select">Портфейл</InputLabel>
                        <Select
                            labelId="wallet-select"
                            label="Портфейл"
                            value={walletId}
                            onChange={(e) => setWalletId(e.target.value as number)}
                        >
                            {wallets.map(w => (
                                <MenuItem key={w.walletId} value={w.walletId}>
                                    {w.name} ({w.currencyCode})
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <TextField
                        size="small"
                        label="Номер на карта"
                        value={cardNum}
                        onChange={(e) => setCardNum(e.target.value)}
                        fullWidth
                    />

                    <TextField
                        type="date"
                        size="small"
                        label="Дата на изтичане"
                        InputLabelProps={{ shrink: true }}
                        value={expDate}
                        onChange={(e) => setExpDate(e.target.value)}
                        fullWidth
                    />
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Отказ</Button>
                <Button onClick={handleCreate} disabled={mutate.isPending}>
                    Създай карта
                </Button>
            </DialogActions>
        </Dialog>
    );
}

/* ─────────────────────────── withdraw dialog ─────────────────────────── */

interface WithdrawDialogProps {
    open: boolean;
    onClose: () => void;
    cardId: number | null;
    mutate: UseMutationResult<any, any, { id: number; amount: number }>;
}

function WithdrawDialog({ open, onClose, cardId, mutate }: WithdrawDialogProps) {
    const [amount, setAmount] = useState("");

    React.useEffect(() => { if (!open) setAmount(""); }, [open]);

    const handleWithdraw = () => {
        if (!amount) return;
        mutate.mutate({ id: cardId!, amount: parseFloat(amount) });
    };

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>Теглене</DialogTitle>
            <DialogContent>
                <TextField
                    autoFocus
                    label="Сума"
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    fullWidth
                    variant="standard"
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Отказ</Button>
                <Button onClick={handleWithdraw} disabled={mutate.isPending || !amount}>
                    Теглене
                </Button>
            </DialogActions>
        </Dialog>
    );
}