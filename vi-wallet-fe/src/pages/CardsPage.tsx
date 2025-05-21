import React, { useState } from "react";
import {
    Box, Typography, TableContainer, Paper, Table, TableHead, TableRow,
    TableCell, TableBody, Button, IconButton, Dialog, DialogTitle,
    DialogContent, DialogActions, TextField, FormControl, InputLabel,
    Select, MenuItem, Stack
} from "@mui/material";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import LockIcon from "@mui/icons-material/Lock";
import MoneyIcon from "@mui/icons-material/AttachMoney";
import AddIcon from "@mui/icons-material/Add";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CleanCard as Card, Wallet } from "../models";
import { getWallets } from "../api/wallets";
import {
    getCards, createCard, blockCard, unblockCard, withdraw, CreateCardInput
} from "../api/cards";

export default function CardsPage() {
    const qc = useQueryClient();

    /* ─────── List queries ─────── */
    const { data: wallets = [] } = useQuery<Wallet[]>({
        queryKey: ["wallets"],
        queryFn: getWallets,
    });

    const { data: cards = [], isPending, error } = useQuery<Card[]>({
        queryKey: ["cards"],
        queryFn: getCards,
    });

    /* ─────── Create card dialog state ─────── */
    const [openCreate, setOpenCreate] = useState(false);
    const [walletId, setWalletId] = useState<number | "">("");
    const [cardNumber, setCardNumber] = useState("");
    const [expDate, setExpDate] = useState("");

    /* ─────── Withdraw dialog state ─────── */
    const [withdrawId, setWithdrawId] = useState<number | null>(null);
    const [withdrawAmt, setWithdrawAmt] = useState("");

    /* ─────── mutations ─────── */
    const createMut = useMutation({
        mutationFn: (input: CreateCardInput) => createCard(input),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["cards"] });
            // reset and close
            setWalletId("");
            setCardNumber("");
            setExpDate("");
            setOpenCreate(false);
        },
    });

    const blockMut = useMutation({
        mutationFn: (id: number) => blockCard(id),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["cards"] }),
    });
    const unblockMut = useMutation({
        mutationFn: (id: number) => unblockCard(id),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["cards"] }),
    });
    const withdrawMut = useMutation({
        mutationFn: ({ id, amount }: { id: number; amount: number }) =>
            withdraw(id, amount),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["cards"] });
            setWithdrawId(null);
            setWithdrawAmt("");
        },
    });

    /* ─────── Loading / error ─────── */
    if (isPending)
        return <Typography sx={{ mt: 4, textAlign: "center" }}>Loading…</Typography>;

    if (error)
        return (
            <Typography sx={{ mt: 4, textAlign: "center" }} color="error">
                {(error as Error).message}
            </Typography>
        );

    /* ─────── Render ─────── */
    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
                Cards
            </Typography>

            {/* === BUTTON WHEN LIST IS NOT EMPTY === */}
            {cards.length > 0 && (
                <Box sx={{ mb: 2 }}>
                    <Button
                        startIcon={<AddIcon />}
                        variant="contained"
                        onClick={() => setOpenCreate(true)}
                    >
                        New card
                    </Button>
                </Box>
            )}

            {/* === EMPTY STATE === */}
            {cards.length === 0 && (
                <Box sx={{ textAlign: "center", mt: 4 }}>
                    <Typography gutterBottom>
                        You don&apos;t have any cards yet.
                    </Typography>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => setOpenCreate(true)}
                    >
                        Create card
                    </Button>
                </Box>
            )}

            {/* === TABLE === */}
            {cards.length > 0 && (
                <TableContainer component={Paper}>
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={{ bgcolor: "grey.200" }}>
                                <TableCell>Card #</TableCell>
                                <TableCell>Expiry</TableCell>
                                <TableCell>Wallet</TableCell>
                                <TableCell align="right">Balance</TableCell>
                                <TableCell align="center">Status</TableCell>
                                <TableCell align="right" sx={{ width: 140 }} />
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {cards.map((c) => (
                                <TableRow key={c.cardId} hover>
                                    <TableCell>{c.cardNumber}</TableCell>
                                    <TableCell>
                                        {new Date(c.expirationDate).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell>{c.wallet.name}</TableCell>
                                    <TableCell align="right">
                                        {c.wallet.balance.toFixed(2)} {c.wallet.currencyCode}
                                    </TableCell>
                                    <TableCell align="center">
                                        {c.isBlocked ? "Blocked" : "Active"}
                                    </TableCell>
                                    <TableCell align="right">
                                        {c.isBlocked ? (
                                            <IconButton
                                                size="small"
                                                color="success"
                                                onClick={() => unblockMut.mutate(c.cardId)}
                                            >
                                                <LockOpenIcon fontSize="small" />
                                            </IconButton>
                                        ) : (
                                            <IconButton
                                                size="small"
                                                color="warning"
                                                onClick={() => blockMut.mutate(c.cardId)}
                                            >
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
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {/* === CREATE CARD DIALOG === */}
            <Dialog open={openCreate} onClose={() => setOpenCreate(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Create new card</DialogTitle>
                <DialogContent dividers>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <FormControl size="small" fullWidth>
                            <InputLabel id="wallet-select">Wallet</InputLabel>
                            <Select
                                labelId="wallet-select"
                                label="Wallet"
                                value={walletId}
                                onChange={(e) => setWalletId(e.target.value as number)}
                            >
                                {wallets.map((w) => (
                                    <MenuItem key={w.walletId} value={w.walletId}>
                                        {w.name} ({w.currencyCode})
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <TextField
                            size="small"
                            label="Card number"
                            value={cardNumber}
                            onChange={(e) => setCardNumber(e.target.value)}
                            fullWidth
                        />

                        <TextField
                            type="date"
                            size="small"
                            label="Expiry"
                            InputLabelProps={{ shrink: true }}
                            value={expDate}
                            onChange={(e) => setExpDate(e.target.value)}
                            fullWidth
                        />
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenCreate(false)}>Cancel</Button>
                    <Button
                        onClick={() => {
                            if (
                                typeof walletId === "number" &&
                                cardNumber.trim() &&
                                expDate
                            ) {
                                createMut.mutate({
                                    walletId,
                                    cardNumber: cardNumber.trim(),
                                    expirationDate: expDate,
                                });
                            }
                        }}
                        disabled={createMut.isPending}
                    >
                        Create
                    </Button>
                </DialogActions>
            </Dialog>

            {/* === WITHDRAW DIALOG === */}
            <Dialog open={withdrawId !== null} onClose={() => setWithdrawId(null)}>
                <DialogTitle>Withdraw</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        label="Amount"
                        type="number"
                        value={withdrawAmt}
                        onChange={(e) => setWithdrawAmt(e.target.value)}
                        fullWidth
                        variant="standard"
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setWithdrawId(null)}>Cancel</Button>
                    <Button
                        onClick={() =>
                            withdrawMut.mutate({
                                id: withdrawId!,
                                amount: parseFloat(withdrawAmt),
                            })
                        }
                        disabled={withdrawMut.isPending || !withdrawAmt}
                    >
                        Withdraw
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}