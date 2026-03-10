-- Migration: Add AdviceRecords table
-- Date: 2026-03-10
-- Description: Creates the AdviceRecords table for immutable point-in-time advice snapshots.
-- NOTE: Do NOT run this migration without approval.

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'AdviceRecords')
BEGIN
    CREATE TABLE [dbo].[AdviceRecords] (
        [Id]           UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
        [ClientId]     UNIQUEIDENTIFIER NOT NULL,
        [AdviserId]    UNIQUEIDENTIFIER NOT NULL,
        [TenantId]     UNIQUEIDENTIFIER NOT NULL,
        [RecordType]            NVARCHAR(50)     NOT NULL,
        [Title]                 NVARCHAR(500)    NOT NULL,
        [CreatedAt]             DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),
        [CreatedBy]             NVARCHAR(255)    NOT NULL DEFAULT '',
        [FactFindSnapshot]      NVARCHAR(MAX)    NULL,
        [AdviceModelSnapshot]   NVARCHAR(MAX)    NULL,
        [ProjectionSnapshot]    NVARCHAR(MAX)    NULL,

        CONSTRAINT [PK_AdviceRecords] PRIMARY KEY CLUSTERED ([Id])
    );

    CREATE NONCLUSTERED INDEX [IX_AdviceRecords_TenantId_ClientId]
        ON [dbo].[AdviceRecords] ([TenantId], [ClientId]);

    CREATE NONCLUSTERED INDEX [IX_AdviceRecords_CreatedAt]
        ON [dbo].[AdviceRecords] ([CreatedAt] DESC);
END
GO
