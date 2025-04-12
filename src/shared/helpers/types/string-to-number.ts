export type StringToNumber<T extends string> = T extends `${infer Value extends number}`
  ? Value
  : never;
