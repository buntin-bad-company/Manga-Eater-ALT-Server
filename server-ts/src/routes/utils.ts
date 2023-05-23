import { JSDOM } from 'jsdom';

export const getTitleAndEpisodes = async (url: string) => {
  try {
    const dom = await JSDOM.fromURL(url);
    const title = dom.window.document.title;
    const temp = title
      //all - to ー
      .replace('-', 'ー')
      .replace(' – Raw 【第', '-')
      .replace('話】', '')
      .replace(/ /g, '');
    const [t, e] = temp.split('-');
    return {
      title: t,
      episode: e,
    }
  } catch (err) {
    return {
      title: 'error',
      episode: 'desu',
    }
  }
};