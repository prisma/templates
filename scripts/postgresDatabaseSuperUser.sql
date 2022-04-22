-- This script is to make the test database user a superadmin
-- so that databases can be force dropped at the end of tests. 
-- https://stackoverflow.com/questions/56249917/how-to-give-a-postgres-user-superuser-previllege-through-docker-compose
ALTER ROLE prisma SUPERUSER;
