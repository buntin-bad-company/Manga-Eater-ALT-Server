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
  channel: {
    current: string;
    alt: string[];
  };
  channelNames?: ChannelInfo;
  logChannel?: string;
}

