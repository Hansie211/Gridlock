export const AppVersion = {
  major: Number(process.env.APP_VERSION_MAJOR as string),
  minor: Number(process.env.APP_VERSION_MINOR as string),
} as {
  readonly major: number;
  readonly minor: number;
};

export const AppName = process.env.APP_NAME as string;
