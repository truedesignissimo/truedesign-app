import type { TetrisShipmentInput } from "./data/types";

const CHANNEL = "true-tetris-archive";

type ArchiveAction = "list" | "load" | "save" | "delete" | "downloadSource";

interface ArchiveRequest {
  channel: typeof CHANNEL;
  requestId: string;
  action: ArchiveAction;
  payload?: Record<string, unknown>;
}

interface ArchiveRepository {
  list(): Promise<unknown>;
  load(id: string): Promise<unknown>;
  save(input: TetrisShipmentInput): Promise<unknown>;
  delete(id: string): Promise<void>;
  uploadSourceFile(shipmentId: string, file: File): Promise<unknown>;
  getSourceDownloadUrl(path: string): Promise<string>;
}

const isRecord = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === "object";

const isRequest = (value: unknown): value is ArchiveRequest => {
  if (!isRecord(value)) return false;
  return value.channel === CHANNEL
    && typeof value.requestId === "string"
    && ["list", "load", "save", "delete", "downloadSource"].includes(String(value.action));
};

const requiredString = (value: unknown, label: string): string => {
  if (typeof value !== "string" || !value) throw new Error(`${label} mancante`);
  return value;
};

export function createArchiveMessageHandler({
  repository,
  send,
}: {
  repository: ArchiveRepository;
  send: (message: Record<string, unknown>) => void;
}) {
  return async (event: MessageEvent): Promise<void> => {
    if (!isRequest(event.data)) return;
    const { requestId, action, payload = {} } = event.data;
    try {
      let data: unknown;
      if (action === "list") data = await repository.list();
      if (action === "load") data = await repository.load(requiredString(payload.id, "Identificativo piano"));
      if (action === "delete") {
        await repository.delete(requiredString(payload.id, "Identificativo piano"));
        data = null;
      }
      if (action === "downloadSource") data = await repository.getSourceDownloadUrl(requiredString(payload.path, "Percorso file"));
      if (action === "save") {
        const shipment = payload.shipment as TetrisShipmentInput | undefined;
        if (!shipment?.id) throw new Error("Piano mancante");
        const sourceFile = payload.sourceFile;
        if (typeof File !== "undefined" && sourceFile instanceof File) {
          shipment.sourceFile = await repository.uploadSourceFile(shipment.id, sourceFile) as TetrisShipmentInput["sourceFile"];
        }
        data = await repository.save(shipment);
      }
      send({ channel: CHANNEL, requestId, ok: true, data });
    } catch (error) {
      send({
        channel: CHANNEL,
        requestId,
        ok: false,
        error: error instanceof Error ? error.message : "Archivio non disponibile",
      });
    }
  };
}
