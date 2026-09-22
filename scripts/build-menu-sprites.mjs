import sharp from 'sharp';
import { mkdir, copyFile } from 'node:fs/promises';
import path from 'node:path';

const generated = 'C:/Users/guilh/.codex/generated_images/01a0c1dd-b060-7b82-9139-a0026be479ff';
const output = 'public/assets/ui';
const sources = {
  bag: 'exec-a42d7d48-f2b4-4f5b-a983-61781157d8b4.png',
  info: 'exec-eb62a431-8ec3-476e-a591-d6925664d7ea.png',
  stats: 'exec-100ae280-0ae9-4dd2-b99f-bd71e85e2349.png',
  types: 'exec-6821e3fe-e7bf-46b2-80cb-71736b424d6f.png',
  map: 'exec-18c9bc53-861f-4012-b3d7-58e673502ada.png',
  settings: 'exec-2b6cecac-8027-462c-be56-f39df4739708.png',
  pause: 'exec-4cdb20ce-d79e-4d44-8eef-932a4300c887.png',
  battle: 'exec-4df7a148-3291-43e1-8d76-41c4913386a7.png',
};

await mkdir(path.join(output, 'source'), { recursive: true });
for (const [name, filename] of Object.entries(sources)) {
  const input = path.join(generated, filename);
  await copyFile(input, path.join(output, 'source', `${name}.png`));
  await sharp(input)
    .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .resize(96, 96, { fit: 'contain', kernel: sharp.kernel.nearest, background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ palette: true, colours: 256 })
    .toFile(path.join(output, `${name}.png`));
}
