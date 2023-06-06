declare interface BC_GeneralPayload {
  type: string;
  eventInfo: {
    guild_id: string;
    channel_id: string;
    token: string;
    app_id: string;
  };
  data: any;
}

declare type BCTask = {
  type: string;
  url?: string;
  id: string;
  channelId?: string;
  title?: number; //title index
  ep?: number; //episode index
};

declare type BCState = {
  version: string;
  queue: BCTask[];
  isProcessing: boolean;
};
