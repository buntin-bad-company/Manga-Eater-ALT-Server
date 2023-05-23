export interface ChannelInfo {
  currentName: string;
  alt?: string[];
}

export interface Archive {
  title: string;
  episodes: string[];
}

export interface DirectoryOutbound {
  titles: string[];
  outbound: Archive[];
}

export interface Checked {
  index: number;
  checked: number[];
}

export interface Config {
  token: string;
  channel: {
    current: string;
    alt: string[];
  };
  channelNames?: ChannelInfo;
  logChannel?: string;
}
