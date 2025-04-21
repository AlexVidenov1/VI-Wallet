using Microsoft.EntityFrameworkCore;
using ViWallet.Data;

var builder = WebApplication.CreateBuilder(args);

// Add DbContext using MS SQL Server connection string
builder.Services.AddDbContext<AppDbContext>(options =>
options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();
// (Middleware registrations here)
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseRouting();
app.UseAuthorization();

app.MapControllers();

app.Run();