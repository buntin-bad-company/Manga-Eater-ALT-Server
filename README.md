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

```json
{
  "titles": ["田んぼで拾った女騎士、田舎で俺の嫁だと思われている"],
  "outbound": [
    {
      "title": "田んぼで拾った女騎士、田舎で俺の嫁だと思われている",
      "episodes": ["1-25", "2-32", "3-15", "4-13", "5-22", "6-18"]
    }
  ]
}
```
