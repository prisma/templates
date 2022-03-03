export const NextjsWithSqlserverWithReferentialIntegrityPrisma = [
  "\n\n-- CreateTable\nCREATE TABLE [dbo].[Post] (\n    [post_id] INT NOT NULL IDENTITY(1,1),\n    [content] NVARCHAR(1000),\n    [title] NVARCHAR(1000) NOT NULL,\n    [author_id] INT,\n    CONSTRAINT [Post_pkey] PRIMARY KEY ([post_id])\n)",
  "\n\n-- CreateTable\nCREATE TABLE [dbo].[Profile] (\n    [bio] NVARCHAR(1000),\n    [profile_id] INT NOT NULL IDENTITY(1,1),\n    [user_id] INT NOT NULL,\n    CONSTRAINT [Profile_pkey] PRIMARY KEY ([profile_id])\n)",
  "\n\n-- CreateTable\nCREATE TABLE [dbo].[User] (\n    [email] NVARCHAR(1000) NOT NULL,\n    [name] NVARCHAR(1000),\n    [user_id] INT NOT NULL IDENTITY(1,1),\n    CONSTRAINT [User_pkey] PRIMARY KEY ([user_id]),\n    CONSTRAINT [User_email_key] UNIQUE ([email])\n)"
]