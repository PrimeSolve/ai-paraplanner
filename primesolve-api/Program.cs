using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using PrimeSolve.Api.Data;
using PrimeSolve.Api.Services;

var builder = WebApplication.CreateBuilder(args);

// ── Services ────────────────────────────────────────────────
builder.Services.AddControllers();
builder.Services.AddHttpClient();

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddSingleton<BlobStorageService>();
builder.Services.AddSingleton<StripeCheckoutService>();
builder.Services.AddScoped<DocumentExtractionService>();

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.Authority = builder.Configuration["Auth:Authority"];
        options.Audience = builder.Configuration["Auth:Audience"];
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
        };
    });

builder.Services.AddAuthorization();

var app = builder.Build();

// ── Auto-create AdviceRequests table if missing ─────────────
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    try
    {
        db.Database.ExecuteSqlRaw(@"
            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'AdviceRequests')
            BEGIN
                CREATE TABLE AdviceRequests (
                    Id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
                    TenantId UNIQUEIDENTIFIER NOT NULL,
                    ClientId UNIQUEIDENTIFIER NULL,
                    Data NVARCHAR(MAX) NULL,
                    CreatedDate DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
                    UpdatedDate DATETIME2 NOT NULL DEFAULT GETUTCDATE()
                );
                CREATE INDEX IX_AdviceRequests_TenantId_ClientId
                    ON AdviceRequests (TenantId, ClientId);
            END");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Warning: Could not auto-create AdviceRequests table: {ex.Message}");
    }
}

// ── Middleware ───────────────────────────────────────────────
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
