/* WalletsPage.tsx */
import React, { useState, useEffect } from "react";
import {
    Container, Paper, Stack, Typography, Button, TableContainer, Table,
    TableHead, TableRow, TableCell, TableBody, IconButton, Chip, Dialog,
    DialogTitle, DialogContent, DialogActions, TextField, MenuItem, FormControl,
    InputLabel, Select
} from "@mui/material";
import { styled } from "@mui/material/styles";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

import { useQuery, useMutation, useQueryClient, UseMutationResult } from "@tanstack/react-query";
import { Wallet, Currency } from "../models";
import { getWallets, createWallet, deleteWallet, CreateWalletInput } from "../api/wallets";
import { getCurrencies } from "../api/currencies";
import { updateWalletName as renameWallet } from "../api/wallets";

/* ────────── helpers for nicer table ────────── */

const HeadCell = styled(TableCell)(({ theme }) => ({
    fontWeight: 600,
    textAlign: "center",
    background: theme.palette.grey[200]
}));

const BodyRow = styled(TableRow)(({ theme }) => ({
    "&:nth-of-type(odd)": { backgroundColor: theme.palette.action.hover },
    "& td": { textAlign: "center" }
}));

function BalanceChip({ value, code }: { value: number; code: string }) {
    return (
        <Chip
            label={`${value.toFixed(2)} ${code}`}
            color="primary"
            size="small"
            sx={{ fontWeight: 600 }}
        />
    );
}

/* ────────── Page ────────── */

export default function WalletsPage() {
    const qc = useQueryClient();

    /* queries */
    const { data: wallets = [], isPending, error } = useQuery<Wallet[]>({
        queryKey: ["wallets"],
        queryFn: getWallets
    });

    const { data: currencies = [] } = useQuery<Currency[]>({
        queryKey: ["currencies"],
        queryFn: getCurrencies
    });

    /* dialog state */
    const [openCreate, setOpenCreate] = useState(false);
    const [openRename, setOpenRename] = useState<number | null>(null);

    /* mutations */
    const createMut = useMutation({
        mutationFn: (input: CreateWalletInput) => createWallet(input),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ["wallets"] }); setOpenCreate(false); }
    });

    const renameMut = useMutation({
        mutationFn: ({ id, name }: { id: number; name: string }) => renameWallet(id, name),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ["wallets"] }); setOpenRename(null); }
    });

    const deleteMut = useMutation({
        mutationFn: deleteWallet,
        onSuccess: () => qc.invalidateQueries({ queryKey: ["wallets"] }),
        onError: (err: Error) => {
            // Show error message if deletion fails
            alert(`Неуспех при изтриване на портфейла. \nПортфейлът има наличност или има издадени / неизтрити карти: \n\n${err.message}`);
        }
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
                        Портфейли
                    </Typography>

                    {/* toolbar */}
                    <Stack direction="row" spacing={2} justifyContent="center" flexWrap="wrap">
                        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenCreate(true)}>
                            {wallets.length ? "Нов портфейл" : "Създай портфейл"}
                        </Button>
                    </Stack>

                    {/* empty state or table */}
                    {wallets.length === 0 ? (
                        <Typography textAlign="center" color="text.secondary">
                            Засега нямате създадени портфейли.
                        </Typography>
                    ) : (
                        <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
                            <Table size="small" stickyHeader>
                                <TableHead>
                                    <TableRow>
                                        <HeadCell>Име</HeadCell>
                                        <HeadCell>Валута</HeadCell>
                                        <HeadCell>Баланс</HeadCell>
                                        <HeadCell sx={{ width: 120 }} />
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {wallets.map(w => (
                                        <BodyRow key={w.walletId}>
                                            <TableCell>{w.name}</TableCell>
                                            <TableCell>{w.currencyCode}</TableCell>
                                            <TableCell>
                                                <BalanceChip value={w.balance} code={w.currencyCode} />
                                            </TableCell>
                                            <TableCell>
                                                <IconButton size="small" color="primary" onClick={() => setOpenRename(w.walletId)}>
                                                    <EditIcon fontSize="small" />
                                                </IconButton>
                                                <IconButton size="small" color="error" onClick={() => deleteMut.mutate(w.walletId)}>
                                                    <DeleteIcon fontSize="small" />
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
            <CreateWalletDialog
                open={openCreate}
                onClose={() => setOpenCreate(false)}
                currencies={currencies}
                mutate={createMut}
            />

            <RenameWalletDialog
                openId={openRename}
                onClose={() => setOpenRename(null)}
                mutate={renameMut}
            />
        </Container>
    );
}

/* ────────── Create wallet dialog ────────── */

interface CreateWalletDialogProps {
    open: boolean;
    onClose: () => void;
    currencies: Currency[];
    mutate: UseMutationResult<any, any, CreateWalletInput>;
}

function CreateWalletDialog({ open, onClose, currencies, mutate }: CreateWalletDialogProps) {
    const [name, setName] = useState("");
    const [currency, setCurrency] = useState<number | "">("");

    const handleCreate = () => {
        if (!name.trim() || !currency) return;
        mutate.mutate({ name: name.trim(), currencyId: currency as number });
    };

    useEffect(() => { if (!open) { setName(""); setCurrency(""); } }, [open]);

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Нов портфейл</DialogTitle>
            <DialogContent dividers>
                <Stack spacing={2} mt={1}>
                    <TextField
                        label="Име"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        fullWidth
                        size="small"
                    />
                    <FormControl size="small" fullWidth>
                        <InputLabel id="currency-select-label">Валута</InputLabel>
                        <Select
                            labelId="currency-select-label"
                            label="Валута"
                            value={currency}
                            onChange={(e) => setCurrency(e.target.value as number)}
                        >
                            {currencies.map(c => (
                                <MenuItem key={c.id} value={c.id}>{c.code}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Отказ</Button>
                <Button onClick={handleCreate} disabled={mutate.isPending}>
                    Създай
                </Button>
            </DialogActions>
        </Dialog>
    );
}

/* ────────── Rename wallet dialog ────────── */

interface RenameWalletDialogProps {
    openId: number | null;
    onClose: () => void;
    mutate: UseMutationResult<any, any, { id: number; name: string }>;
}

function RenameWalletDialog({ openId, onClose, mutate }: RenameWalletDialogProps) {
    const [name, setName] = useState("");

    useEffect(() => { if (!openId) setName(""); }, [openId]);

    const handleRename = () => {
        if (!name.trim()) return;
        mutate.mutate({ id: openId!, name: name.trim() });
    };

    return (
        <Dialog open={openId !== null} onClose={onClose}>
            <DialogTitle>Преименувай портфейл</DialogTitle>
            <DialogContent>
                <TextField
                    autoFocus
                    label="Ново име"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    fullWidth
                    variant="standard"
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Отказ</Button>
                <Button onClick={handleRename} disabled={mutate.isPending || !name.trim()}>
                    Запази
                </Button>
            </DialogActions>
        </Dialog>
    );
}