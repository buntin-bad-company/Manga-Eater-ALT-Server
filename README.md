# Manga-Eater-ALT-Server

<details>
  <summary>API Endpoints Map</summary>

### GET

| URI             | Description                          | Payload | return                   |
| --------------- | ------------------------------------ | ------- | ------------------------ |
| `/`             | Client Page(Mange-Eater-Client-Page) | N/A     | text/html                |
| `/channel`      | Infomation of Discord Channel        | N/A     | `JSON`:ChannelInfo       |
| `/directory`    | Infomation of out directory          | N/A     | `JSON`:DirectoryOutbound |
| `/url`          | N/A                                  | N/A     | none                     |
| `/badcompany`   | N/A                                  | N/A     | testString               |
| `/version`      | N/A                                  | N/A     | version:string           |
| `/version/info` | N/A                                  | N/A     | `JSON`:VersionInfo       |

### POST

| URI            | Description                | Payload                        | return                     |
| -------------- | -------------------------- | ------------------------------ | -------------------------- |
| `/`            | Scraper Start              | `JSON`:RequestBody             | `Promise<string>`          |
| `/channel`     | Change the current Channel | `{index:number}`               | `Promise<string>`          |
| `/channel/add` | Add the Discord Channel    | `{channelID:string}`           | `Promise<ChannelInfo>`[^1] |
| `/directory`   | now developing             | `{checked:Checked[]}`          | `Promise<string>`[^2]      |
| `/url`         | Scraper Start              | `{url:string, ifPush:boolean}` | `Promise<string>`          |
| `/badcompany`  | t                          | `JSON`:BC_GeneralPayload       | `Promise<string>`          |
| `/version`     | N/A                        | N/A                            | N/A                        |

### DELETE

| URI            | Description                 | Payload               | return            |
| -------------- | --------------------------- | --------------------- | ----------------- |
| `/`            | N/A                         | N/A                   | N/A               |
| `/channel`     | N/A                         | N/A                   | N/A               |
| `/channel/add` | N/A                         | N/A                   | N/A               |
| `/directory`   | Delete Selected Directories | `{checked:Checked[]}` | `Promise<string>` |
| `/url`         | N/A                         | N/A                   | N/A               |
| `/badcompany`  | N/A                         | N/A                   | N/A               |
| `/version`     | N/A                         | N/A                   | N/A               |

</details>
  
<details>
  <summary>API Endpoints Summary</summary>

## Endpoints

### `/` (root)

- **GET**: Returns the client page (Mange-Eater-Client-Page). No payload required. Returns `text/html`.
- **POST**: Starts the scraper. Requires a `JSON` payload (`RequestBody`). Returns a `Promise<string>`.

### `/channel`

- **GET**: Provides information about the Discord channel. No payload required. Returns `JSON` (`ChannelInfo`).
- **POST**: Changes the current channel. Requires a payload `{index:number}`. Returns a `Promise<string>`.
- **POST (`/channel/add`)**: Adds a Discord channel. Requires a payload `{channelID:string}`. Returns a `Promise<ChannelInfo>`.

### `/directory`

- **GET**: Provides information about the directory. No payload required. Returns `JSON` (`DirectoryOutbound`).
- **POST**: Under development. Requires a payload `{checked:Checked[]}`. Returns a `Promise<string>`.
- **DELETE**: Deletes selected directories. Requires a payload `{checked:Checked[]}`. Returns a `Promise<string>`.

### `/url`

- **POST**: Starts the scraper. Requires a payload `{url:string, ifPush:boolean}`. Returns a `Promise<string>`.

### `/badcompany`

- **GET**: Returns a test string. No payload required.
- **POST**: Payload required (`JSON`: `BC_GeneralPayload`). Returns a `Promise<string>`.

### `/version` and `/version/info`

- **GET**: Returns the version as a string (`/version`) or information about the version (`/version/info`) in `JSON` (`VersionInfo`). No payload required.

</details>

<details>
<summary>Types</summary>

```ts
interface RequestBody {
  title: string;
  urls?: string[];
  url?: string;
  ifPush?: boolean;
}
interface ChannelInfo {
  currentName: string;
  alt?: string[];
}
interface DirectoryOutbound {
  titles: string[];
  outbound: Archive[];
}
interface Checked {
  index: number;
  checked: number[];
}
interface VersionInfo {
  version: string;
  build_id: string;
  build_message: string;
  number_of_jobs: number;
}
interface BC_GeneralPayload {
  type: string;
  eventInfo: {
    guild_id: string;
    channel_id: string;
    token: string;
    app_id: string;
  };
  data: any;
}
```

</details>

<details>
<summary>BCHelper(BadCompany Helper) BC_generalPayload</summary>

BCHelper インスタンスは、BadCompanyRouter 内でジョブを追加されることで処理を実行し続けるブラックボックスインスタンス。
ジョブ追加は、BCTask 型のオブジェクトをキューに挿入することで実現。

```ts
type BCTask = {
  type: string;
  url?: string;
  id: string;
  channelId?: string;
};
```

### BCTask

| Property  | Type   | Description                                                                                              |
| --------- | ------ | -------------------------------------------------------------------------------------------------------- |
| type      | string | タスクのタイプを文字列で保持する。BC_GeneralPayload として BadCompanyRouter が受け取る type と基本同値。 |
| url?      | string | タスクに関する URL。chapterURL,titleURL のどちらかは使用時判断。                                         |
| id        | string | Task に関する ID。                                                                                       |
| channelId | string | プッシュ先の channelID。この時このチャンネルが bot からアクセス可能であることは保証される。              |

</details>

# 今後の展望

- []スクレイピングの高速化
- [x]Discordbot としてデーモン化
- ページを指定して、自動で更新を検知し、その分自動でスクレイピング&Disocrd にプッシュ
- [x]Jobs に関して、Push、Fetch のカテゴリ検知機能をつける(ID で管理する予定。)
- Cloudflare Workers でデプロイされているボットとバインディング

# モジュール依存関係の解消を行う

かなりよさげ
履歴
![履歴1](/assets/asset1.png)
![履歴2](/assets/asset2.png)
![履歴3](/assets/asset3.png)
![履歴4](/assets/asset4.png)

## お使いくださる方へ - For Users who want to use this

BCHelper.ts については、BadCompany クライアント(Cloudflare Workers 上で動作する Webhook ベースの Discord bot)からの処理を行うヘルパーインスタンスとなっています。この処理はブラックボックスで進み、index.ts で ssm(ServerStatusManger)を引数に初期化されます。
内部はジョブのキューとなっています。そのキューに要素がある限り実行され続けます。

Bad Company Client との連携機能を他のサーバーに住み分ける設定を構想中です。

Additionally, BCHelper.ts serves as a helper instance for handling processes from the BadCompany Client, a webhook-based Discord bot operating on Cloudflare Workers. This process proceeds as a black box, and it is initialized in index.ts with the ServerStatusManger (ssm) as an argument. Internally, it functions as a job queue, continuing to execute as long as there are elements in the queue.

We are considering a configuration to delegate the feature of collaboration with the Bad Company Client to other servers.

[^1]: In the event of an error, the response will be `{current:'none'}`.
[^2]: Checked is `{index:number,checked:number[]}`. index is the index of the titleDirectory(`DirectoryOutbound.titles.indexof(title)`).
