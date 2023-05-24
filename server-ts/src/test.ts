/* import * as utils from './scrapeUtils';
import fs from 'fs';
import type { Config } from './types';
import {
  ActionRowBuilder,
  ModalActionRowComponentBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from 'discord.js';
import { getTitleAndEpisodes } from './routes/utils'
import { get } from 'request';

const url =
  'https://mangarawjp.io/chapters/%E3%80%90%E7%AC%AC48.6%E8%A9%B1%E3%80%91%E3%82%A8%E3%83%AB%E3%83%95%E3%81%95%E3%82%93%E3%81%AF%E7%97%A9%E3%81%9B%E3%82%89%E3%82%8C%E3%81%AA%E3%81%84%E3%80%82-raw/';
(async () => {
  console.log(await getTitleAndEpisodes(url));
})();

const createModal = () => {
  const modal = new ModalBuilder().setCustomId('myModal').setTitle('My Modal');
  const favoriteColorInput = new TextInputBuilder()
    .setCustomId('favoriteColorInput')
    // The label is the prompt the user sees for this input
    .setLabel("What's your favorite color?")
    // Short means only a single line of text
    .setStyle(TextInputStyle.Short);
  const hobbiesInput = new TextInputBuilder()
    .setCustomId('hobbiesInput')
    .setLabel("What's some of your favorite hobbies?")
    // Paragraph means multiple lines of text.
    .setStyle(TextInputStyle.Paragraph);
  // An action row only holds one text input,
  // so you need one action row per text input.
  const firstActionRow =
    new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
      favoriteColorInput
    );
  const secondActionRow =
    new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
      hobbiesInput
    );
  modal.addComponents(firstActionRow, secondActionRow);
  const modalObj = modal.toJSON();
  fs.writeFileSync('modal.json', JSON.stringify(modalObj, null, 2));
  // Add inputs to the modal
  console.log(modal);
}; */
