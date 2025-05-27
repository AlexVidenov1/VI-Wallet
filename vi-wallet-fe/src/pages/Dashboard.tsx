import { Typography, Container, Box, Paper, Grid } from "@mui/material";

export default function Dashboard() {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "background.default",
        p: 2,
      }}
    >
      <Container maxWidth="md">
        <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              mb: 4,
            }}
          >
            <Typography variant="h3" color="primary" gutterBottom>
              Добре дошли във "VI-Wallet"
            </Typography>
            <Typography variant="subtitle1" color="textSecondary">
              Дипломен проект от тип "Бизнес приложение"
            </Typography>
          </Box>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  textAlign: "center",
                }}
              >
                <Typography variant="h5" color="secondary">
                  Изготвил:
                </Typography>
                <Typography variant="h6">
                  <strong>Александър Виденов</strong>
                </Typography>
                <Typography variant="body1">
                  Факултетен номер: <strong>20118073</strong>
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  textAlign: "center",
                }}
              >
                <Typography variant="h5" color="secondary">
                  Университет:
                </Typography>
                <Typography variant="body1">
                  Университет за национално и световно стопанство
                </Typography>
                <Typography variant="body1">
                  Факултет по "Приложна информатика и статистика"
                </Typography>
                <Typography variant="body1">
                  Специалност: "Бизнес информатика и комуникации"
                </Typography>
              </Box>
            </Grid>
          </Grid>

          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              mt: 4,
            }}
          >
            <Typography variant="body1" color="textSecondary">
              Дата на изготвяне: <strong>Април 2025г.</strong>
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}