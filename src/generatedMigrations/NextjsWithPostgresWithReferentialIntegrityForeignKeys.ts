export const NextjsWithPostgresWithReferentialIntegrityForeignKeys = [
  "-- CreateTable\nCREATE TABLE \"Post\" (\n    \"post_id\" SERIAL NOT NULL,\n    \"content\" TEXT,\n    \"title\" TEXT NOT NULL,\n    \"author_id\" INTEGER,\n\n    CONSTRAINT \"Post_pkey\" PRIMARY KEY (\"post_id\")\n)",
  "\n\n-- CreateTable\nCREATE TABLE \"Profile\" (\n    \"bio\" TEXT,\n    \"profile_id\" SERIAL NOT NULL,\n    \"user_id\" INTEGER NOT NULL,\n\n    CONSTRAINT \"Profile_pkey\" PRIMARY KEY (\"profile_id\")\n)",
  "\n\n-- CreateTable\nCREATE TABLE \"User\" (\n    \"email\" TEXT NOT NULL,\n    \"name\" TEXT,\n    \"user_id\" SERIAL NOT NULL,\n\n    CONSTRAINT \"User_pkey\" PRIMARY KEY (\"user_id\")\n)",
  "\n\n-- CreateIndex\nCREATE UNIQUE INDEX \"User_email_key\" ON \"User\"(\"email\")",
  "\n\n-- AddForeignKey\nALTER TABLE \"Post\" ADD CONSTRAINT \"Post_author_id_fkey\" FOREIGN KEY (\"author_id\") REFERENCES \"User\"(\"user_id\") ON DELETE SET NULL ON UPDATE CASCADE",
  "\n\n-- AddForeignKey\nALTER TABLE \"Profile\" ADD CONSTRAINT \"Profile_user_id_fkey\" FOREIGN KEY (\"user_id\") REFERENCES \"User\"(\"user_id\") ON DELETE RESTRICT ON UPDATE CASCADE"
]