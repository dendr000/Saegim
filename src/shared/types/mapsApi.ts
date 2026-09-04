export type MapsApi = {
  list: () => Promise<string[]>;
  get: (fileName: string) => Promise<string>;
};
