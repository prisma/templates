export const NextjsWithSqlserverWithReferentialIntegrityForeignKeys = [
  "\n\n-- CreateTable\nCREATE TABLE [dbo].[Post] (\n    [post_id] INT NOT NULL IDENTITY(1,1),\n    [content] NVARCHAR(1000),\n    [title] NVARCHAR(1000) NOT NULL,\n    [author_id] INT,\n    CONSTRAINT [Post_pkey] PRIMARY KEY ([post_id])\n)",
  "\n\n-- CreateTable\nCREATE TABLE [dbo].[Profile] (\n    [bio] NVARCHAR(1000),\n    [profile_id] INT NOT NULL IDENTITY(1,1),\n    [user_id] INT NOT NULL,\n    CONSTRAINT [Profile_pkey] PRIMARY KEY ([profile_id])\n)",
  "\n\n-- CreateTable\nCREATE TABLE [dbo].[User] (\n    [email] NVARCHAR(1000) NOT NULL,\n    [name] NVARCHAR(1000),\n    [user_id] INT NOT NULL IDENTITY(1,1),\n    CONSTRAINT [User_pkey] PRIMARY KEY ([user_id]),\n    CONSTRAINT [User_email_key] UNIQUE ([email])\n)",
  "\n\n-- AddForeignKey\nALTER TABLE [dbo].[Post] ADD CONSTRAINT [Post_author_id_fkey] FOREIGN KEY ([author_id]) REFERENCES [dbo].[User]([user_id]) ON DELETE SET NULL ON UPDATE CASCADE",
  "\n\n-- AddForeignKey\nALTER TABLE [dbo].[Profile] ADD CONSTRAINT [Profile_user_id_fkey] FOREIGN KEY ([user_id]) REFERENCES [dbo].[User]([user_id]) ON DELETE NO ACTION ON UPDATE CASCADE"
]