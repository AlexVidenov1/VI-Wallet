import React, { useState } from "react";
import {
  Box, Typography, Paper, TableContainer, Table, TableHead,
  TableRow, TableCell, TableBody, Button, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Stack, IconButton,
  FormControl, InputLabel, Select, MenuItem
} from "@mui/material";
import UndoIcon    from "@mui/icons-material/Undo";
import AddIcon     from "@mui/icons-material/Add";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { Transaction, Currency }     from "../models";
import { getCurrencies }             from "../api/currencies";
import {
  getMyTransactions,
  sendTransaction,
  revertTransaction,
  SendInput,
} from "../api/transactions";
import { exportMyTransactions } from "../api/transactions";
import { useSnackbar } from "notistack";



export default function TransactionsPage() {
  const qc = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  
  /* --------- queries --------- */
  const { data: tx = [], isPending, error } = useQuery<Transaction[]>({
    queryKey: ["transactions"],
    queryFn: getMyTransactions,
  });

  const { data: currencies = [] } = useQuery<Currency[]>({
    queryKey: ["currencies"],
    queryFn: getCurrencies,
  });

  /* --------- dialog state --------- */
  const [openSend, setOpenSend] = useState(false);
  const [send, setSend] = useState<SendInput>({
    receiverId: 0,
    currencyId: 0,
    amount: 0,
  });

  /* --------- mutations --------- */
  const sendMut = useMutation({
  mutationFn: (input: SendInput) => sendTransaction(input),
  onSuccess: () => {
    qc.invalidateQueries({ queryKey: ["transactions"] });
    setOpenSend(false);
    setSend({ receiverId: 0, currencyId: 0, amount: 0 });
    enqueueSnackbar("Transaction sent!", { variant: "success" });
  },
  onError: (error: Any) => {
    enqueueSnackbar(error?.message || "Failed to send transaction", { variant: "error" });
  },
});


  const revertMut = useMutation({
    mutationFn: (id: number) => revertTransaction(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["transactions"] }),
    onError: (err: Error) => {
      enqueueSnackbar(err.message, { variant: "error" });
    },
  });

  /* --------- loading / error --------- */
  if (isPending)
    return <Typography sx={{ mt: 4, textAlign: "center" }}>Loading…</Typography>;

  if (error)
    return (
      <Typography sx={{ mt: 4, textAlign: "center" }} color="error">
        {(error as Error).message}
      </Typography>
    );

  /* --------- empty list --------- */
  if (tx.length === 0)
    return (
      <Box sx={{ mt: 8, textAlign: "center" }}>
        <Typography variant="h5" gutterBottom>
          You don&apos;t have any transactions yet
        </Typography>
        <Typography color="text.secondary" gutterBottom>
          When you start sending money they will appear here.
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenSend(true)}
        >
          New transaction
        </Button>

        <SendDialog
          open={openSend}
          onClose={() => setOpenSend(false)}
          send={send}
          setSend={setSend}
          mutate={sendMut}
          currencies={currencies}
        />
      </Box>
    );

  /* --------- table --------- */
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Your Transactions
      </Typography>

      <Box sx={{ mb: 2 }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenSend(true)}
        >
          New transaction
        </Button>
      </Box>

      <Button variant="outlined" onClick={exportMyTransactions}>
                    Download transactions
                </Button>
                <Typography sx={{ mt: 1 }} color="text.secondary">
                    Click the button above to download your transactions in Excel format.
                    </Typography>
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: "grey.200" }}>
              <TableCell>Date</TableCell>
              <TableCell>Description</TableCell>
              <TableCell align="right">Amount</TableCell>
              <TableCell align="right" sx={{ width: 48 }} />
            </TableRow>
          </TableHead>
          <TableBody>
            {tx.map((t) => (
              <TableRow key={t.id} hover>
                <TableCell>
                  {new Date(t.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell>{t.description}</TableCell>
                <TableCell
                  align="right"
                  sx={{ color: t.amount < 0 ? "error.main" : "success.main" }}
                >
                  {t.amount.toFixed(2)}
                </TableCell>
                <TableCell align="right">
                  <IconButton
                    size="small"
                    color="warning"
                    onClick={() => revertMut.mutate(t.id)}
                  >
                    <UndoIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      
      <SendDialog
        open={openSend}
        onClose={() => setOpenSend(false)}
        send={send}
        setSend={setSend}
        mutate={sendMut}
        currencies={currencies}
      />
    </Box>
  );
}

/* ---------- dialog component ---------- */
interface SendDialogProps {
  open: boolean;
  onClose: () => void;
  send: SendInput;
  setSend: React.Dispatch<React.SetStateAction<SendInput>>;
  mutate: ReturnType<typeof useMutation>;
  currencies: Currency[];
}

function SendDialog({
  open,
  onClose,
  send,
  setSend,
  mutate,
  currencies,
}: SendDialogProps) {
  const [localError, setLocalError] = useState<string | null>(null);

  const isValid =
    send.receiverId > 0 && send.currencyId > 0 && send.amount > 0;

  const handleSend = () => {
    if (send.receiverId <= 0) {
      setLocalError("Receiver ID must be a positive number.");
      return;
    }
    if (send.currencyId <= 0) {
      setLocalError("Please select a currency.");
      return;
    }
    if (send.amount < 0.01) {
      setLocalError("Amount must be at least 0.01.");
      return;
    }
    setLocalError(null);
    mutate.mutate(send);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Send Transaction</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label="Receiver user id"
            type="number"
            value={send.receiverId || ""}
            onChange={(e) =>
              setSend((s) => ({ ...s, receiverId: +e.target.value }))
            }
            fullWidth
          />
          <FormControl size="small" fullWidth>
            <InputLabel id="currency-select-label">Currency</InputLabel>
            <Select
              labelId="currency-select-label"
              label="Currency"
              value={send.currencyId || ""}
              onChange={(e) =>
                setSend((s) => ({ ...s, currencyId: +e.target.value }))
              }
            >
              {currencies.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.code}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="Amount"
            type="number"
            value={send.amount || ""}
            onChange={(e) =>
              setSend((s) => ({ ...s, amount: +e.target.value }))
            }
            fullWidth
          />
          {localError && (
            <Typography color="error" sx={{ mt: 1 }}>
              {localError}
            </Typography>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleSend}
          disabled={!isValid || mutate.isPending}
        >
          Send
        </Button>
      </DialogActions>
    </Dialog>
  );
}