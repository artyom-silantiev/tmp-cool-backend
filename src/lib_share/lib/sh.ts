import { exec, execSync } from 'child_process';
import { promisify } from 'util';

const asyncExec = promisify(exec);
export async function sh(cmd: string) {
  console.log('sh:', cmd);
  const res = await asyncExec(cmd);
  return res;
}

export function shSync(cmd: string) {
  console.log('shSync:', cmd);
  const res = execSync(cmd).toString();
  return res;
}
