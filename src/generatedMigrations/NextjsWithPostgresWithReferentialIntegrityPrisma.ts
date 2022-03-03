export const NextjsWithPostgresWithReferentialIntegrityPrisma = [
  "-- CreateTable\nCREATE TABLE \"Post\" (\n    \"post_id\" SERIAL NOT NULL,\n    \"content\" TEXT,\n    \"title\" TEXT NOT NULL,\n    \"author_id\" INTEGER,\n\n    CONSTRAINT \"Post_pkey\" PRIMARY KEY (\"post_id\")\n)",
  "\n\n-- CreateTable\nCREATE TABLE \"Profile\" (\n    \"bio\" TEXT,\n    \"profile_id\" SERIAL NOT NULL,\n    \"user_id\" INTEGER NOT NULL,\n\n    CONSTRAINT \"Profile_pkey\" PRIMARY KEY (\"profile_id\")\n)",
  "\n\n-- CreateTable\nCREATE TABLE \"User\" (\n    \"email\" TEXT NOT NULL,\n    \"name\" TEXT,\n    \"user_id\" SERIAL NOT NULL,\n\n    CONSTRAINT \"User_pkey\" PRIMARY KEY (\"user_id\")\n)",
  "\n\n-- CreateIndex\nCREATE UNIQUE INDEX \"User_email_key\" ON \"User\"(\"email\")"
]