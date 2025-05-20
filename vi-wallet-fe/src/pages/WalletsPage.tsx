import React, { useState } from "react";
import {
    Box,
    Paper,
    TableContainer,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    Typography,
    TextField,
    Button,
    IconButton,
    Stack,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import {
    useQuery,
    useMutation,
    useQueryClient,
} from "@tanstack/react-query";

import { Wallet } from "../models/";
import { Currency } from "../models/";
import { getCurrencies } from "../api/currencies";
import {
    getWallets,
    createWallet,
    deleteWallet,
    CreateWalletInput,
} from "../api/wallets";

export default function WalletsPage() {
    const qc = useQueryClient();

    /* -------------- local form state -------------- */
    const [newName, setNewName] = useState("");
    const [currencyId, setCurrencyId] = useState<number | "">("");

    /* -------------- queries -------------- */
    const {
        data: wallets = [],
        isPending: walletsPending,
        error: walletsError,
    } = useQuery<Wallet[]>({
        queryKey: ["wallets"],
        queryFn: getWallets,
    });

    const {
        data: currencies = [],
        isPending: curPending,
        error: curError,
    } = useQuery<Currency[]>({
        queryKey: ["currencies"],
        queryFn: getCurrencies,
    });

    /* -------------- mutations -------------- */
    const addMutation = useMutation({
        mutationFn: (input: CreateWalletInput) => createWallet(input),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["wallets"] });
            setNewName("");
            setCurrencyId("");
        },
    });

    const delMutation = useMutation({
        mutationFn: (id: number) => deleteWallet(id),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["wallets"] }),
    });

    /* -------------- loading / error state -------------- */
    if (walletsPending || curPending)
        return <Typography sx={{ mt: 4, textAlign: "center" }}>Loading…</Typography>;

    if (walletsError || curError)
        return (
            <Typography sx={{ mt: 4, textAlign: "center" }} color="error">
                {(walletsError || curError as Error).toString()}
            </Typography>
        );

    /* -------------- render -------------- */
    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
                Wallets
            </Typography>

            {/* ---------- create wallet form ---------- */}
            <Box
                component="form"
                onSubmit={(e) => {
                    e.preventDefault();
                    if (!newName.trim() || typeof currencyId !== "number") return;
                    addMutation.mutate({ name: newName.trim(), currencyId });
                }}
                sx={{ mb: 3 }}
            >
                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                    <TextField
                        size="small"
                        label="Wallet name"
                        sx={{ flexGrow: 1 }}
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                    />

                    <FormControl size="small" sx={{ minWidth: 140 }}>
                        <InputLabel id="currency-select-label">Currency</InputLabel>
                        <Select
                            labelId="currency-select-label"
                            label="Currency"
                            value={currencyId}
                            onChange={(e) => setCurrencyId(e.target.value as number)}
                        >
                            {currencies.map((c) => (
                                <MenuItem key={c.id} value={c.id}>
                                    {c.code}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <Button
                        variant="contained"
                        type="submit"
                        disabled={addMutation.isPending}
                    >
                        Create
                    </Button>
                </Stack>
            </Box>

            {/* ---------- empty-state ---------- */}
            {wallets.length === 0 && (
                <Typography>You don&apos;t have any wallets yet.</Typography>
            )}

            {/* ---------- table ---------- */}
            {wallets.length > 0 && (
                <TableContainer component={Paper}>
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={{ bgcolor: "grey.200" }}>
                                <TableCell>Name</TableCell>
                                <TableCell>Currency</TableCell>
                                <TableCell align="right">Balance</TableCell>
                                <TableCell align="right" sx={{ width: 80 }} />
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {wallets.map((w) => (
                                <TableRow key={w.walletId} hover>
                                    <TableCell>{w.name}</TableCell>
                                    <TableCell>{w.currencyCode}</TableCell>
                                    <TableCell align="right">
                                        {w.balance.toFixed(2)}
                                    </TableCell>
                                    <TableCell align="right">
                                        <IconButton
                                            size="small"
                                            color="error"
                                            onClick={() => delMutation.mutate(w.walletId)}
                                            disabled={delMutation.isPending}
                                        >
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
        </Box>
    );
}