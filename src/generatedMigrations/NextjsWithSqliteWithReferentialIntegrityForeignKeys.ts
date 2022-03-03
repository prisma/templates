export const NextjsWithSqliteWithReferentialIntegrityForeignKeys = [
  "-- CreateTable\nCREATE TABLE \"Post\" (\n    \"post_id\" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,\n    \"content\" TEXT,\n    \"title\" TEXT NOT NULL,\n    \"author_id\" INTEGER,\n    CONSTRAINT \"Post_author_id_fkey\" FOREIGN KEY (\"author_id\") REFERENCES \"User\" (\"user_id\") ON DELETE SET NULL ON UPDATE CASCADE\n)",
  "\n\n-- CreateTable\nCREATE TABLE \"Profile\" (\n    \"bio\" TEXT,\n    \"profile_id\" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,\n    \"user_id\" INTEGER NOT NULL,\n    CONSTRAINT \"Profile_user_id_fkey\" FOREIGN KEY (\"user_id\") REFERENCES \"User\" (\"user_id\") ON DELETE RESTRICT ON UPDATE CASCADE\n)",
  "\n\n-- CreateTable\nCREATE TABLE \"User\" (\n    \"email\" TEXT NOT NULL,\n    \"name\" TEXT,\n    \"user_id\" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT\n)",
  "\n\n-- CreateIndex\nCREATE UNIQUE INDEX \"User_email_key\" ON \"User\"(\"email\")"
]