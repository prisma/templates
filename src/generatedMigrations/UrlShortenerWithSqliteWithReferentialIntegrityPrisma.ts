export const UrlShortenerWithSqliteWithReferentialIntegrityPrisma = [
  "-- CreateTable\nCREATE TABLE \"Link\" (\n    \"id\" TEXT NOT NULL PRIMARY KEY,\n    \"createdAt\" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,\n    \"updatedAt\" DATETIME NOT NULL,\n    \"url\" TEXT NOT NULL,\n    \"shortUrl\" TEXT NOT NULL,\n    \"userId\" TEXT\n)",
  "\n\n-- CreateTable\nCREATE TABLE \"User\" (\n    \"id\" TEXT NOT NULL PRIMARY KEY,\n    \"createdAt\" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,\n    \"updatedAt\" DATETIME NOT NULL,\n    \"name\" TEXT,\n    \"email\" TEXT NOT NULL\n)"
]