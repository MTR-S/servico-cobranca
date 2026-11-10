import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

export interface LoadEnvOptions {
  path?: string;
  override?: boolean;
}

export function loadEnv(options: LoadEnvOptions = {}): dotenv.DotenvConfigOutput {
  const envPath = options.path ?? path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    return dotenv.config({ path: envPath, override: options.override });
  }
  return dotenv.config(options);
}
