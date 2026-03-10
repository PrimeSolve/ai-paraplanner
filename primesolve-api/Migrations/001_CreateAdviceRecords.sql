-- ============================================================
-- Migration: Create AdviceRecords table
-- Date: 2026-03-10
-- Description: Stores immutable point-in-time advice history
--              snapshots (Fact Find, SOA Request, Cashflow Model)
-- ============================================================

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'AdviceRecords')
BEGIN
    CREATE TABLE [dbo].[AdviceRecords] (
        [Id]           UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
        [ClientId]     UNIQUEIDENTIFIER NOT NULL,
        [AdviserId]    UNIQUEIDENTIFIER NOT NULL,
        [TenantId]     UNIQUEIDENTIFIER NOT NULL,
        [Type]         NVARCHAR(50)     NOT NULL,
        [Name]         NVARCHAR(500)    NOT NULL,
        [CreatedAt]    DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),
        [CreatedBy]    NVARCHAR(255)    NOT NULL DEFAULT '',
        [SnapshotJson] NVARCHAR(MAX)    NOT NULL DEFAULT '{}',

        CONSTRAINT [PK_AdviceRecords] PRIMARY KEY CLUSTERED ([Id]),
        CONSTRAINT [FK_AdviceRecords_Clients] FOREIGN KEY ([ClientId])
            REFERENCES [dbo].[Clients] ([Id]) ON DELETE CASCADE
    );

    CREATE NONCLUSTERED INDEX [IX_AdviceRecords_TenantId_ClientId]
        ON [dbo].[AdviceRecords] ([TenantId], [ClientId]);

    CREATE NONCLUSTERED INDEX [IX_AdviceRecords_CreatedAt]
        ON [dbo].[AdviceRecords] ([CreatedAt] DESC);
END
GO
