

declare interface ChannelInfo {
  currentName: string;
  alt?: string[];
}

declare interface Archive {
  title: string;
  episodes: string[];
}

declare interface DirectoryOutbound {
  titles: string[];
  outbound: Archive[];
}

declare interface Checked {
  index: number;
  checked: number[];
}

declare interface Config {
  token: string;
  app_id: string;
  channel: {
    current: string;
    alt: string[];
  };
  channelNames?: ChannelInfo;
  logChannel?: string;
  version: string;
}

declare interface VersionInfo {
  version: string;
  build_id: string;
  build_message: string;
  number_of_jobs: number;
}

declare interface BC_GeneralPayload {
  type: string;
  eventInfo: {
    guild_id: string;
    channel_id: string;
    token: string;
    app_id: string;
  }
  data: any;
}
