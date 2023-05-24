# Manga-Eater-ALT-Server

## endpoint URI map

### GET

| URI          | Description                          | return                          |
| ------------ | ------------------------------------ | ------------------------------- |
| `/`          | Client Page(Mange-Eater-Client-Page) | string                          |
| `/channel`   | Infomation of Discord Channel        | channelNames:ChannelInfo        |
| `/directory` | Infomation of out directory          | DirectoryInfo:DirectoryOutbound |

### POST

| URI          | Description                |
| ------------ | -------------------------- |
| `/`          | Scraper Start              |
| `/channel`   | Change the current Channel |
| `/directory` | now developing             |

sample of DirectoryInfo

# 今後の展望

- スクレイピングの高速化
- Discordbot としてデーモン化
- ページを指定して、自動で更新を検知し、その分自動でスクレイピング&Disocrd にプッシュ
- Jobs に関して、Push、Fetch のカテゴリ検知機能をつける(ID で管理する予定。)


# モジュール依存関係の解消を行う

履歴
![履歴1](/assets/asset1.png)
![履歴2](/assets/asset2.png)