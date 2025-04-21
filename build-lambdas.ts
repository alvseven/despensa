import { execSync } from 'node:child_process';
import { createReadStream, createWriteStream, existsSync } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import zlib from 'node:zlib';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LAMBDAS_SRC_DIR = path.join(__dirname, '/src/shared/infra/aws/lambdas');
const LAMBDAS_OUT_DIR = 'aws/lambdas';
const ZIPS_DIR = path.join(LAMBDAS_OUT_DIR, 'zips');

async function findTsFiles(dir: string): Promise<string[]> {
  const files: string[] = [];
  const items = await fs.readdir(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = await fs.stat(fullPath);

    if (stat.isDirectory()) {
      files.push(...(await findTsFiles(fullPath)));
    } else if (fullPath.endsWith('.ts')) {
      files.push(fullPath);
    }
  }
  return files;
}

function buildLambda(lambdaFile: string): string {
  const lambdaName = path.basename(lambdaFile, '.ts');
  console.log(`Building Lambda: ${lambdaName}`);

  execSync(`tsup ${lambdaFile} --out-dir ${LAMBDAS_OUT_DIR} --format cjs --minify`, {
    stdio: 'inherit'
  });

  return lambdaName;
}

async function zipLambda(lambdaName: string): Promise<string> {
  console.log(`Zipping Lambda: ${lambdaName}`);

  if (!existsSync(ZIPS_DIR)) {
    await fs.mkdir(ZIPS_DIR, { recursive: true });
  }

  const inputFilePath = path.join(LAMBDAS_OUT_DIR, `${lambdaName}.cjs`);
  const outputFilePath = path.join(ZIPS_DIR, `${lambdaName}.zip`);

  return new Promise<string>((resolve, reject) => {
    const input = createReadStream(inputFilePath);
    const output = createWriteStream(outputFilePath);

    input.on('error', reject);
    output.on('error', reject);

    const gzip = zlib.createGzip();
    input
      .pipe(gzip)
      .pipe(output)
      .on('finish', () => {
        console.log(`Zipped Lambda ${lambdaName} to ${outputFilePath}`);
        resolve(outputFilePath);
      })
      .on('error', reject);
  });
}

async function buildAndZipAllLambdas(): Promise<void> {
  const tsFiles = await findTsFiles(LAMBDAS_SRC_DIR);
  console.log(`Found ${tsFiles.length} Lambda function(s)`);

  const zipPromises: Promise<string>[] = [];

  for (const tsFile of tsFiles) {
    try {
      const lambdaName = buildLambda(tsFile);
      zipPromises.push(zipLambda(lambdaName));
    } catch (error) {
      console.error(`Failed to process ${tsFile}:`, error);
    }
  }

  await Promise.all(zipPromises);
  console.log(`Successfully processed ${zipPromises.length} Lambda function(s)`);
}

buildAndZipAllLambdas()
  .then(() => console.log('Lambda build process completed'))
  .catch((error) => {
    console.error('Lambda build process failed:', error);
    process.exit(1);
  });
