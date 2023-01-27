import { useEnv } from "@share/lib/env/env"

const env = useEnv();

export const LocalFilesDefs = {
  DIR: `${env.DIR_DATA}/local_files`
};
