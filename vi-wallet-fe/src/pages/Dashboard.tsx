import { Typography, Container } from "@mui/material";

export default function Dashboard() {
  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h4">Welcome to VI-Wallet</Typography>
      <Typography variant="body1" sx={{ mt: 2 }}>
        After you implement Wallet & Card pages, KPIs will appear here.
      </Typography>
    </Container>
  );
}