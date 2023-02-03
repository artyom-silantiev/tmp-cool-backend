import { exec, execSync } from 'child_process';
import { promisify } from 'util';

const asyncExec = promisify(exec);
export async function sh(cmd: string) {
  console.log('$', cmd);
  const res = await asyncExec(cmd);
  return res;
}

export function shSync(cmd: string) {
  console.log('$', cmd);
  const res = execSync(cmd).toString();
  return res;
}
