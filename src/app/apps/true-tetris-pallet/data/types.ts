export type TetrisJson = Record<string, unknown>;

export interface TetrisOrderMetadata {
  orderNumber?: string;
  orderSeries?: string;
  customer?: string;
  orderDate?: string;
  destination?: string;
}

export interface TetrisSourceFile {
  name: string;
  path: string;
  type: string;
  size: number;
}

export interface TetrisShipment {
  id: string;
  title: string;
  metadata: TetrisOrderMetadata;
  settings: TetrisJson;
  plan: TetrisJson;
  summary: TetrisJson;
  sourceFile?: TetrisSourceFile | null;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
}

export type TetrisShipmentInput = Omit<TetrisShipment, "createdAt" | "updatedAt" | "createdBy">;

export interface TetrisShipmentListItem {
  id: string;
  title: string;
  metadata: TetrisOrderMetadata;
  summary: TetrisJson;
  sourceFile?: Pick<TetrisSourceFile, "name" | "path" | "type" | "size"> | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}
