const requestOps: RequestInit = {
  method: 'GET',
  headers: {
    accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
    'accept-encoding': 'gzip, deflate, br',
    'accept-language':
      'ja-JP,ja;q=0.9,en-US;q=0.8,en-GB;q=0.7,en-IN;q=0.6,en-AU;q=0.5,en-CA;q=0.4,en-NZ;q=0.3,en-ZA;q=0.2,en;q=0.1',
    referer: 'https://mangarawjp.io/',
    'sec-ch-ua':
      '"Chromium";v="112", "Google Chrome";v="112", "Not:A-Brand";v="99"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': 'Windows',
    'sec-fetch-dest': 'image',
    'sec-fetch-mode': 'no-cors',
    'sec-fetch-site': 'cross-site',
    'user-agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36',
  },
};

/**
 * 指定された時間待機する非同期関数
 * @param ms {number} 待機時間(ms)
 * @returns {Promise<void>}
 */
const sleep = async (ms: number): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve, ms));
  return;
};

const calcPer = (numerator: number, denominator: number): number => {
  if (denominator === 0) {
    throw new Error('Denominator cannot be zero.');
  }

  let percentage = (numerator / denominator) * 100;
  return Math.round(percentage);
};
export {
  sleep, calcPer
};
