export const MusicStreamingServiceWithSqliteWithReferentialIntegrityPrisma = [
  "-- CreateTable\nCREATE TABLE \"User\" (\n    \"id\" TEXT NOT NULL PRIMARY KEY,\n    \"createdAt\" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,\n    \"updatedAt\" DATETIME NOT NULL,\n    \"name\" TEXT NOT NULL,\n    \"email\" TEXT NOT NULL\n)",
  "\n\n-- CreateTable\nCREATE TABLE \"Interaction\" (\n    \"id\" TEXT NOT NULL PRIMARY KEY,\n    \"createdAt\" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,\n    \"updatedAt\" DATETIME NOT NULL,\n    \"songId\" TEXT,\n    \"userId\" TEXT,\n    \"isLiked\" BOOLEAN NOT NULL DEFAULT false,\n    \"playCount\" INTEGER NOT NULL\n)",
  "\n\n-- CreateTable\nCREATE TABLE \"Song\" (\n    \"id\" TEXT NOT NULL PRIMARY KEY,\n    \"createdAt\" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,\n    \"updatedAt\" DATETIME NOT NULL,\n    \"name\" TEXT NOT NULL,\n    \"albumId\" TEXT,\n    \"artistId\" TEXT NOT NULL,\n    \"length\" REAL NOT NULL,\n    \"track\" INTEGER,\n    \"lyrics\" TEXT,\n    \"fileUrl\" TEXT NOT NULL\n)",
  "\n\n-- CreateTable\nCREATE TABLE \"Artist\" (\n    \"id\" TEXT NOT NULL PRIMARY KEY,\n    \"createdAt\" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,\n    \"updatedAt\" DATETIME NOT NULL,\n    \"name\" TEXT NOT NULL\n)",
  "\n\n-- CreateTable\nCREATE TABLE \"Album\" (\n    \"id\" TEXT NOT NULL PRIMARY KEY,\n    \"createdAt\" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,\n    \"updatedAt\" DATETIME NOT NULL,\n    \"name\" TEXT NOT NULL,\n    \"cover\" TEXT NOT NULL\n)",
  "\n\n-- CreateTable\nCREATE TABLE \"Playlist\" (\n    \"id\" TEXT NOT NULL PRIMARY KEY,\n    \"createdAt\" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,\n    \"updatedAt\" DATETIME NOT NULL,\n    \"userId\" TEXT,\n    \"name\" TEXT NOT NULL\n)",
  "\n\n-- CreateTable\nCREATE TABLE \"_AlbumToArtist\" (\n    \"A\" TEXT NOT NULL,\n    \"B\" TEXT NOT NULL\n)",
  "\n\n-- CreateTable\nCREATE TABLE \"_PlaylistToSong\" (\n    \"A\" TEXT NOT NULL,\n    \"B\" TEXT NOT NULL\n)",
  "\n\n-- CreateIndex\nCREATE UNIQUE INDEX \"User_email_key\" ON \"User\"(\"email\")",
  "\n\n-- CreateIndex\nCREATE UNIQUE INDEX \"_AlbumToArtist_AB_unique\" ON \"_AlbumToArtist\"(\"A\", \"B\")",
  "\n\n-- CreateIndex\nCREATE INDEX \"_AlbumToArtist_B_index\" ON \"_AlbumToArtist\"(\"B\")",
  "\n\n-- CreateIndex\nCREATE UNIQUE INDEX \"_PlaylistToSong_AB_unique\" ON \"_PlaylistToSong\"(\"A\", \"B\")",
  "\n\n-- CreateIndex\nCREATE INDEX \"_PlaylistToSong_B_index\" ON \"_PlaylistToSong\"(\"B\")"
]