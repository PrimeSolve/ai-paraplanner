-- Migration: Add Companies and CompanyShareholders tables
-- Date: 2026-03-13
-- Description: Creates the Companies table and CompanyShareholders sub-resource table.
-- NOTE: Do NOT run this migration without approval.

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Companies')
BEGIN
    CREATE TABLE [dbo].[Companies] (
        [Id]               UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
        [TenantId]         UNIQUEIDENTIFIER NOT NULL,
        [ClientId]         UNIQUEIDENTIFIER NOT NULL,
        [CompanyName]      NVARCHAR(255)    NOT NULL DEFAULT '',
        [TaxRate]          DECIMAL(18,4)    NULL,
        [FrankingBalance]  DECIMAL(18,2)    NULL,
        [CreatedAt]        DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),

        CONSTRAINT [PK_Companies] PRIMARY KEY CLUSTERED ([Id])
    );

    CREATE NONCLUSTERED INDEX [IX_Companies_TenantId_ClientId]
        ON [dbo].[Companies] ([TenantId], [ClientId]);
END
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'CompanyShareholders')
BEGIN
    CREATE TABLE [dbo].[CompanyShareholders] (
        [Id]                   UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
        [CompanyId]            UNIQUEIDENTIFIER NOT NULL,
        [TenantId]             UNIQUEIDENTIFIER NOT NULL,
        [ShareholderClientId]  UNIQUEIDENTIFIER NULL,
        [ShareholderEntityId]  UNIQUEIDENTIFIER NULL,
        [SharePercentage]      DECIMAL(18,4)    NULL,
        [CreatedAt]            DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),

        CONSTRAINT [PK_CompanyShareholders] PRIMARY KEY CLUSTERED ([Id]),
        CONSTRAINT [FK_CompanyShareholders_Companies_CompanyId]
            FOREIGN KEY ([CompanyId]) REFERENCES [dbo].[Companies] ([Id])
            ON DELETE CASCADE
    );

    CREATE NONCLUSTERED INDEX [IX_CompanyShareholders_TenantId_CompanyId]
        ON [dbo].[CompanyShareholders] ([TenantId], [CompanyId]);
END
GO
