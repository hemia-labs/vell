import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local' });

const isProduction = process.env.NODE_ENV === 'production';
const extension = isProduction ? 'js' : 'ts';
const baseDir = isProduction ? 'dist' : 'src';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME?.toString(),
  password: process.env.DB_PASSWORD?.toString(),
  database: process.env.DB_DATABASE?.toString(),

  entities: [path.join(process.cwd(), `${baseDir}/**/*.entity.${extension}`)],
  migrations: [path.join(process.cwd(), `${baseDir}/database/migrations/*.${extension}`)],
});

// Initialize the data source when running CLI commands
if (require.main === module) {
  AppDataSource.initialize()
    .then(() => {
      console.log('Data Source has been initialized!');
    })
    .catch((err) => {
      console.error('Error during Data Source initialization:', err);
      process.exit(1);
    });
}