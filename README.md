# Manga-Eater-ALT-Server

<details>
  <summary>API Endpoints Map</summary>

### GET

| URI           | Description                          | Payload | return                   |
| ------------- | ------------------------------------ | ------- | ------------------------ |
| `/`           | Client Page(Mange-Eater-Client-Page) | N/A     | text/html                |
| `/channel`    | Infomation of Discord Channel        | N/A     | `JSON`:ChannelInfo       |
| `/directory`  | Infomation of out directory          | N/A     | `JSON`:DirectoryOutbound |
| `/url`        | N/A                                  | N/A     | none                     |
| `/badcompany` | N/A                                  | N/A     | testString               |

### POST

| URI            | Description                | Payload              | return                      |
| -------------- | -------------------------- | -------------------- | --------------------------- |
| `/`            | Scraper Start              | `JSON`:RequestBody   | `Promise<string>`           |
| `/channel`     | Change the current Channel | `{index:number}`     | `Promise<string>`           |
| `/channel/add` | Add the Discord Channel    | `{channelID:string}` | `Promise<ChannelInfo>`t[^1] |
| `/directory`   | now developing             | N/A                  | r                           |
| `/url`         | d                          | N/A                  | t                           |
| `/badcompany`  | t                          | N/A                  | t                           |

[^1]: In the event of an error, the response will be `{current:'none'}`.

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
```

</details>

# 今後の展望

- スクレイピングの高速化
- Discordbot としてデーモン化
- ページを指定して、自動で更新を検知し、その分自動でスクレイピング&Disocrd にプッシュ
- Jobs に関して、Push、Fetch のカテゴリ検知機能をつける(ID で管理する予定。)

# モジュール依存関係の解消を行う

かなりよさげ
履歴
![履歴1](/assets/asset1.png)
![履歴2](/assets/asset2.png)
![履歴3](/assets/asset3.png)
