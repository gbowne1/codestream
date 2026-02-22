import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Point to the root of the project or the data folder
export const rootDir = join(__dirname, '../../');
export const streamsFilePath = join(rootDir, 'streams.json');
