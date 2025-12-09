import fs from 'fs';
import path from 'path';

export function generateYearsIndex(yearsDir: string) {
  const yearFiles = fs
    .readdirSync(yearsDir)
    .filter((f) => f.endsWith('.json'))
    .sort();

  const years = yearFiles.map((f) => f.replace('.json', ''));

  const imports = years
    .map((year) => `import y${year} from './${year}.json';`)
    .join('\n');

  const spreads = years.map((year) => `  ...y${year},`).join('\n');

  const indexContent = `// Auto-generated - DO NOT EDIT MANUALLY
${imports}

type ApodEntry = {
  title: string;
  credit?: string;
  explanation?: string;
  date: string;
  hdurl?: string;
  service_version: string;
  copyright?: string;
  media_type: string;
  url?: string;
};

export const dataDictionary: Record<string, ApodEntry> = {
${spreads}
};

export const isoDates = Object.keys(dataDictionary);
export const dailyData: ApodEntry[] = Object.values(dataDictionary);
`;

  fs.writeFileSync(path.join(yearsDir, 'index.ts'), indexContent);
}
