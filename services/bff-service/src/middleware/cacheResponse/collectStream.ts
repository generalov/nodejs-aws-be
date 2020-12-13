import { PassThrough } from 'stream';

export const collectStream = (callback) => {
  const chunks = [];
  const pass = new PassThrough();
  pass.on('data', (chunk) => chunks.push(chunk));
  pass.on('error', (err) => callback(err));
  pass.on('end', () => callback(null, Buffer.concat(chunks)));
  return pass;
};
