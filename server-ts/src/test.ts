import * as utils from './scrapeUtils';
import fs from 'fs';
import type { Config } from './types';
import {
  ActionRowBuilder,
  ModalActionRowComponentBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from 'discord.js';

const url =
  'https://mangarawjp.io/%e4%b8%96%e7%95%8c%e6%9c%80%e5%bc%b7%e3%81%ae%e5%be%8c%e8%a1%9b-%ef%bd%9e%e8%bf%b7%e5%ae%ae%e5%9b%bd%e3%81%ae%e6%96%b0%e4%ba%ba%e6%8e%a2%e7%b4%a2%e8%80%85%ef%bd%9e-raw-free/';

(async () => {
  const eps = ['1111', '1110', '11.11', '111.0', '1.1', '1', '0.1'];
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
};
