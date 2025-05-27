import { Typography, Container } from "@mui/material";

export default function Dashboard() {
  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h4">Добре дошли във "VI-Wallet"</Typography>
      <Typography variant="body1" sx={{ mt: 2 }}>

        Това е вашата лична финансова платформа, където можете да управлявате своите портфейли, транзакции и карти.
        <br />
        <br />
        <br />
        <br />
        <br />
        <br />
        <br />
        <strong>Автор:</strong> Александър Виденов
        <br />
        <strong>Факултетен номер:</strong> 20118073
        <br />
        <br />
        <strong>Това е учебен проект и не трябва да се използва за реални финансови транзакции.</strong>
        <br />
        <br />
      </Typography>
    </Container>
  );
}